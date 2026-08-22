import {
  DRILLS,
  getDrillByCode,
} from '@predrag-miletic/bpds-methodology.drill-catalog';
import type {
  CognitiveLoad,
  ContactLevel,
  Drill,
  DrillGeneratorMetadata,
  ProgressionStage,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type {
  AgeGroup,
  SkillLevel,
} from '@predrag-miletic/bpds-storage.entities.shared-types';
import {
  AGE_BAND_ARCHITECTURE_V1,
  AGE_LEVEL_PROFILES_V1,
  AGE_SAFETY_HIERARCHY_V1,
  BASE_90_MINUTE_DISTRIBUTIONS_V1,
  assessAgeLevelSafetyV1,
  distributionToMinutesV1,
  evaluateDrillWithAgeLevelMatrixV1,
  generateBlockWithAgeLevelMatrixV1,
  getAgeLevelProfileV1,
  rankDrillsWithAgeLevelMatrixV1,
  resolveAthleticRotationV1,
  resolveBallHandlingRotationV1,
  resolvePracticeDistributionV1,
  type AgeLevelMatrixContext,
} from './age-level-matrix-v1.js';

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

function context(
  chronologicalAge: number,
  bpdsLevel: SkillLevel,
  currentTrainingDay = 1,
): AgeLevelMatrixContext {
  return {
    trainingType: 'Team',
    playerIds: ['p1', 'p2'],
    teamId: 'team-1',
    ageGroup: ageGroupFor(chronologicalAge),
    chronologicalAge,
    skillLevel: skillLabel(bpdsLevel),
    bpdsLevel,
    duration: 90,
    playerCount: 10,
    baskets: 2,
    courtSize: 'Full court',
    equipment: [
      'Basketballs',
      'Cones',
      'No additional equipment',
    ],
    primaryFocus: 'Ball Handling',
    secondaryFocus: 'Decision Making',
    intensity: 'Medium',
    withDefense: true,
    competitive: true,
    smallSidedGame: true,
    practicesPerWeek: 3,
    currentTrainingDay,
    practiceType: 'Development',
    strictPrerequisites: true,
    referenceDate: '2026-08-21T12:00:00.000Z',
  };
}

type DrillOptions = {
  id: string;
  name?: string;
  moduleCode?: string;
  level?: SkillLevel;
  difficulty?: number;
  stage?: ProgressionStage;
  family?: string;
  cognitiveLoad?: CognitiveLoad;
  contactLevel?: ContactLevel;
  combinationElements?: number;
  offDribbleShooting?: boolean;
  tacticalComplexity?: 1 | 2 | 3;
  smallSidedPlayersPerTeam?: number;
  athleticFocus?: DrillGeneratorMetadata['athleticFocus'];
  prerequisiteDrillIds?: string[];
  compatibleNextDrillIds?: string[];
  equipmentRequired?: string[];
  basketsRequired?: number;
};

function makeDrill(options: DrillOptions): Drill {
  const level = options.level ?? 1;
  const stage = options.stage ?? 'Technique';
  const name = options.name ?? options.id;
  return {
    ...template,
    id: options.id,
    code: options.id.toUpperCase(),
    name,
    moduleCode: options.moduleCode ?? 'SBH',
    category: options.family ?? 'Ball Handling',
    level,
    suitableAges: ['U8', 'U10', 'U12'],
    minPlayers: 1,
    maxPlayers: 20,
    courtArea: ['Small space', 'Half court', 'Full court'],
    equipment: options.equipmentRequired ?? ['Basketballs'],
    withDefense: stage === 'Defender' || stage === 'Game',
    grouping: 'Both',
    published: true,
    generator: {
      ...template.generator,
      schemaVersion: 1,
      minimumAge: 'U8',
      maximumAge: 'U12',
      typicalIntroductionAge: 'U8',
      difficultyScore: options.difficulty ?? level * 3,
      primarySkill: options.family ?? 'Ball Handling',
      secondarySkills: [],
      skillFamily: options.family ?? name,
      movementMode: stage === 'Technique' ? 'Stationary' : 'Moving',
      progressionStage: stage,
      trainingFormat: 'Both',
      minPlayers: 1,
      maxPlayers: 20,
      basketsRequired: options.basketsRequired ?? 0,
      spaceRequired: 'Any',
      equipmentRequired: options.equipmentRequired ?? ['Basketballs'],
      workSeconds: 30,
      restSeconds: 15,
      repetitions: 4,
      sets: 2,
      intensity: 'Medium',
      cognitiveLoad: options.cognitiveLoad ?? 'Low',
      reaction: stage === 'Reaction',
      defender: stage === 'Defender' || stage === 'Game',
      contactLevel: options.contactLevel ?? 'None',
      bothHands: level > 1,
      combinationElements: options.combinationElements ?? 1,
      offDribbleShooting: options.offDribbleShooting ?? false,
      tacticalComplexity: options.tacticalComplexity ?? 1,
      smallSidedPlayersPerTeam: options.smallSidedPlayersPerTeam ?? 1,
      athleticFocus: options.athleticFocus ?? 'None',
      prerequisiteDrillIds: options.prerequisiteDrillIds ?? [],
      progressionDrillIds: [],
      regressionDrillIds: [],
      compatibleNextDrillIds: options.compatibleNextDrillIds ?? [],
      weeklyPriority: 1,
      preferredPracticesPerWeek: [1, 2, 3],
      objective: 'Develop ' + (options.family ?? 'the selected skill'),
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

function sumDistribution(
  distribution: Record<string, number>,
): number {
  return Object.values(distribution).reduce((sum, value) => sum + value, 0);
}

const requiredProfiles: Array<{
  age: number;
  level: SkillLevel;
  expected: string;
}> = [
  { age: 8, level: 1, expected: 'A-L1' },
  { age: 9, level: 2, expected: 'A-L2' },
  { age: 10, level: 1, expected: 'B-L1' },
  { age: 10, level: 2, expected: 'B-L2' },
  { age: 11, level: 3, expected: 'B-L3' },
  { age: 12, level: 1, expected: 'C-L1' },
  { age: 12, level: 2, expected: 'C-L2' },
  { age: 13, level: 2, expected: 'C-L2' },
  { age: 13, level: 3, expected: 'C-L3' },
];

describe('BPDS AGE x LEVEL Matrix v1', () => {
  it.each(requiredProfiles)(
    'resolves $age-year-old Level $level for a 90-minute, three-practice week',
    ({ age, level, expected }) => {
      const profile = getAgeLevelProfileV1(age, level);
      const trainingDay = ((age + level) % 3) + 1;
      const distribution = resolvePracticeDistributionV1({
        chronologicalAge: age,
        bpdsLevel: level,
        duration: 90,
        currentTrainingDay: trainingDay,
        practiceType: 'Development',
      });
      const minutes = distributionToMinutesV1(distribution, 90);

      expect(profile?.id).toBe(expected);
      expect(profile?.level).toBe(level);
      expect(sumDistribution(distribution)).toBe(100);
      expect(sumDistribution(minutes)).toBe(90);
      expect(context(age, level, trainingDay).practicesPerWeek).toBe(3);
    },
  );

  it('stores the exact 90-minute base distributions from the methodology spec', () => {
    expect(BASE_90_MINUTE_DISTRIBUTIONS_V1.A).toEqual({
      movementAthletic: 18,
      ballHandling: 20,
      technicalSkills: 22,
      skillApplicationDecision: 15,
      smallSidedGames: 20,
      competitionReview: 5,
    });
    expect(BASE_90_MINUTE_DISTRIBUTIONS_V1.B).toEqual({
      movementAthletic: 15,
      ballHandling: 15,
      technicalSkills: 30,
      skillApplicationDecision: 15,
      smallSidedGames: 20,
      competitionReview: 5,
    });
    expect(BASE_90_MINUTE_DISTRIBUTIONS_V1.C).toEqual({
      movementAthletic: 13,
      ballHandling: 12,
      technicalSkills: 30,
      skillApplicationDecision: 20,
      smallSidedGames: 20,
      competitionReview: 5,
    });
  });

  it('keeps age safety above a Level 3 label', () => {
    const advanced = makeDrill({
      id: 'advanced-live-combination',
      name: 'Three Element Live Defender Combination',
      moduleCode: 'COM',
      level: 3,
      difficulty: 8,
      stage: 'Defender',
      family: 'Advanced Combination',
      cognitiveLoad: 'High',
      contactLevel: 'Live',
      combinationElements: 3,
      tacticalComplexity: 3,
    });

    const young = evaluateDrillWithAgeLevelMatrixV1(
      advanced,
      context(9, 3),
    );
    const older = evaluateDrillWithAgeLevelMatrixV1(
      advanced,
      context(13, 3),
    );

    expect(young.eligible).toBe(false);
    expect(young.matrixExclusions.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'age-level-difficulty',
        'cognitive-load',
        'contact-level',
        'combination-complexity',
      ]),
    );
    expect(older.eligible).toBe(true);
  });

  it('requires prerequisites before level, need, context, and score can select a drill', () => {
    const foundation = makeDrill({
      id: 'low-pound-technique',
      name: 'Low Pound RH and LH',
      difficulty: 3,
      stage: 'Technique',
      family: 'Low Pound',
    });
    const movement = makeDrill({
      id: 'low-pound-movement',
      name: 'Low Pound in Movement',
      level: 2,
      difficulty: 5,
      stage: 'Movement',
      family: 'Low Pound',
      prerequisiteDrillIds: [foundation.id],
    });

    const missing = evaluateDrillWithAgeLevelMatrixV1(
      movement,
      context(10, 2),
    );
    const completed = evaluateDrillWithAgeLevelMatrixV1(
      movement,
      {
        ...context(10, 2),
        completedDrillIds: [foundation.id],
      },
    );

    expect(missing.eligible).toBe(false);
    expect(missing.selectionData.prerequisiteStatus).toBe('missing');
    expect(completed.eligible).toBe(true);
    expect(completed.selectionData.prerequisiteStatus).toBe('satisfied');
  });

  it('orders generated drills by methodology without interleaving modules', () => {
    const warmUp = makeDrill({
      id: 'warm-up',
      moduleCode: 'WUP',
      name: 'Movement Warm-Up',
      difficulty: 2,
    });
    const mastery = makeDrill({
      id: 'ball-mastery',
      moduleCode: 'BM',
      name: 'Ball Around the Head',
      difficulty: 2,
    });
    const stationary = makeDrill({
      id: 'stationary-handling',
      moduleCode: 'SBH',
      name: 'Low Pound',
      difficulty: 3,
      family: 'Low Pound',
    });
    const change = makeDrill({
      id: 'change-of-direction',
      moduleCode: 'COD',
      name: 'Crossover Change of Direction',
      level: 2,
      difficulty: 5,
      stage: 'Movement',
      family: 'Crossover',
    });
    const drills = [change, stationary, mastery, warmUp];
    const block = generateBlockWithAgeLevelMatrixV1(
      drills,
      context(10, 2),
      {
        id: 'methodical-order',
        focus: 'Ball Handling',
        duration: 20,
        targetDrills: 4,
        lockedDrillIds: drills.map((drill) => drill.id),
      },
    );

    expect(block.items.map((item) => item.drill.moduleCode)).toEqual([
      'WUP',
      'BM',
      'SBH',
      'COD',
    ]);
  });

  it('rotates youth athletic development across the three weekly practices', () => {
    expect(resolveAthleticRotationV1(1, 'A').focus).toBe(
      'Speed / Acceleration',
    );
    expect(resolveAthleticRotationV1(2, 'B').focus).toBe(
      'Agility / Balance / Deceleration',
    );
    expect(resolveAthleticRotationV1(3, 'C').focus).toBe(
      'Reaction / Coordination',
    );
  });

  it('uses the agreed ball-handling family rotation', () => {
    expect(resolveBallHandlingRotationV1(1).families).toEqual([
      'Low Pound',
      'Crossover',
      'Behind the Back',
    ]);
    expect(resolveBallHandlingRotationV1(2).families).toEqual([
      'Between the Legs',
      'V Side',
      'V Front',
      'In and Out',
    ]);
    expect(resolveBallHandlingRotationV1(3).integratedModules).toEqual([
      'MBH',
      'COD',
      'COM',
      'OCS',
      'SSG',
    ]);
  });

  it('prefers a fresh drill over one used within three days', () => {
    const recent = makeDrill({
      id: 'recent-low-pound',
      name: 'Low Pound Recent',
      difficulty: 3,
      family: 'Low Pound',
    });
    const fresh = makeDrill({
      id: 'fresh-low-pound',
      name: 'Low Pound Fresh',
      difficulty: 3,
      family: 'Low Pound',
    });
    const ranked = rankDrillsWithAgeLevelMatrixV1(
      [recent, fresh],
      {
        ...context(10, 1),
        previousPracticeHistory: [
          {
            drillId: recent.id,
            usedAt: '2026-08-20T12:00:00.000Z',
          },
        ],
      },
    );

    expect(ranked[0].drill.id).toBe(fresh.id);
    expect(
      ranked.find((item) => item.drill.id === recent.id)
        ?.selectionData.historyScore,
    ).toBe(0);
  });

  it('rewards a coherent family progression and penalizes same-stage repetition', () => {
    const technique = makeDrill({
      id: 'low-pound-technique-chain',
      name: 'Low Pound Technique',
      difficulty: 3,
      stage: 'Technique',
      family: 'Low Pound',
    });
    const movement = makeDrill({
      id: 'low-pound-movement-chain',
      name: 'Low Pound Moving',
      level: 2,
      difficulty: 5,
      stage: 'Movement',
      family: 'Low Pound',
    });
    const duplicate = makeDrill({
      id: 'low-pound-technique-duplicate',
      name: 'Low Pound Technique Duplicate',
      difficulty: 3,
      stage: 'Technique',
      family: 'Low Pound',
    });

    const progressed = evaluateDrillWithAgeLevelMatrixV1(
      movement,
      context(10, 2),
      [technique],
    );
    const repeated = evaluateDrillWithAgeLevelMatrixV1(
      duplicate,
      context(10, 2),
      [technique],
    );

    expect(progressed.selectionData.coherenceBonus).toBeGreaterThan(0);
    expect(progressed.matrixReasons.map((item) => item.code)).toContain(
      'coherent-progression',
    );
    expect(repeated.matrixReasons.map((item) => item.code)).toContain(
      'same-stage-repetition',
    );
  });

  it('lets later blocks depend on earlier drills and stores the full internal audit', () => {
    const technique = makeDrill({
      id: 'crossover-technique',
      name: 'Crossover Technique',
      level: 2,
      difficulty: 5,
      stage: 'Technique',
      family: 'Crossover',
      compatibleNextDrillIds: ['crossover-movement'],
    });
    const movement = makeDrill({
      id: 'crossover-movement',
      name: 'Crossover in Movement',
      level: 2,
      difficulty: 6,
      stage: 'Movement',
      family: 'Crossover',
    });
    const block = generateBlockWithAgeLevelMatrixV1(
      [technique, movement],
      context(10, 2),
      {
        id: 'application-block',
        focus: 'Ball Handling',
        duration: 8,
        targetDrills: 1,
        priorDrillIds: [technique.id],
      },
      [technique.id],
    );
    const selected = block.items[0];

    expect(selected.drill.id).toBe(movement.id);
    expect(selected.selectionData.practiceBlock).toBe('application-block');
    expect(selected.selectionData.coherenceBonus).toBeGreaterThan(0);
    expect(selected.selectionData).toEqual(
      expect.objectContaining({
        selectedDrillId: movement.id,
        selectionScore: expect.any(Number),
        ageFit: expect.any(Number),
        levelFit: expect.any(Number),
        goalMatch: expect.any(Number),
        weeklyNeed: expect.any(Number),
        historyScore: expect.any(Number),
        prerequisiteStatus: expect.any(String),
        resourceFit: expect.any(Number),
        coherenceBonus: expect.any(Number),
        selectionReasons: expect.any(Array),
      }),
    );
  });

  it('does not let a coach priority override bypass youth safety', () => {
    const unsafe = makeDrill({
      id: 'coach-priority-unsafe',
      name: 'Priority Advanced Live Three-Part Combination',
      moduleCode: 'ADV',
      level: 3,
      difficulty: 10,
      stage: 'Defender',
      family: 'Advanced',
      cognitiveLoad: 'High',
      contactLevel: 'Live',
      combinationElements: 3,
      tacticalComplexity: 3,
    });
    const result = evaluateDrillWithAgeLevelMatrixV1(
      unsafe,
      {
        ...context(8, 1),
        coachPriorityDrillIds: [unsafe.id],
      },
    );

    expect(result.matrixReasons.map((item) => item.code)).toContain(
      'coach-priority',
    );
    expect(result.eligible).toBe(false);
    expect(result.matrixExclusions.length).toBeGreaterThan(0);
  });

  it('keeps the three later age bands prepared but inactive', () => {
    expect(AGE_BAND_ARCHITECTURE_V1.map((band) => band.id)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
    ]);
    expect(
      AGE_BAND_ARCHITECTURE_V1.filter((band) => band.configured).map(
        (band) => band.id,
      ),
    ).toEqual(['A', 'B', 'C']);
    expect(getAgeLevelProfileV1(14, 1)).toBeUndefined();
  });

  it('keeps the documented safety hierarchy and all nine profiles', () => {
    expect(AGE_SAFETY_HIERARCHY_V1).toEqual([
      'Age appropriateness',
      'Prerequisites',
      'BPDS Level',
      'Development need',
      'Weekly context',
      'Drill score',
    ]);
    expect(Object.keys(AGE_LEVEL_PROFILES_V1)).toHaveLength(9);
  });

  it('applies the age-specific safety assessor independently of scoring', () => {
    const largeGame = makeDrill({
      id: 'five-on-five-game',
      name: '5v5 Live Game',
      moduleCode: 'SSG',
      level: 3,
      difficulty: 7,
      stage: 'Game',
      family: 'Small-Sided Game',
      cognitiveLoad: 'Medium',
      contactLevel: 'Guided',
      tacticalComplexity: 2,
      smallSidedPlayersPerTeam: 5,
    });

    expect(
      assessAgeLevelSafetyV1(largeGame, 9, 3).map((item) => item.code),
    ).toContain('small-sided-size');
    expect(assessAgeLevelSafetyV1(largeGame, 13, 3)).toEqual([]);
  });

  it('shifts Level 1 toward technique and Level 3 toward application', () => {
    const levelOne = resolvePracticeDistributionV1({
      chronologicalAge: 12,
      bpdsLevel: 1,
      duration: 90,
      primaryFocus: '',
    });
    const levelThree = resolvePracticeDistributionV1({
      chronologicalAge: 12,
      bpdsLevel: 3,
      duration: 90,
      primaryFocus: '',
    });

    expect(levelOne.technicalSkills).toBeGreaterThan(
      levelThree.technicalSkills,
    );
    expect(
      levelThree.skillApplicationDecision + levelThree.smallSidedGames,
    ).toBeGreaterThan(
      levelOne.skillApplicationDecision + levelOne.smallSidedGames,
    );
  });
});

