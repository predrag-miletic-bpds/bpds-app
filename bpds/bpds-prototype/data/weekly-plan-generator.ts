import type { Drill, GeneratorContext, Practice, PracticeItem } from './types.js';
import { DRILLS, FOCUS_TO_MODULES } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { PHASE_ORDER, drillPhase, isEligible } from '@predrag-miletic/bpds-methodology.practice-generator';
import {
  LEVEL_TO_PLAYER_SKILL,
  WEEKDAYS,
} from './weekly-plan-types.js';
import type {
  SeasonPhase,
  WeekDay,
  WeeklyDaySlot,
  WeeklyFocusMode,
  WeeklyIntensity,
  WeeklyPlan,
  WeeklyPlanContext,
  WeeklySession,
  WeeklySessionRole,
} from './weekly-plan-types.js';

/**
 * Weekly Plan generator.
 *
 * A weekly plan never invents its own drill-selection logic — every session
 * is built by calling the existing single-practice generator
 * (`services.practices.generate`) with a valid {@link GeneratorContext}. This
 * module only decides, per scheduled day: which role the session plays in the
 * week's Learn -> Develop -> Decide -> Apply/Compete progression, which slice
 * of the weekly focus split it is built around, and how intense it should be.
 */

/** Role sequence assigned by session count (1–4 sessions per week). */
const ROLE_SEQUENCES: Record<number, WeeklySessionRole[]> = {
  1: ['Learn / Develop / Apply'],
  2: ['Learn & Build', 'Decide & Apply'],
  3: ['Learn & Build', 'Develop & Decide', 'Apply & Compete'],
  4: ['Learn & Build', 'Develop', 'Decide Under Pressure', 'Apply & Compete'],
};

/** Age-based BPDS scheduling guidance. Advisory only — never blocks generation. */
const AGE_GUIDANCE: { ages: string[]; label: string; sessions: [number, number]; duration: [number, number]; restDays: number }[] = [
  { ages: ['U8'], label: 'Ages 7–8', sessions: [1, 1], duration: [30, 60], restDays: 2 },
  { ages: ['U10'], label: 'Ages 9–11', sessions: [2, 2], duration: [45, 75], restDays: 2 },
  { ages: ['U12', 'U14'], label: 'Ages 12–14', sessions: [2, 4], duration: [60, 90], restDays: 1 },
  { ages: ['U16', 'U18', 'Senior', 'Professional'], label: 'High school and up', sessions: [3, 4], duration: [90, 120], restDays: 1 },
];

/** Maps a session role to its target intensity and coach-facing "x/5" label. */
function roleIntensity(role: WeeklySessionRole): { intensity: WeeklyIntensity; label: string } {
  switch (role) {
    case 'Learn / Develop / Apply':
    case 'Learn & Build':
      return { intensity: 'Medium', label: '3/5' };
    case 'Develop':
    case 'Develop & Decide':
    case 'Decide & Apply':
    case 'Decide Under Pressure':
      return { intensity: 'High', label: '4/5' };
    case 'Apply & Compete':
      return { intensity: 'High', label: '3-4/5' };
    case 'Pre-Game Application':
    default:
      return { intensity: 'Low', label: '2-3/5' };
  }
}

/** Whether a role represents an application/competition block (drives `competitive` and `smallSidedGame`). */
function isApplicationRole(role: WeeklySessionRole): boolean {
  return role === 'Apply & Compete' || role === 'Pre-Game Application' || role === 'Decide Under Pressure';
}

/**
 * Distributes `n` sessions across weighted focus buckets using proportional
 * fair scheduling (largest-ratio-next), so the buckets are spread across the
 * week rather than clumped at the start.
 */
function distributeFocusModes(n: number, hasMaintenance: boolean): WeeklyFocusMode[] {
  const weights: [WeeklyFocusMode, number][] = hasMaintenance
    ? [['Primary', 0.55], ['Secondary', 0.3], ['Maintenance', 0.15]]
    : [['Primary', 0.65], ['Secondary', 0.35]];

  const assigned: Record<string, number> = {};
  weights.forEach(([key]) => { assigned[key] = 0; });

  const result: WeeklyFocusMode[] = [];
  for (let i = 0; i < n; i += 1) {
    let best: WeeklyFocusMode = weights[0][0];
    let bestScore = -Infinity;
    weights.forEach(([key, weight]) => {
      const score = weight / (assigned[key] + 1);
      if (score > bestScore) {
        bestScore = score;
        best = key;
      }
    });
    assigned[best] += 1;
    result.push(best);
  }
  return result;
}

/** Adds `days` calendar days to an ISO date string, returning a new ISO date string. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Resolves the ISO date of a weekday relative to the plan's week start (treated as Monday). */
export function sessionDateFor(weekStart: string, dayOfWeek: WeekDay): string {
  const offset = WEEKDAYS.indexOf(dayOfWeek);
  return addDays(weekStart, offset < 0 ? 0 : offset);
}

/**
 * Checks the week's schedule against BPDS age norms.
 *
 * This is guidance only — a plan outside these norms is still generated in
 * full. The coach is simply warned so they can adjust if the schedule was
 * unintentional.
 *
 * @param context the weekly plan context.
 * @returns a warning message, or undefined when the schedule fits BPDS norms.
 */
export function checkAgeGuidance(context: WeeklyPlanContext): string | undefined {
  const bracket = AGE_GUIDANCE.find((b) => b.ages.includes(context.ageGroup));
  if (!bracket) return undefined;

  const issues: string[] = [];
  const n = context.days.length;
  if (n < bracket.sessions[0] || n > bracket.sessions[1]) {
    issues.push(`${bracket.label} typically train ${bracket.sessions[0]}–${bracket.sessions[1]}x per week (this plan has ${n}).`);
  }
  context.days.forEach((day) => {
    if (day.duration < bracket.duration[0] || day.duration > bracket.duration[1]) {
      issues.push(`${bracket.label} sessions are typically ${bracket.duration[0]}–${bracket.duration[1]} min (${day.dayOfWeek} is ${day.duration} min).`);
    }
  });

  const sortedIndexes = context.days
    .map((day) => WEEKDAYS.indexOf(day.dayOfWeek))
    .sort((a, b) => a - b);
  for (let i = 1; i < sortedIndexes.length; i += 1) {
    const gap = sortedIndexes[i] - sortedIndexes[i - 1] - 1;
    if (gap < bracket.restDays) {
      issues.push(`${bracket.label} need at least ${bracket.restDays} rest day(s) between sessions.`);
      break;
    }
  }

  return issues.length ? issues.join(' ') : undefined;
}

/** Builds the {@link GeneratorContext} a single weekly session should be generated from. */
function buildSessionContext(context: WeeklyPlanContext, slot: WeeklyDaySlot, focusMode: WeeklyFocusMode, role: WeeklySessionRole): GeneratorContext {
  const { intensity } = roleIntensity(role);
  const primary = context.primaryFocus;
  const secondary = context.secondaryFocus;
  const maintenance = context.maintenanceFocus ?? secondary;

  let sessionPrimary = primary;
  let sessionSecondary = secondary;
  if (focusMode === 'Secondary') {
    sessionPrimary = secondary;
    sessionSecondary = primary;
  } else if (focusMode === 'Maintenance') {
    sessionPrimary = maintenance;
    sessionSecondary = primary;
  }

  const competitive = isApplicationRole(role);

  return {
    trainingType: context.trainingType,
    playerIds: context.playerIds,
    teamId: context.teamId,
    ageGroup: context.ageGroup,
    skillLevel: LEVEL_TO_PLAYER_SKILL[context.bpdsLevel],
    duration: slot.duration,
    playerCount: context.playerCount,
    baskets: context.baskets,
    courtSize: context.courtSize,
    equipment: context.equipment,
    primaryFocus: sessionPrimary,
    secondaryFocus: sessionSecondary,
    intensity,
    withDefense: context.withDefense,
    competitive,
    smallSidedGame: competitive,
  };
}

/** Builds the metadata (role, focus, intensity, date) for every scheduled session, without generating practices yet. */
function buildSessionShells(context: WeeklyPlanContext): Omit<WeeklySession, 'practice'>[] {
  const n = context.days.length;
  const roles = ROLE_SEQUENCES[Math.min(Math.max(n, 1), 4)] ?? ROLE_SEQUENCES[1];
  const focusModes = distributeFocusModes(n, Boolean(context.maintenanceFocus));

  const gameDate = context.gameDay ? sessionDateFor(context.weekStart, context.gameDay) : undefined;

  return context.days.map((slot, index) => {
    const date = sessionDateFor(context.weekStart, slot.dayOfWeek);
    let role = roles[index] ?? roles[roles.length - 1];

    const isDayBeforeGame = gameDate ? addDays(date, 1) === gameDate : false;
    if (isDayBeforeGame) role = 'Pre-Game Application';

    const { intensity, label } = roleIntensity(role);
    const focusMode = focusModes[index] ?? 'Primary';
    const ctx = buildSessionContext(context, slot, focusMode, role);

    return {
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      date,
      duration: slot.duration,
      role,
      focusMode,
      intensity,
      intensityLabel: label,
      locked: false,
      ctx,
    };
  });
}

type DrillTimingProfile = {
  minimum: number;
  preferred: number;
  maximum: number;
};

/**
 * Short technical drills are timed as repetitions inside a methodological
 * block, not as one long activity. All other modules keep the drill's own
 * catalog duration.
 */
function timingForDrill(drill: Drill): DrillTimingProfile {
  if (drill.moduleCode === 'BM') return { minimum: 1, preferred: 1, maximum: 1 };
  if (drill.moduleCode === 'SBH') return { minimum: 2, preferred: 3, maximum: 3 };
  return {
    minimum: Math.min(3, drill.duration),
    preferred: drill.duration,
    maximum: drill.duration,
  };
}

/** Methodological module order. Every module remains one contiguous block. */
const WEEKLY_MODULE_ORDER = [
  'WUP',
  'BM',
  'SBH',
  'MBH',
  'COD',
  'COM',
  'FIN',
  'FW',
  'TT',
  'ATT',
  'PAS',
  'SH',
  'DFW',
  'OBD',
  'OFD',
  'REB',
  'OCS',
  'OBM',
  'OBS',
  'PNR',
  'TOC',
  'TOF',
  'TRD',
  'ADV',
  'SSG',
] as const;

/**
 * Target time for the two short-skill blocks discussed in the BPDS method.
 * A 60+ minute session uses 7–8 minutes of Ball Mastery and 9–12 minutes of
 * Stationary Ball Handling. Shorter sessions scale those blocks down.
 */
function shortBlockBudget(moduleCode: string, ctx: GeneratorContext): number {
  const focusModules = new Set([
    ...(FOCUS_TO_MODULES[ctx.primaryFocus] ?? []),
    ...(FOCUS_TO_MODULES[ctx.secondaryFocus] ?? []),
  ]);
  if (!focusModules.has(moduleCode)) return 0;

  if (moduleCode === 'BM') {
    if (ctx.duration >= 60) return 8;
    if (ctx.duration >= 45) return 6;
    return 4;
  }
  if (moduleCode === 'SBH') {
    if (ctx.duration >= 60) return 12;
    if (ctx.duration >= 45) return 9;
    return 6;
  }
  return 0;
}

function targetWeeklyLevel(ctx: GeneratorContext): number {
  if (ctx.skillLevel === 'Beginner') return 1;
  if (ctx.skillLevel === 'Intermediate') return 2;
  return 3;
}

function weeklyCandidateScore(drill: Drill, ctx: GeneratorContext): number {
  const primaryModules = FOCUS_TO_MODULES[ctx.primaryFocus] ?? [];
  const secondaryModules = FOCUS_TO_MODULES[ctx.secondaryFocus] ?? [];
  let score = 0;
  if (primaryModules.includes(drill.moduleCode)) score += 80;
  if (secondaryModules.includes(drill.moduleCode)) score += 35;
  score -= Math.abs(drill.level - targetWeeklyLevel(ctx)) * 12;
  if (drill.intensity === ctx.intensity) score += 6;
  if (ctx.trainingType === 'Individual' && drill.grouping === 'Individual') score += 8;
  if (ctx.trainingType === 'Team' && drill.grouping !== 'Individual') score += 8;
  if (drill.bpdsOriginal) score += 2;
  return score;
}

/**
 * Expands a generated weekly practice into methodologically timed blocks.
 *
 * Ball Mastery uses several one-minute exercises. Stationary Ball Handling
 * uses several two-to-three-minute exercises (for example alternating
 * 30-second right/left-hand work with short rests). Longer technical,
 * application and game drills retain their catalog duration. Drill count is
 * deliberately variable and media availability is never used as a filter.
 */
export function composeMethodicalWeeklyPractice(practice: Practice, ctx: GeneratorContext): Practice {
  const breakItems = practice.items.filter((item) => item.kind !== 'drill');
  const breakMinutes = breakItems.reduce((total, item) => total + item.duration, 0);
  const drillBudget = Math.max(0, practice.duration - breakMinutes);
  const chosen: PracticeItem[] = [];
  const usedDrillIds = new Set<string>();

  const totalChosenMinutes = () => chosen.reduce((total, item) => total + item.duration, 0);
  const moduleMinutes = (moduleCode: string) => chosen.reduce((total, item) => {
    if (!item.drillId) return total;
    const drill = DRILLS.find((candidate) => candidate.id === item.drillId);
    return drill?.moduleCode === moduleCode ? total + item.duration : total;
  }, 0);

  practice.items.forEach((item) => {
    if (item.kind !== 'drill' || !item.drillId || usedDrillIds.has(item.drillId)) return;
    const drill = DRILLS.find((candidate) => candidate.id === item.drillId);
    if (!drill) return;

    const remaining = drillBudget - totalChosenMinutes();
    const timing = timingForDrill(drill);
    const duration = Math.min(timing.preferred, timing.maximum, remaining);
    if (duration < timing.minimum) return;

    usedDrillIds.add(drill.id);
    chosen.push({ ...item, duration, phase: drillPhase(drill) });
  });

  const byFit = (a: Drill, b: Drill) => weeklyCandidateScore(b, ctx) - weeklyCandidateScore(a, ctx);
  const primaryModules = FOCUS_TO_MODULES[ctx.primaryFocus] ?? [];
  const secondaryModules = FOCUS_TO_MODULES[ctx.secondaryFocus] ?? [];
  const candidatePools: Drill[][] = [
    DRILLS.filter((drill) => isEligible(drill, ctx) && primaryModules.includes(drill.moduleCode)).sort(byFit),
    DRILLS.filter((drill) => isEligible(drill, ctx) && secondaryModules.includes(drill.moduleCode)).sort(byFit),
    DRILLS.filter((drill) => isEligible(drill, ctx)).sort(byFit),
    DRILLS.filter((drill) => (
      drill.published
      && drill.suitableAges.includes(ctx.ageGroup)
      && (primaryModules.includes(drill.moduleCode) || secondaryModules.includes(drill.moduleCode))
    )).sort(byFit),
    DRILLS.filter((drill) => drill.published && drill.suitableAges.includes(ctx.ageGroup)).sort(byFit),
    DRILLS.filter((drill) => drill.published).sort(byFit),
  ];

  const addDrill = (drill: Drill, blockRemaining = Number.POSITIVE_INFINITY): boolean => {
    if (usedDrillIds.has(drill.id)) return false;
    const remaining = drillBudget - totalChosenMinutes();
    if (remaining <= 0 || blockRemaining <= 0) return false;

    const timing = timingForDrill(drill);
    const duration = Math.min(timing.preferred, timing.maximum, remaining, blockRemaining);
    if (duration < timing.minimum) return false;

    usedDrillIds.add(drill.id);
    chosen.push({
      id: `weekly-item-${chosen.length + 1}-${drill.id}`,
      kind: 'drill',
      drillId: drill.id,
      duration,
      phase: drillPhase(drill),
    });
    return true;
  };

  (['BM', 'SBH'] as const).forEach((moduleCode) => {
    const blockBudget = shortBlockBudget(moduleCode, ctx);
    if (!blockBudget) return;

    candidatePools.forEach((pool) => {
      pool
        .filter((drill) => drill.moduleCode === moduleCode)
        .forEach((drill) => {
          addDrill(drill, blockBudget - moduleMinutes(moduleCode));
        });
    });
  });

  candidatePools.forEach((pool) => {
    pool.forEach((drill) => {
      if (drill.moduleCode === 'BM' || drill.moduleCode === 'SBH') {
        const blockBudget = shortBlockBudget(drill.moduleCode, ctx);
        if (!blockBudget || moduleMinutes(drill.moduleCode) >= blockBudget) return;
        addDrill(drill, blockBudget - moduleMinutes(drill.moduleCode));
        return;
      }
      addDrill(drill);
    });
  });

  const remainingMinutes = drillBudget - totalChosenMinutes();
  if (remainingMinutes > 0 && remainingMinutes <= 2) {
    for (let i = chosen.length - 1; i >= 0; i -= 1) {
      const drillId = chosen[i].drillId;
      const drill = drillId ? DRILLS.find((candidate) => candidate.id === drillId) : undefined;
      if (drill && drill.moduleCode !== 'BM' && drill.moduleCode !== 'SBH') {
        chosen[i] = { ...chosen[i], duration: chosen[i].duration + remainingMinutes };
        break;
      }
    }
  }

  const blockIndex = (item: PracticeItem): number => {
    if (item.phase === 'Cool Down') return WEEKLY_MODULE_ORDER.length + 1;
    if (!item.drillId) return WEEKLY_MODULE_ORDER.length;
    const moduleCode = DRILLS.find((drill) => drill.id === item.drillId)?.moduleCode;
    const index = moduleCode
      ? WEEKLY_MODULE_ORDER.indexOf(moduleCode as (typeof WEEKLY_MODULE_ORDER)[number])
      : -1;
    return index >= 0 ? index : WEEKLY_MODULE_ORDER.length;
  };

  const orderedDrills = chosen
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const blockDifference = blockIndex(a.item) - blockIndex(b.item);
      if (blockDifference) return blockDifference;

      const drillA = a.item.drillId
        ? DRILLS.find((drill) => drill.id === a.item.drillId)
        : undefined;
      const drillB = b.item.drillId
        ? DRILLS.find((drill) => drill.id === b.item.drillId)
        : undefined;

      if (drillA && drillB && drillA.moduleCode === drillB.moduleCode) {
        if (drillB.prerequisiteDrills.includes(drillA.id)) return -1;
        if (drillA.prerequisiteDrills.includes(drillB.id)) return 1;

        const levelDifference = drillA.level - drillB.level;
        if (levelDifference) return levelDifference;

        const codeDifference = drillA.code.localeCompare(drillB.code, undefined, { numeric: true });
        if (codeDifference) return codeDifference;
      }

      const phaseDifference = PHASE_ORDER.indexOf(a.item.phase) - PHASE_ORDER.indexOf(b.item.phase);
      return phaseDifference || a.index - b.index;
    })
    .map(({ item }) => item);

  if (!breakItems.length) return { ...practice, items: orderedDrills };

  const midpoint = Math.floor(orderedDrills.length / 2);
  return {
    ...practice,
    items: [
      ...orderedDrills.slice(0, midpoint),
      ...breakItems,
      ...orderedDrills.slice(midpoint),
    ],
  };
}

/**
 * Builds a full weekly plan, generating one practice per scheduled day through
 * the supplied `generate` function (normally `services.practices.generate`).
 *
 * @param context the coach's weekly training context.
 * @param generate the existing single-practice generator.
 * @returns the weekly plan with a generated practice per session.
 */
export function generateWeeklyPlan(context: WeeklyPlanContext, generate: (ctx: GeneratorContext) => Practice): WeeklyPlan {
  const shells = buildSessionShells(context);
  const sessions: WeeklySession[] = shells.map((shell) => ({
    ...shell,
    practice: composeMethodicalWeeklyPractice(generate(shell.ctx), shell.ctx),
  }));

  return {
    id: `wp-${Date.now()}`,
    context,
    sessions,
    ageGuidanceWarning: checkAgeGuidance(context),
  };
}

/**
 * Regenerates a single session in place, keeping every other session
 * untouched. Used for the per-card "Regenerate" action.
 *
 * @param plan the current weekly plan.
 * @param sessionId id of the session to regenerate.
 * @param generate the existing single-practice generator.
 * @returns a new plan with only that session's practice replaced.
 */
export function regenerateSession(plan: WeeklyPlan, sessionId: string, generate: (ctx: GeneratorContext) => Practice): WeeklyPlan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => (
      session.id === sessionId
        ? { ...session, practice: composeMethodicalWeeklyPractice(generate(session.ctx), session.ctx) }
        : session
    )),
  };
}

/**
 * Regenerates every unlocked session in the plan, leaving locked sessions
 * exactly as they are. Used for the "Regenerate Week" action.
 *
 * @param plan the current weekly plan.
 * @param generate the existing single-practice generator.
 * @returns a new plan with unlocked sessions rebuilt.
 */
export function regenerateWeek(plan: WeeklyPlan, generate: (ctx: GeneratorContext) => Practice): WeeklyPlan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => (
      session.locked
        ? session
        : { ...session, practice: composeMethodicalWeeklyPractice(generate(session.ctx), session.ctx) }
    )),
  };
}

/**
 * Toggles the locked state of one session so a whole-week regenerate skips it.
 *
 * @param plan the current weekly plan.
 * @param sessionId id of the session to lock or unlock.
 * @returns a new plan with that session's lock flipped.
 */
export function toggleSessionLock(plan: WeeklyPlan, sessionId: string): WeeklyPlan {
  return {
    ...plan,
    sessions: plan.sessions.map((session) => (
      session.id === sessionId ? { ...session, locked: !session.locked } : session
    )),
  };
}

/** Creates a fresh, empty day slot for the weekly plan builder UI. */
export function createDaySlot(dayOfWeek: WeekDay, duration = 60): WeeklyDaySlot {
  return { id: `d-${dayOfWeek}-${Date.now()}`, dayOfWeek, duration };
}

/** Every season phase option, for the weekly plan form. */
export const SEASON_PHASES: SeasonPhase[] = ['Pre-Season', 'In-Season', 'Post-Season', 'Off-Season'];
