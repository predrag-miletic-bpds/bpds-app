import { describe, expect, it } from 'vitest';
import {
  DRILLS,
  getDrillByCode,
} from '@predrag-miletic/bpds-methodology.drill-catalog';
import type {
  Drill,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type {
  AgeGroup,
  SkillLevel,
} from '@predrag-miletic/bpds-storage.entities.shared-types';
import {
  buildWeeklyDevelopmentPlanV1,
  evaluateWeeklyCandidateV1,
  generateWeeklyProgramV1,
  resolveFocusWeightsV1,
  resolveModuleExposureTargetsV1,
  resolveOrganizationSuggestionV1,
  resolvePracticeRolesV1,
  resolveSsgConstraintV1,
  validateWeeklyProgramV1,
  type WeeklyDuration,
  type WeeklyFrequency,
  type WeeklyProgrammingInput,
} from './weekly-programming-engine-v1.js';

const template = getDrillByCode('SBH-L1-001') ?? DRILLS[0];

function ageGroupFor(age: number): AgeGroup {
  if (age <= 9) return 'U8';
  if (age <= 11) return 'U10';
  return 'U12';
}

function skillLabel(level: SkillLevel): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (level === 1) return 'Beginner';
  if (level === 2) return 'Intermediate';
  return 'Advanced';
}

function weeklyInput(
  age: number,
  level: SkillLevel,
  frequency: WeeklyFrequency = 3,
  duration: WeeklyDuration = 90,
): WeeklyProgrammingInput {
  return {
    trainingType: 'Team',
    playerIds: Array.from({ length: 12 }, (_, index) => 'p' + (index + 1)),
    teamId: 'team-1',
    ageGroup: ageGroupFor(age),
    chronologicalAge: age,
    skillLevel: skillLabel(level),
    bpdsLevel: level,
    playerCount: 12,
    baskets: 2,
    courtSize: 'Full court',
    equipment: ['Basketballs', 'Cones', 'No additional equipment'],
    primaryFocus: 'Ball Handling',
    secondaryFocus: 'Decision Making',
    intensity: 'Medium',
    withDefense: true,
    competitive: true,
    smallSidedGame: true,
    practicesPerWeek: frequency,
    practiceDuration: duration,
    practiceType: 'Development',
    strictPrerequisites: false,
    referenceDate: '2026-08-21T12:00:00.000Z',
    weekId: 'test-' + age + '-' + level + '-' + frequency,
  };
}

type DrillOptions = {
  id: string;
  name?: string;
  moduleCode?: string;
  level?: SkillLevel;
  stage?: ProgressionStage;
  family?: string;
  defender?: boolean;
  smallSidedPlayersPerTeam?: number;
};

function makeDrill(options: DrillOptions): Drill {
  const level = options.level ?? 1;
  const stage = options.stage ?? 'Technique';
  const family = options.family ?? 'Low Pound';
  const name = options.name ?? options.id;
  return {
    ...template,
    id: options.id,
    code: options.id.toUpperCase(),
    name,
    moduleCode: options.moduleCode ?? 'SBH',
    category: family,
    level,
    suitableAges: ['U8', 'U10', 'U12'],
    minPlayers: 1,
    maxPlayers: 20,
    courtArea: ['Small space', 'Half court', 'Full court'],
    equipment: ['Basketballs'],
    withDefense: options.defender ?? (stage === 'Defender' || stage === 'Game'),
    grouping: 'Both',
    published: true,
    tags: [family, name],
    objective: 'Develop ' + family,
    generator: {
      ...template.generator,
      schemaVersion: 1,
      minimumAge: 'U8',
      maximumAge: 'U12',
      typicalIntroductionAge: 'U8',
      difficultyScore: level * 3,
      primarySkill: family,
      secondarySkills: [],
      skillFamily: family,
      movementMode: stage === 'Technique' ? 'Stationary' : 'Moving',
      progressionStage: stage,
      trainingFormat:
        options.smallSidedPlayersPerTeam || options.defender ? 'Opposed' : 'Individual',
      minPlayers: 1,
      maxPlayers: 20,
      basketsRequired: 0,
      spaceRequired: 'Half court',
      equipmentRequired: ['Basketballs'],
      workSeconds: 40,
      restSeconds: 20,
      repetitions: 6,
      sets: 2,
      intensity: 'Medium',
      cognitiveLoad: stage === 'Game' ? 'High' : 'Low',
      reaction: stage === 'Reaction' || stage === 'Defender' || stage === 'Game',
      defender: options.defender ?? (stage === 'Defender' || stage === 'Game'),
      contactLevel: 'None',
      bothHands: true,
      combinationElements: stage === 'Combination' ? 2 : 1,
      tacticalComplexity: options.smallSidedPlayersPerTeam ? 2 : 1,
      smallSidedPlayersPerTeam: options.smallSidedPlayersPerTeam,
      athleticFocus: 'None',
      prerequisiteDrillIds: [],
      progressionDrillIds: [],
      regressionDrillIds: [],
      compatibleNextDrillIds: [],
      weeklyPriority: 3,
      preferredPracticesPerWeek: [1, 2, 3, 4, 5, 6],
      objective: 'Develop ' + family,
      execution: ['Execute with control.'],
      coachingPoints: ['Maintain balance and quality.'],
      commonMistakes: ['Rushing before control.'],
      corrections: ['Reduce speed and rebuild.'],
      performanceStandard: 'Stable quality repetitions.',
      gameTransfer: 'Use the skill in a game-like situation.',
      videoUrl: '',
    },
  };
}

const requiredProfiles: Array<{ age: number; level: SkillLevel }> = [
  { age: 8, level: 1 },
  { age: 9, level: 2 },
  { age: 10, level: 1 },
  { age: 10, level: 2 },
  { age: 11, level: 3 },
  { age: 12, level: 1 },
  { age: 12, level: 2 },
  { age: 13, level: 2 },
  { age: 13, level: 3 },
];

describe('BPDS Weekly Programming Engine v1', () => {
  it.each(requiredProfiles)(
    'builds a connected 3 x 90 week for age $age level $level',
    ({ age, level }) => {
      const input = weeklyInput(age, level);
      const plan = buildWeeklyDevelopmentPlanV1(input);

      expect(plan.activeInCoachApp).toBe(false);
      expect(plan.practicePlans).toHaveLength(3);
      expect(plan.practiceDuration).toBe(90);
      expect(plan.athleticRotation.slice(0, 3)).toEqual([
        'Speed / Acceleration',
        'Agility / Deceleration / Balance / Coordination',
        'Reaction / Coordination / Quickness',
      ]);
      expect(plan.practicePlans[0].roles).toEqual(['INTRODUCE', 'DEVELOP']);
      expect(plan.practicePlans[1].roles).toEqual(['REINFORCE', 'PROGRESS']);
      expect(plan.practicePlans[2].roles).toEqual(['APPLY', 'COMPETE', 'REVIEW']);
      expect(plan.practicePlans[0].primaryGoal).toContain('Ball Handling');
      expect(plan.practicePlans[1].primaryGoal).toContain('Passing');
      expect(plan.practicePlans[2].primaryGoal).toContain('Decision');
      expect(
        plan.practicePlans.every(
          (practice) =>
            practice.blocks.reduce((sum, block) => sum + block.duration, 0) === 90,
        ),
      ).toBe(true);
      expect(
        plan.practicePlans.every(
          (practice) =>
            practice.primaryGoal &&
            practice.secondaryGoal &&
            practice.reviewGoal &&
            practice.ssgConstraints.length === 1,
        ),
      ).toBe(true);
    },
  );

  it.each(requiredProfiles)(
    'generates age and level eligible drills without adjacent exact repetition for age $age level $level',
    ({ age, level }) => {
      const plan = generateWeeklyProgramV1(DRILLS, weeklyInput(age, level));
      expect(plan.practiceMemory).toHaveLength(3);
      expect(
        plan.practicePlans.every(
          (practice) =>
            practice.blocks.reduce((sum, block) => sum + block.duration, 0) === 90,
        ),
      ).toBe(true);
      expect(
        plan.practicePlans
          .flatMap((practice) => practice.blocks)
          .flatMap((block) => block.drills)
          .every((candidate) => candidate.eligible),
      ).toBe(true);

      for (let index = 1; index < plan.practiceMemory.length; index += 1) {
        const previous = new Set(plan.practiceMemory[index - 1].drillIds);
        expect(plan.practiceMemory[index].drillIds.some((id) => previous.has(id))).toBe(false);
      }
      expect(plan.validation.flags).not.toContain('DURATION_MISMATCH');
      expect(plan.validation.flags).not.toContain('AGE_COMPLEXITY_TOO_HIGH');
      expect(plan.validation.flags).not.toContain('LEVEL_COMPLEXITY_TOO_HIGH');
      expect(plan.validation.flags).not.toContain('PREREQUISITE_VIOLATION');
      expect(plan.practicePlans[2].ssgConstraints[0].format).not.toBe('5v5');
    },
  );

  it.each([1, 2, 4, 5, 6] as WeeklyFrequency[])(
    'keeps a connected architecture for %i practices',
    (frequency) => {
      const plan = buildWeeklyDevelopmentPlanV1(weeklyInput(11, 2, frequency));
      expect(plan.practicePlans).toHaveLength(frequency);
      expect(resolvePracticeRolesV1(frequency)).toHaveLength(frequency);
      expect(
        plan.practicePlans.every(
          (practice) =>
            practice.blocks.reduce((sum, block) => sum + block.duration, 0) === 90,
        ),
      ).toBe(true);
      expect(plan.practicePlans.at(-1)?.roles).toEqual(
        expect.arrayContaining(frequency === 1 ? ['APPLY'] : ['COMPETE']),
      );
      expect(
        plan.practicePlans.every((practice) => practice.weeklyConnection.length > 0),
      ).toBe(true);
    },
  );

  it.each([1, 2, 4, 5, 6] as WeeklyFrequency[])(
    'generates the requested count with no invalid selected drill for %i practices',
    (frequency) => {
      const plan = generateWeeklyProgramV1(
        DRILLS,
        weeklyInput(11, 2, frequency, 60),
      );
      expect(plan.practicePlans).toHaveLength(frequency);
      expect(
        plan.practicePlans
          .flatMap((practice) => practice.blocks)
          .flatMap((block) => block.drills)
          .every((candidate) => candidate.eligible),
      ).toBe(true);
      expect(plan.validation.flags).not.toContain('DURATION_MISMATCH');
      expect(plan.validation.flags).not.toContain('PREREQUISITE_VIOLATION');
    },
  );

  it('rewards a logical family progression and penalizes an exact repeat', () => {
    const input = weeklyInput(10, 2);
    const plan = buildWeeklyDevelopmentPlanV1(input);
    const technique = makeDrill({
      id: 'low-pound-technique',
      family: 'Low Pound',
      stage: 'Technique',
      level: 2,
    });
    const movement = makeDrill({
      id: 'low-pound-movement',
      family: 'Low Pound',
      stage: 'Movement',
      level: 2,
    });
    const sameStage = makeDrill({
      id: 'low-pound-technique-two',
      family: 'Low Pound',
      stage: 'Technique',
      level: 2,
    });

    plan.practiceMemory.push({
      practiceNumber: 1,
      drillIds: [technique.id],
      skillFamilies: ['Low Pound'],
      progressionStages: ['Technique'],
      moduleMinutes: { SBH: 3 },
      skillFamilyMinutes: { 'Low Pound': 3 },
      primaryGoal: 'Ball Handling',
      secondaryGoal: 'Finishing',
      reviewGoal: 'Technique',
      athleticStimulus: 'Speed / Acceleration',
      decisionSituations: [],
      ssgTypes: [],
    });
    plan.skillFamilyExposures['Low Pound'] = {
      skillFamily: 'Low Pound',
      states: ['introduced'],
      practiceNumbers: [1],
      stageHistory: ['Technique'],
      minutes: 3,
      drillIds: [technique.id],
    };

    const practice = plan.practicePlans[1];
    const block = practice.blocks.find((item) => item.type === 'REVIEW') ?? practice.blocks[0];
    const progressed = evaluateWeeklyCandidateV1(
      movement,
      input,
      plan,
      practice,
      block,
    );
    const repeated = evaluateWeeklyCandidateV1(
      technique,
      input,
      plan,
      practice,
      block,
    );
    const flat = evaluateWeeklyCandidateV1(
      sameStage,
      input,
      plan,
      practice,
      block,
    );

    expect(progressed.weeklyReasons.map((reason) => reason.code)).toContain(
      'logical-family-progression',
    );
    expect(repeated.weeklyReasons.map((reason) => reason.code)).toContain(
      'exact-previous-practice',
    );
    expect(flat.weeklyReasons.map((reason) => reason.code)).toContain(
      'same-family-same-stage',
    );
    expect(progressed.weeklyScore).toBeGreaterThan(flat.weeklyScore);
  });

  it('connects SSG constraints to the selected weekly goal', () => {
    const passing = resolveSsgConstraintV1('Passing', 'U10-11', 2, 2, 3);
    const shooting = resolveSsgConstraintV1('Shooting', 'U12-13', 3, 3, 3);
    const finishing = resolveSsgConstraintV1('Finishing', 'U8-9', 1, 1, 3);

    expect(passing.rules.join(' ')).toContain('dribble');
    expect(shooting.rules.join(' ')).toContain('Paint touch');
    expect(finishing.rules.join(' ')).toContain('advantage');
    expect(finishing.format).toBe('1v1');
    expect(shooting.format).toBe('4v4');
  });

  it('keeps quality, primary work and application when duration is short', () => {
    const plan = buildWeeklyDevelopmentPlanV1(weeklyInput(9, 1, 3, 30));
    for (const practice of plan.practicePlans) {
      expect(practice.blocks.reduce((sum, block) => sum + block.duration, 0)).toBe(30);
      expect(practice.blocks.some((block) => block.type === 'ATHLETIC')).toBe(true);
      expect(practice.blocks.some((block) => block.type === 'PRIMARY')).toBe(true);
      expect(practice.blocks.some((block) => block.type === 'APPLICATION')).toBe(true);
    }
    expect(resolveFocusWeightsV1('AUTO', 30)).toEqual({
      primary: 60,
      secondary: 15,
      maintenanceApplication: 25,
    });
  });

  it('uses age-specific module priorities without forcing every module', () => {
    const young = resolveModuleExposureTargetsV1('U8-9', 1, 3, 90);
    const older = resolveModuleExposureTargetsV1('U12-13', 3, 3, 90);

    expect(young.BM.priority).toBe('HIGH');
    expect(young.COM.priority).toBe('LOW');
    expect(older.MBH.priority).toBe('HIGH');
    expect(older.COM.priority).toBe('MODERATE-HIGH');
    expect(older.BM.priority).toBe('MAINTENANCE');
  });

  it('creates active station and partner formats with low waiting risk', () => {
    expect(resolveOrganizationSuggestionV1(2, 1).format).toBe('PARTNERS');
    const stations = resolveOrganizationSuggestionV1(12, 4);
    expect(stations.format).toBe('STATIONS');
    expect(stations.groups).toBe(4);
    expect(stations.playersPerGroup).toBe(3);
    expect(stations.waitingRisk).toBe('LOW');
  });

  it('tracks a rolling three-week memory architecture without exposing UI', () => {
    const first = buildWeeklyDevelopmentPlanV1(weeklyInput(12, 2));
    first.weekId = 'week-1';
    first.drillExposures.push({
      drillId: 'd1',
      skillFamily: 'Passing',
      progressionStage: 'Technique',
      state: 'introduced',
      practiceNumber: 1,
      minutes: 4,
    });
    first.skillFamilyExposures.Passing = {
      skillFamily: 'Passing',
      states: ['introduced'],
      practiceNumbers: [1],
      stageHistory: ['Technique'],
      minutes: 4,
      drillIds: ['d1'],
    };
    const input = weeklyInput(12, 2);
    input.previousWeeks = [first];
    const next = buildWeeklyDevelopmentPlanV1(input);

    expect(next.rollingThreeWeekContext.weekIds).toEqual(['week-1']);
    expect(next.rollingThreeWeekContext.drillIds).toContain('d1');
    expect(next.rollingThreeWeekContext.skillFamilies).toContain('Passing');
    expect(next.activeInCoachApp).toBe(false);
  });

  it('returns targeted validator flags instead of rebuilding the whole week', () => {
    const plan = buildWeeklyDevelopmentPlanV1(weeklyInput(10, 1));
    plan.practiceMemory = [
      {
        practiceNumber: 1,
        drillIds: ['repeat'],
        skillFamilies: ['Ball Handling'],
        progressionStages: ['Technique'],
        moduleMinutes: {},
        skillFamilyMinutes: {},
        primaryGoal: 'Ball Handling',
        secondaryGoal: 'Finishing',
        reviewGoal: 'Technique',
        athleticStimulus: plan.athleticRotation[0],
        decisionSituations: [],
        ssgTypes: [],
      },
      {
        practiceNumber: 2,
        drillIds: ['repeat'],
        skillFamilies: ['Ball Handling'],
        progressionStages: ['Technique'],
        moduleMinutes: {},
        skillFamilyMinutes: {},
        primaryGoal: 'Passing',
        secondaryGoal: 'Ball Handling',
        reviewGoal: 'Ball Handling',
        athleticStimulus: plan.athleticRotation[1],
        decisionSituations: [],
        ssgTypes: [],
      },
    ];

    const validation = validateWeeklyProgramV1(plan);
    expect(validation.flags).toContain('TOO_REPETITIVE');
    expect(
      validation.issues.find((issue) => issue.flag === 'TOO_REPETITIVE')
        ?.targetedRegeneration,
    ).toBe('BLOCK');
  });
});

