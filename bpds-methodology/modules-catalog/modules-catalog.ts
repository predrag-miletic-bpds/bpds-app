import type { Module } from '@predrag-miletic/bpds-methodology.entities.methodology';

/**
 * The BPDS Master Module Map — 26 development modules across 6 areas.
 *
 * This is the methodological backbone of the platform. Prerequisites encode
 * the development progression the practice generator follows, and each
 * module declares the phase its drills default into.
 */
export const MODULES: Module[] = [
  { code: 'BM', name: 'Ball Mastery', area: 'Individual Skills', purpose: 'Feel for the ball, hand coordination, ball control and basketball familiarity without dribbling.', icon: '🏀', prerequisites: [], phase: 'Individual Skill Activation' },
  { code: 'SBH', name: 'Stationary Ball Handling', area: 'Individual Skills', purpose: 'Dribbling control in place using both hands, different heights, rhythms and directions.', icon: '🤾', prerequisites: ['BM'], phase: 'Individual Skill Activation' },
  { code: 'MBH', name: 'Moving Ball Handling', area: 'Individual Skills', purpose: 'Ball control while walking, running, accelerating, decelerating, stopping and changing speed.', icon: '🏃', prerequisites: ['SBH'], phase: 'Technical Skill Development' },
  { code: 'COD', name: 'Ball Handling — Change of Direction', area: 'Individual Skills', purpose: 'Crossover, between the legs, behind the back, spin, retreat dribble and hesitation techniques.', icon: '↔️', prerequisites: ['MBH'], phase: 'Technical Skill Development' },
  { code: 'COM', name: 'Ball Handling — Combination Moves', area: 'Individual Skills', purpose: 'Combining two or more previously learned dribble moves.', icon: '🔀', prerequisites: ['COD'], phase: 'Skill Application' },
  { code: 'FW', name: 'Footwork', area: 'Individual Skills', purpose: 'Basketball stance, stops, pivots, balance, acceleration, deceleration, cuts and movement patterns.', icon: '👟', prerequisites: [], phase: 'Individual Skill Activation' },
  { code: 'FIN', name: 'Finishing', area: 'Individual Skills', purpose: 'Layups, one and two foot finishes, inside hand, reverse, floaters, runners and contact finishes.', icon: '🎯', prerequisites: ['FW'], phase: 'Technical Skill Development' },
  { code: 'PAS', name: 'Passing', area: 'Individual Skills', purpose: 'Passing technique, passing on the move, passing under pressure and decision based passing.', icon: '🤝', prerequisites: [], phase: 'Technical Skill Development' },
  { code: 'SH', name: 'Shooting', area: 'Individual Skills', purpose: 'Form shooting, catch and shoot, pull-ups, shooting off movement and game speed shooting.', icon: '🎽', prerequisites: ['FW'], phase: 'Technical Skill Development' },
  { code: 'TT', name: 'Triple Threat', area: 'Individual Application', purpose: 'Triple Threat stance, shot readiness, ball protection, pivots, jab steps and fakes.', icon: '⚡', prerequisites: ['FW'], phase: 'Skill Application' },
  { code: 'ATT', name: 'Attacking from Triple Threat', area: 'Individual Application', purpose: 'Reading the defender and attacking directly from a stationary Triple Threat position.', icon: '🗡️', prerequisites: ['TT'], phase: 'Skill Application' },
  { code: 'OCS', name: 'Offensive Concepts and Spacing', area: 'Team Fundamentals', purpose: 'Spacing, cutting, filling, replacing, drifting, lifting, ball reversal and reacting to penetration.', icon: '📐', prerequisites: ['PAS'], phase: 'Skill Application' },
  { code: 'OBM', name: 'Off-Ball Movement', area: 'Team Fundamentals', purpose: 'V-cuts, L-cuts, basket cuts, backdoor, blast, flash, UCLA and Iverson cuts.', icon: '🧭', prerequisites: ['OCS'], phase: 'Skill Application' },
  { code: 'OBS', name: 'Off-Ball Screens', area: 'Team Fundamentals', purpose: 'Screening fundamentals and angles, down, flare, back, cross, double, stagger and screen reads.', icon: '🧱', prerequisites: ['OBM'], phase: 'Decision Making' },
  { code: 'PNR', name: 'Pick and Roll Offense', area: 'Team Fundamentals', purpose: 'Setting and using screens, turning the corner, snake dribble, pocket pass and coverage reads.', icon: '🔗', prerequisites: ['OCS'], phase: 'Decision Making' },
  { code: 'TOC', name: 'Team Offensive Concepts', area: 'Team Fundamentals', purpose: 'DHO, ball screen concepts, Chicago, Zoom, Pistol, Spain pick and roll and Horns concepts.', icon: '📋', prerequisites: ['PNR'], phase: 'Decision Making' },
  { code: 'POST', name: 'Post Play', area: 'Team Fundamentals', purpose: 'Post positioning, sealing, duck-ins, footwork, scoring options and reading double teams.', icon: '🛡️', prerequisites: ['FW'], phase: 'Skill Application' },
  { code: 'DFW', name: 'Defensive Footwork', area: 'Defense and Rebounding', purpose: 'Defensive stance, slides, hip turns, recovery movement and defensive balance.', icon: '🦵', prerequisites: [], phase: 'Individual Skill Activation' },
  { code: 'OBD', name: 'On-Ball Defense', area: 'Defense and Rebounding', purpose: 'Ball pressure, containment, cutting off drives, closeouts, recovery and live one-on-one defense.', icon: '🚧', prerequisites: ['DFW'], phase: 'Skill Application' },
  { code: 'OFD', name: 'Off-Ball Defense', area: 'Defense and Rebounding', purpose: 'Ball-you-man, deny, help position, help and recover, rotations and shell concepts.', icon: '👁️', prerequisites: ['DFW'], phase: 'Decision Making' },
  { code: 'REB', name: 'Rebounding', area: 'Defense and Rebounding', purpose: 'Rebounding position, box out, pursuit, high-pointing, securing, pivoting and outlet passing.', icon: '🙌', prerequisites: ['FW'], phase: 'Skill Application' },
  { code: 'TRD', name: 'Transition Defense', area: 'Defense and Rebounding', purpose: 'Sprint back, protect the rim, stop the ball, match up, build the wall and communicate.', icon: '↩️', prerequisites: ['DFW'], phase: 'Game Application' },
  { code: 'TOF', name: 'Transition Offense', area: 'Game Application', purpose: 'Lane running, rim running, pitch-ahead passing, early offense, secondary break and drag screens.', icon: '🚀', prerequisites: ['PAS'], phase: 'Game Application' },
  { code: 'ADV', name: 'Advantage Basketball', area: 'Game Application', purpose: 'Decision making in 2-on-1, 3-on-2, 4-on-3 and 5-on-4 numerical advantage situations.', icon: '➕', prerequisites: ['TOF'], phase: 'Game Application' },
  { code: 'SSG', name: 'Small-Sided Games and Game Situations', area: 'Game Application', purpose: 'Competitive constrained games from 1-on-1 to 5-on-5 with methodological constraints.', icon: '🏆', prerequisites: ['ADV'], phase: 'Competitive Play' },
  { code: 'WUP', name: 'Warm-Up and Movement Preparation', area: 'Training Preparation', purpose: 'Dynamic warm-up, mobility, activation, coordination, reaction, landing and running mechanics.', icon: '🔥', prerequisites: [], phase: 'Warm-Up and Movement Preparation' },
];

/** All distinct development areas, in methodological order. */
export const AREAS = [
  'Training Preparation',
  'Individual Skills',
  'Individual Application',
  'Team Fundamentals',
  'Defense and Rebounding',
  'Game Application',
];

/**
 * Look up a module by its code prefix.
 * @param code the module code, e.g. `COD`.
 */
export function getModule(code: string): Module | undefined {
  return MODULES.find((m) => m.code === code);
}

/**
 * Every module belonging to a development area.
 * @param area one of {@link AREAS}.
 */
export function modulesByArea(area: string): Module[] {
  return MODULES.filter((m) => m.area === area);
}

/**
 * Resolves the full prerequisite chain of a module, deepest first.
 *
 * Used to explain to a coach why a module sits where it does in the
 * development progression.
 *
 * @param code the module code to resolve.
 * @returns the transitive prerequisite modules, in training order.
 */
export function prerequisiteChain(code: string): Module[] {
  const chain: Module[] = [];
  const seen = new Set<string>();
  const walk = (current: string) => {
    if (seen.has(current)) return;
    seen.add(current);
    const mod = getModule(current);
    if (!mod) return;
    mod.prerequisites.forEach(walk);
    if (current !== code) chain.push(mod);
  };
  walk(code);
  return chain;
}

/**
 * The read model the app uses for the BPDS module map.
 *
 * Exposed as an object so the app depends on a service surface rather than
 * on module-level constants, keeping the door open for a remote catalog
 * later without any page changing.
 */
export const modulesCatalog = {
  /** Every BPDS module. */
  all: (): Module[] => MODULES,
  /** All development areas in methodological order. */
  areas: (): string[] => AREAS,
  /** Look up one module by code. */
  get: getModule,
  /** Modules within one development area. */
  byArea: modulesByArea,
  /** The transitive prerequisite chain of a module. */
  prerequisites: prerequisiteChain,
  /** How many modules the catalog holds. */
  count: (): number => MODULES.length,
};
