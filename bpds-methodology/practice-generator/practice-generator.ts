import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { fitsPlayerCount, hasEquipment } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { DRILLS, FOCUS_TO_MODULES } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { getModule } from '@predrag-miletic/bpds-methodology.modules-catalog';
import type { GeneratorContext, Practice, PracticeItem } from '@predrag-miletic/bpds-practices.entities.practice';
import type { Phase } from '@predrag-miletic/bpds-storage.entities.shared-types';

/** The BPDS methodological progression, in order. */
export const PHASE_ORDER: Phase[] = [
  'Warm-Up and Movement Preparation',
  'Individual Skill Activation',
  'Technical Skill Development',
  'Skill Application',
  'Decision Making',
  'Game Application',
  'Competitive Play',
  'Cool Down',
];

/** Share of total practice time allocated to each methodological phase. */
const PHASE_WEIGHT: Record<Phase, number> = {
  'Warm-Up and Movement Preparation': 0.12,
  'Individual Skill Activation': 0.12,
  'Technical Skill Development': 0.24,
  'Skill Application': 0.2,
  'Decision Making': 0.12,
  'Game Application': 0.08,
  'Competitive Play': 0.08,
  'Cool Down': 0.04,
};

/** Target skill-level mix per coach-facing skill level. */
const LEVEL_MIX: Record<string, [number, number, number]> = {
  Beginner: [0.7, 0.25, 0.05],
  Intermediate: [0.4, 0.45, 0.15],
  Advanced: [0.18, 0.32, 0.5],
  Elite: [0.12, 0.28, 0.6],
};

/** Determine the methodological phase a drill belongs to. */
export function drillPhase(drill: Drill): Phase {
  if (drill.moduleCode === 'WUP') return 'Warm-Up and Movement Preparation';
  if (drill.tags.includes('cool down')) return 'Cool Down';
  if (drill.moduleCode === 'SSG') return 'Competitive Play';
  const mod = getModule(drill.moduleCode);
  const base = mod?.phase ?? 'Technical Skill Development';
  if (drill.level === 1 && base === 'Technical Skill Development') return 'Individual Skill Activation';
  if (drill.level === 3 && (base === 'Technical Skill Development' || base === 'Skill Application')) return 'Decision Making';
  return base;
}

/** True when the drill can be used with the given coach context. */
export function isEligible(drill: Drill, ctx: GeneratorContext): boolean {
  if (!drill.published) return false;
  if (!drill.suitableAges.includes(ctx.ageGroup)) return false;
  if (!fitsPlayerCount(drill, ctx.playerCount)) return false;
  if (drill.courtArea.length && !drill.courtArea.includes(ctx.courtSize)) return false;
  if (!hasEquipment(drill, ctx.equipment)) return false;
  if (!ctx.withDefense && drill.withDefense) return false;
  return true;
}

/** Score how well a drill matches the coach's focus and context. Higher is better. */
function score(drill: Drill, ctx: GeneratorContext, targetLevel: number): number {
  let s = 0;
  const primaryModules = FOCUS_TO_MODULES[ctx.primaryFocus] ?? [];
  const secondaryModules = FOCUS_TO_MODULES[ctx.secondaryFocus] ?? [];
  if (primaryModules.includes(drill.moduleCode)) s += 40;
  if (secondaryModules.includes(drill.moduleCode)) s += 18;
  s -= Math.abs(drill.level - targetLevel) * 12;
  if (drill.intensity === ctx.intensity) s += 6;
  if (ctx.trainingType === 'Individual' && drill.grouping === 'Individual') s += 8;
  if (ctx.trainingType === 'Team' && drill.grouping !== 'Individual') s += 8;
  if (drill.bpdsOriginal) s += 2;
  return s;
}

/** Pick the target BPDS level for a phase given the coach's skill mix. */
function targetLevelForPhase(phase: Phase, skillLevel: string): number {
  const mix = LEVEL_MIX[skillLevel] ?? LEVEL_MIX.Intermediate;
  const idx = PHASE_ORDER.indexOf(phase);
  const early = idx <= 2;
  const late = idx >= 5;
  if (early) return mix[0] > 0.35 ? 1 : 2;
  if (late) return mix[2] > 0.3 ? 3 : 2;
  return mix[2] > 0.45 ? 3 : 2;
}

/** Ensure prerequisite drills already appear earlier in the plan when available. */
function respectsPrerequisites(drill: Drill, chosen: Drill[], ctx: GeneratorContext): boolean {
  if (!drill.prerequisiteDrills.length) return true;
  // A prerequisite is satisfied if it is already in the plan, or the player level
  // is high enough that the prerequisite skill is assumed mastered.
  if (ctx.skillLevel === 'Advanced' || ctx.skillLevel === 'Elite') return true;
  return drill.prerequisiteDrills.some((p) => chosen.some((c) => c.id === p));
}

/**
 * Generate a methodologically correct BPDS practice from a coach training context.
 * Fills each phase of the BPDS progression in order, respecting age, level,
 * equipment, court, player count and prerequisite relationships.
 */
export function generatePractice(ctx: GeneratorContext): Practice {
  const pool = DRILLS.filter((d) => isEligible(d, ctx));
  const chosen: Drill[] = [];
  const items: PracticeItem[] = [];

  const phases = PHASE_ORDER.filter((p) => {
    if (p === 'Competitive Play') return ctx.competitive || ctx.smallSidedGame;
    if (p === 'Game Application') return ctx.duration >= 60;
    if (p === 'Decision Making') return ctx.duration >= 45;
    return true;
  });

  phases.forEach((phase) => {
    const budget = Math.round(ctx.duration * PHASE_WEIGHT[phase]);
    if (budget < 3) return;
    const targetLevel = targetLevelForPhase(phase, ctx.skillLevel);
    const candidates = pool
      .filter((d) => drillPhase(d) === phase)
      .filter((d) => !chosen.some((c) => c.id === d.id))
      .filter((d) => respectsPrerequisites(d, chosen, ctx))
      .sort((a, b) => score(b, ctx, targetLevel) - score(a, ctx, targetLevel));

    let spent = 0;
    candidates.forEach((d) => {
      if (spent >= budget) return;
      const remaining = budget - spent;
      if (remaining < 3) return;
      const dur = Math.min(d.duration, Math.max(4, remaining));
      chosen.push(d);
      items.push({
        id: `item-${items.length + 1}`,
        kind: 'drill',
        drillId: d.id,
        duration: dur,
        phase,
      });
      spent += dur;
    });
  });

  // Insert a water break at roughly the midpoint of longer sessions.
  if (ctx.duration >= 60 && items.length > 4) {
    const mid = Math.floor(items.length / 2);
    items.splice(mid, 0, {
      id: 'item-break', kind: 'break', label: 'Water Break', duration: 3, phase: items[mid].phase,
    });
  }

  const focusLabel = ctx.primaryFocus === 'Complete Player Development' ? 'Complete Development' : ctx.primaryFocus;

  return {
    id: `gen-${Date.now()}`,
    name: `${ctx.ageGroup} ${ctx.skillLevel} ${focusLabel} Practice`,
    date: new Date().toISOString().slice(0, 10),
    playerIds: ctx.playerIds,
    teamId: ctx.teamId,
    ageGroup: ctx.ageGroup,
    skillLevel: ctx.skillLevel,
    duration: ctx.duration,
    primaryFocus: ctx.primaryFocus,
    secondaryFocus: ctx.secondaryFocus,
    equipment: ctx.equipment,
    courtSize: ctx.courtSize,
    objective: buildObjective(ctx),
    items,
    status: 'Draft',
    lastOpened: new Date().toISOString().slice(0, 10),
  };
}

/** Write the methodological objective sentence for a generated practice. */
function buildObjective(ctx: GeneratorContext): string {
  return `Progress ${ctx.ageGroup} ${ctx.skillLevel.toLowerCase()} players from controlled technical execution of ${ctx.primaryFocus.toLowerCase()} through applied ${ctx.secondaryFocus.toLowerCase()} into game-speed decision making${ctx.competitive ? ' and live competition' : ''}.`;
}

/** A suggested replacement drill with the reason it fits. */
export type Alternative = { drill: Drill; reason: string };

/**
 * Find alternative drills that can replace a drill at a given position
 * without breaking the methodological structure of the practice.
 */
export function findAlternatives(
  current: Drill,
  practice: Practice,
): Alternative[] {
  const phase = drillPhase(current);
  const usedIds = practice.items.map((i) => i.drillId);
  return DRILLS.filter((d) => d.id !== current.id && !usedIds.includes(d.id) && d.published)
    .filter((d) => d.suitableAges.includes(practice.ageGroup))
    .filter((d) => drillPhase(d) === phase)
    .filter((d) => Math.abs(d.level - current.level) <= 1)
    .filter((d) => d.equipment.every((e) => e === 'No additional equipment' || practice.equipment.includes(e)))
    .filter((d) => !d.courtArea.length || d.courtArea.includes(practice.courtSize))
    .slice(0, 6)
    .map((d) => ({
      drill: d,
      reason: buildReason(d, current, phase),
    }));
}

/** Explain why an alternative drill is a valid replacement. */
function buildReason(alt: Drill, current: Drill, phase: Phase): string {
  const parts: string[] = [];
  parts.push(`same ${phase.toLowerCase()} phase`);
  if (alt.moduleCode === current.moduleCode) parts.push('same module');
  else parts.push(`related module ${getModule(alt.moduleCode)?.name ?? alt.moduleCode}`);
  if (alt.level === current.level) parts.push(`same Level ${alt.level}`);
  else parts.push(`Level ${alt.level} instead of ${current.level}`);
  if (Math.abs(alt.duration - current.duration) <= 3) parts.push('similar duration');
  if (alt.intensity === current.intensity) parts.push(`${alt.intensity.toLowerCase()} intensity match`);
  return `Suitable because of ${parts.join(', ')}.`;
}

/**
 * The BPDS practice generation service.
 *
 * Pages depend on this surface rather than on the functions directly, so the
 * generator can later move behind an aspect or a remote service without any
 * page changing.
 */
export const practiceGenerator = {
  /** Build a methodologically correct practice from a coach training context. */
  generate: generatePractice,
  /** Suggested replacements for a drill, each with the reason it fits. */
  alternatives: findAlternatives,
  /** The methodological phase a drill belongs to. */
  phaseOf: drillPhase,
  /** The eight BPDS phases in methodological order. */
  phases: (): Phase[] => PHASE_ORDER,
  /** Whether a drill is usable in a given training context. */
  isEligible,
};
