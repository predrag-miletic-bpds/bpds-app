import {
  DRILLS,
  getDrillByCode,
} from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import {
  evaluateDrillV1,
  generateBlockV1,
  normalizeDrillGeneratorMetadata,
  orderDrillsMethodicallyV1,
  rankDrillsV1,
  type GeneratorEngineContext,
} from './generator-engine-v1.js';

const context: GeneratorEngineContext = {
  trainingType: 'Team',
  playerIds: ['p1', 'p2'],
  teamId: 't1',
  ageGroup: 'U16',
  skillLevel: 'Advanced',
  bpdsLevel: 3,
  duration: 75,
  playerCount: 10,
  baskets: 2,
  courtSize: 'Full court',
  equipment: [
    'Basketballs',
    'Cones',
    'Contact pad',
    'No additional equipment',
  ],
  primaryFocus: 'Ball Handling',
  secondaryFocus: 'Decision Making',
  intensity: 'High',
  withDefense: true,
  competitive: true,
  smallSidedGame: true,
  referenceDate: '2026-08-21T12:00:00.000Z',
};

function requiredDrill(code: string): Drill {
  const drill = getDrillByCode(code);
  if (!drill) throw new Error(`Missing test drill ${code}`);
  return drill;
}

describe('Generator Engine v1', () => {
  it('normalizes every legacy catalog drill without requiring a data migration', () => {
    DRILLS.forEach((drill) => {
      const metadata = normalizeDrillGeneratorMetadata(drill);
      expect(metadata.schemaVersion).toBe(1);
      expect(metadata.primarySkill).toBeTruthy();
      expect(metadata.skillFamily).toBeTruthy();
      expect(metadata.difficultyScore).toBeGreaterThanOrEqual(1);
      expect(metadata.difficultyScore).toBeLessThanOrEqual(10);
      expect(metadata.execution.length).toBeGreaterThan(0);
      expect(metadata.coachingPoints.length).toBeGreaterThan(0);
    });
  });

  it('keeps age and BPDS level as separate eligibility gates', () => {
    const advanced = requiredDrill('SBH-L2-004');
    const result = evaluateDrillV1(advanced, {
      ...context,
      ageGroup: 'U10',
      skillLevel: 'Beginner',
      bpdsLevel: 1,
    });

    expect(result.eligible).toBe(false);
    expect(result.exclusions.map((item) => item.code)).toContain('difficulty');
  });

  it('excludes drills when baskets or equipment are unavailable', () => {
    const base = requiredDrill('BM-L1-001');
    const resourceHeavy: Drill = {
      ...base,
      id: 'resource-heavy',
      code: 'TEST-RESOURCE',
      generator: {
        ...base.generator,
        basketsRequired: 3,
        equipmentRequired: ['Basketballs', 'Resistance bands'],
      },
    };
    const result = evaluateDrillV1(resourceHeavy, {
      ...context,
      baskets: 1,
      equipment: ['Basketballs'],
    });

    expect(result.exclusions.map((item) => item.code)).toEqual(
      expect.arrayContaining(['baskets', 'equipment']),
    );
  });

  it('requires every prerequisite when strict progression is enabled', () => {
    const base = requiredDrill('MBH-L1-001');
    const progressionDrill: Drill = {
      ...base,
      id: 'strict-progression',
      code: 'TEST-PROGRESSION',
      generator: {
        ...base.generator,
        prerequisiteDrillIds: ['bm-l1-001', 'sbh-l1-001'],
      },
    };

    const missingOne = evaluateDrillV1(progressionDrill, {
      ...context,
      strictPrerequisites: true,
      completedDrillIds: ['bm-l1-001'],
    });
    const allCompleted = evaluateDrillV1(progressionDrill, {
      ...context,
      strictPrerequisites: true,
      completedDrillIds: ['bm-l1-001', 'sbh-l1-001'],
    });

    expect(missingOne.exclusions.map((item) => item.code)).toContain(
      'prerequisites',
    );
    expect(allCompleted.exclusions.map((item) => item.code)).not.toContain(
      'prerequisites',
    );
  });

  it('uses spaced repetition to prefer an equally suitable fresh drill', () => {
    const base = requiredDrill('BM-L1-001');
    const recent: Drill = {
      ...base,
      id: 'recent-drill',
      code: 'TEST-RECENT',
    };
    const fresh: Drill = {
      ...base,
      id: 'fresh-drill',
      code: 'TEST-FRESH',
    };
    const ranked = rankDrillsV1([recent, fresh], {
      ...context,
      previousPracticeHistory: [
        {
          drillId: recent.id,
          usedAt: '2026-08-20T12:00:00.000Z',
          completed: true,
        },
      ],
    });

    expect(ranked[0].drill.id).toBe(fresh.id);
    expect(ranked.find((item) => item.drill.id === recent.id)?.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'recently-used' }),
      ]),
    );
  });

  it('orders blocks from preparation through simple skills to complex play', () => {
    const ordered = orderDrillsMethodicallyV1([
      requiredDrill('COD-L2-017'),
      requiredDrill('SBH-L1-001'),
      requiredDrill('BM-L1-001'),
      requiredDrill('WUP-001'),
    ]);

    expect(ordered.map((drill) => drill.moduleCode)).toEqual([
      'WUP',
      'BM',
      'SBH',
      'COD',
    ]);
  });

  it('preserves locked drills while regenerating only the rest of a block', () => {
    const locked = requiredDrill('BM-L1-001');
    const block = generateBlockV1(
      DRILLS,
      context,
      {
        id: 'ball-handling-block',
        focus: 'Ball Handling',
        duration: 12,
        targetDrills: 3,
        lockedDrillIds: [locked.id],
      },
      [locked.id],
    );

    expect(block.lockedDrillIds).toContain(locked.id);
    expect(block.items.map((item) => item.drill.id)).toContain(locked.id);
    expect(new Set(block.items.map((item) => item.drill.id)).size).toBe(
      block.items.length,
    );
    expect(block.items.length).toBe(3);
  });

  it('returns a coach-readable explanation for every decision', () => {
    const candidate = evaluateDrillV1(requiredDrill('BM-L1-001'), context);

    expect(candidate.eligible).toBe(true);
    expect(candidate.explanation).toMatch(/^Selected because/);
    expect(candidate.reasons.length).toBeGreaterThan(0);
  });
});
