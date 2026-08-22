import { describe, expect, it } from 'vitest';
import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type {
  AgeGroup,
  SkillLevel,
} from '@predrag-miletic/bpds-storage.entities.shared-types';
import {
  DEFAULT_EXPOSURE_CREDIT_WEIGHTS,
  MODULE_FREQUENCY_MATRIX_V1,
  calculateWeeklyModuleExposureV1,
  effectiveDevelopmentMinutesV1,
  formatFourWeekSimulationSummaryV1,
  generateModuleMatrixWeekV1,
  getModuleFrequencyProfileV1,
  runU12Level2FourWeekSimulationV1,
  scaleModuleFrequencyTargetsV1,
  validateModuleFrequencyWeekV1,
  type ModuleFrequencyProfileKey,
} from './module-frequency-minutes-matrix-v1.js';
import type {
  WeeklyDuration,
  WeeklyFrequency,
  WeeklyProgrammingInput,
} from './weekly-programming-engine-v1.js';

function ageGroupFor(age: number): AgeGroup {
  if (age <= 9) return 'U8';
  if (age <= 11) return 'U10';
  return 'U12';
}

function skillLabel(
  level: SkillLevel,
): 'Beginner' | 'Intermediate' | 'Advanced' {
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
    teamId: 'matrix-test-team',
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
    focusPreset: 'AUTO',
    referenceDate: '2026-08-24T12:00:00.000Z',
    weekId: 'matrix-' + age + '-' + level + '-' + frequency + '-' + duration,
  };
}

const PROFILE_CASES: Array<{
  key: ModuleFrequencyProfileKey;
  age: number;
  level: SkillLevel;
}> = [
  { key: 'U8-9-L1', age: 8, level: 1 },
  { key: 'U8-9-L2', age: 9, level: 2 },
  { key: 'U8-9-L3', age: 9, level: 3 },
  { key: 'U10-11-L1', age: 10, level: 1 },
  { key: 'U10-11-L2', age: 11, level: 2 },
  { key: 'U10-11-L3', age: 11, level: 3 },
  { key: 'U12-13-L1', age: 12, level: 1 },
  { key: 'U12-13-L2', age: 12, level: 2 },
  { key: 'U12-13-L3', age: 13, level: 3 },
];

describe('BPDS Module Frequency & Minutes Matrix v1.0', () => {
  it('defines all nine age-level profiles and complete target contracts', () => {
    expect(Object.keys(MODULE_FREQUENCY_MATRIX_V1)).toHaveLength(9);

    for (const profileCase of PROFILE_CASES) {
      const profile = getModuleFrequencyProfileV1(
        profileCase.age,
        profileCase.level,
      );
      expect(profile.key).toBe(profileCase.key);
      expect(profile.baselinePracticesPerWeek).toBe(3);
      expect(profile.baselinePracticeDuration).toBe(90);
      expect(profile.baselineWeeklyMinutes).toBe(270);
      expect(Object.keys(profile.targets).length).toBeGreaterThanOrEqual(20);

      for (const target of Object.values(profile.targets)) {
        expect(target.minimumWeeklyMinutes).toBeLessThanOrEqual(
          target.targetWeeklyMinutesMin,
        );
        expect(target.targetWeeklyMinutesMin).toBeLessThanOrEqual(
          target.targetWeeklyMinutesMax,
        );
        expect(target.targetWeeklyMinutesMax).toBeLessThanOrEqual(
          target.maximumWeeklyMinutes,
        );
        expect(target.targetFrequencyMin).toBeLessThanOrEqual(
          target.targetFrequencyMax,
        );
        expect(target.roles.length).toBeGreaterThan(0);
        expect(target.allowedProgressionStages.length).toBeGreaterThan(0);
        expect(target.ageLevelProfile).toBe(profile.key);
        expect(['YES', 'NO', 'CONDITIONAL']).toContain(
          target.requiredWeeklyExposure,
        );
      }
    }
  });

  it('moves methodology from foundations toward application across levels', () => {
    const u8l1 = getModuleFrequencyProfileV1(8, 1);
    const u12l3 = getModuleFrequencyProfileV1(13, 3);
    const target = (
      profile: typeof u8l1,
      label: string,
    ) => Object.values(profile.targets).find((item) => item.label === label)!;

    expect(target(u8l1, 'Ball Mastery').priority).toBe('CORE');
    expect(target(u8l1, 'Stationary Ball Handling').priority).toBe('CORE');
    expect(target(u8l1, 'Two-Ball Series').priority).toBe('CONDITIONAL');
    expect(target(u12l3, 'Ball Mastery').priority).toBe('LOW');
    expect(
      target(u12l3, '1-on-1 Offensive Development').priority,
    ).toBe('CORE');
    expect(target(u12l3, 'Situational / SSG').priority).toBe('CORE');
    expect(
      target(u12l3, 'Situational / SSG').targetWeeklyMinutesMin,
    ).toBeGreaterThan(
      target(u8l1, 'Situational / SSG').targetWeeklyMinutesMin,
    );
  });

  it('uses explicit overlapping development-credit weights', () => {
    expect(DEFAULT_EXPOSURE_CREDIT_WEIGHTS).toEqual({
      PRIMARY: 1,
      SECONDARY: 0.5,
      MAINTENANCE: 0.4,
      APPLICATION: 1,
      INTEGRATED: 0.25,
    });
    expect(effectiveDevelopmentMinutesV1(10, 0.9, 1)).toBe(9);
    expect(effectiveDevelopmentMinutesV1(10, 0.9, 0.5)).toBe(4.5);
    expect(effectiveDevelopmentMinutesV1(10, 0.9, 0.25)).toBe(2.25);
  });

  it('scales short and long weeks nonlinearly while protecting core work', () => {
    const profile = getModuleFrequencyProfileV1(12, 2);
    const baseline = scaleModuleFrequencyTargetsV1(profile, 3, 90);
    const short = scaleModuleFrequencyTargetsV1(profile, 1, 30);
    const long = scaleModuleFrequencyTargetsV1(profile, 6, 120);
    const target = (
      targets: typeof baseline,
      label: string,
    ) => Object.values(targets).find((item) => item.label === label)!;

    expect(target(baseline, 'Shooting').scaleFactor).toBe(1);
    expect(target(short, 'Shooting').scaleFactor).toBeGreaterThan(1 / 9);
    expect(target(short, 'Shooting').targetWeeklyMinutesMin).toBeGreaterThan(0);
    expect(target(long, 'Shooting').scaleFactor).toBeLessThan(8 / 3);
    expect(
      target(short, 'Offensive Concepts / Spacing').scaleFactor,
    ).toBeLessThan(
      target(short, 'Shooting').scaleFactor,
    );
  });

  it('boosts a manual primary without erasing other core targets', () => {
    const profile = getModuleFrequencyProfileV1(12, 2);
    const auto = scaleModuleFrequencyTargetsV1(profile, 3, 90);
    const manual = scaleModuleFrequencyTargetsV1(
      profile,
      3,
      90,
      ['Shooting'],
    );
    const target = (
      targets: typeof auto,
      label: string,
    ) => Object.values(targets).find((item) => item.label === label)!;

    expect(target(manual, 'Shooting').targetWeeklyMinutesMin).toBeGreaterThan(
      target(auto, 'Shooting').targetWeeklyMinutesMin,
    );
    expect(target(manual, 'Passing').targetWeeklyMinutesMin).toBe(
      target(auto, 'Passing').targetWeeklyMinutesMin,
    );
    expect(
      target(manual, 'Situational / SSG').targetWeeklyMinutesMin,
    ).toBe(
      target(auto, 'Situational / SSG').targetWeeklyMinutesMin,
    );
  });

  it('generates exact 3x90 clock plans for all nine profiles', () => {
    for (const profileCase of PROFILE_CASES) {
      const result = generateModuleMatrixWeekV1(
        DRILLS,
        weeklyInput(profileCase.age, profileCase.level),
      );

      expect(result.activeInCoachApp).toBe(false);
      expect(result.profile.key).toBe(profileCase.key);
      expect(result.plan.practicePlans).toHaveLength(3);
      expect(result.exposure.totalClockMinutes).toBe(270);
      expect(result.exposure.expectedClockMinutes).toBe(270);
      expect(
        result.plan.practicePlans.every(
          (practice) =>
            practice.blocks.reduce(
              (sum, block) => sum + block.duration,
              0,
            ) === 90,
        ),
      ).toBe(true);
      expect(result.exposure.averageActivityRate).toBeGreaterThan(0);
      expect(result.exposure.modules['situational-ssg']).toBeDefined();
      expect(result.exposure.modules['movement-preparation']).toBeDefined();
    }
  });

  it('supports every required practice frequency and duration architecture', () => {
    const frequencies: WeeklyFrequency[] = [1, 2, 3, 4, 5, 6];
    const durations: WeeklyDuration[] = [30, 45, 60, 75, 90, 120];

    for (let index = 0; index < frequencies.length; index += 1) {
      const frequency = frequencies[index];
      const duration = durations[index];
      const result = generateModuleMatrixWeekV1(
        DRILLS,
        weeklyInput(12, 2, frequency, duration),
      );
      expect(result.plan.practicePlans).toHaveLength(frequency);
      expect(result.exposure.totalClockMinutes).toBe(frequency * duration);
      expect(result.exposure.expectedClockMinutes).toBe(
        frequency * duration,
      );
    }
  });

  it('counts block clock once while allowing several development credits', () => {
    const result = generateModuleMatrixWeekV1(
      DRILLS,
      weeklyInput(12, 2),
    );
    const creditedAcrossModules = Object.values(result.exposure.modules).reduce(
      (sum, module) => sum + module.creditedMinutes,
      0,
    );

    expect(result.exposure.totalClockMinutes).toBe(270);
    expect(result.exposure.blocks.reduce(
      (sum, block) => sum + block.blockMinutes,
      0,
    )).toBe(270);
    expect(creditedAcrossModules).toBeGreaterThan(270);
    expect(
      result.exposure.blocks.some((block) => block.credits.length > 1),
    ).toBe(true);
  });

  it('models player time in multi-drill station blocks', () => {
    const result = generateModuleMatrixWeekV1(
      DRILLS,
      weeklyInput(12, 2),
    );
    const plan = structuredClone(result.plan);
    const practice = plan.practicePlans[0];
    const block = practice.blocks.find((candidate) => candidate.drills.length > 0);

    expect(block).toBeDefined();
    if (!block) return;

    const original = block.drills[0];
    block.duration = 16;
    block.drills = [0, 1, 2, 3].map((index) => ({
      ...original,
      drill: {
        ...original.drill,
        id: original.drill.id + '-station-' + index,
      },
    }));

    const report = calculateWeeklyModuleExposureV1(plan);
    const station = report.blocks.find(
      (candidate) => candidate.blockId === block.id,
    );

    expect(station?.blockMinutes).toBe(16);
    expect(station?.playerMinutesPerStationOrDrill).toBe(4);
    expect(
      station?.credits.every(
        (credit) => !credit.drillId || credit.playerExposureMinutes <= 4,
      ),
    ).toBe(true);
  });

  it('raises targeted underexposure, weak-side and overexposure flags', () => {
    const result = generateModuleMatrixWeekV1(
      DRILLS,
      weeklyInput(12, 2),
    );
    const shooting = result.exposure.modules.shooting ?? {
      moduleId: 'Shooting',
      moduleLabel: 'Shooting',
      blockMinutes: 0,
      creditedMinutes: 0,
      effectiveDevelopmentMinutes: 0,
      frequency: 0,
      practiceNumbers: [],
      roles: [],
      progressionStages: [],
      drillIds: [],
    };

    const underExposure = {
      ...result.exposure,
      weakSideEffectiveMinutes: 0,
      modules: {
        ...result.exposure.modules,
        shooting: {
          ...shooting,
          effectiveDevelopmentMinutes: 0,
          creditedMinutes: 0,
        },
      },
    };
    const underValidation = validateModuleFrequencyWeekV1(
      result.plan,
      underExposure,
      result.scaledTargets,
    );

    expect(underValidation.flags).toContain(
      'INSUFFICIENT_SHOOTING_EXPOSURE',
    );
    expect(underValidation.flags).toContain('UNDEREXPOSED_CORE_MODULE');
    expect(underValidation.flags).toContain('MISSING_WEAK_SIDE_EXPOSURE');

    const overExposure = {
      ...result.exposure,
      modules: {
        ...result.exposure.modules,
        shooting: {
          ...shooting,
          effectiveDevelopmentMinutes:
            result.scaledTargets.shooting.maximumWeeklyMinutes + 30,
          creditedMinutes:
            result.scaledTargets.shooting.maximumWeeklyMinutes + 30,
        },
      },
    };
    const overValidation = validateModuleFrequencyWeekV1(
      result.plan,
      overExposure,
      result.scaledTargets,
    );

    expect(overValidation.flags).toContain('OVEREXPOSED_SINGLE_MODULE');
  });

  it('simulates four deterministic AUTO weeks with continuity and variation', () => {
    const simulation = runU12Level2FourWeekSimulationV1(
      DRILLS,
      weeklyInput(12, 2),
    );

    expect(simulation.activeInCoachApp).toBe(false);
    expect(simulation.profile).toBe('U12-13-L2');
    expect(simulation.weeks).toHaveLength(4);
    expect(simulation.weeks.flatMap((week) => week.practices)).toHaveLength(12);
    expect(
      simulation.weeks.every(
        (week) =>
          week.practices.length === 3 &&
          week.practices.every(
            (practice) =>
              practice.totalDuration === 90 &&
              practice.blocks.reduce(
                (sum, block) => sum + block.duration,
                0,
              ) === 90,
          ),
      ),
    ).toBe(true);

    const weekStructures = simulation.weeks.map((week) =>
      week.practices
        .map(
          (practice) =>
            practice.primaryGoal + '/' + practice.secondaryGoal,
        )
        .join('|'),
    );
    expect(new Set(weekStructures).size).toBeGreaterThan(1);
    expect(simulation.continuedSkillFamilies.length).toBeGreaterThan(0);
    expect(simulation.methodologicalWeaknesses.length).toBeGreaterThan(0);
    expect(
      simulation.weeks.every(
        (week) => week.weeklyModuleExposure['Situational / SSG'],
      ),
    ).toBe(true);
  });

  it('formats the full manual-review simulation report', () => {
    const simulation = runU12Level2FourWeekSimulationV1(
      DRILLS,
      weeklyInput(12, 2),
    );
    const report = formatFourWeekSimulationSummaryV1(simulation);

    expect(report).toContain('FOUR WEEK DETERMINISTIC SIMULATION');
    expect(report).toContain('Engine active in coach app: NO');
    expect(report).toContain('WEEK 1');
    expect(report).toContain('WEEK 4');
    expect(report).toContain('EXPOSURE:');
    expect(report).toContain('PROGRESSION:');
    expect(report).toContain('EXACT REPEATS:');
    expect(report).toContain('ALL FLAGS:');
    expect(report).toContain('RECOMMENDATIONS:');
  });
});

