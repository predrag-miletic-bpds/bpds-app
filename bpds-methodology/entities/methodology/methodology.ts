import type { AgeGroup, Grouping, Intensity, Phase, SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';

/**
 * A BPDS development module — one of the 26 building blocks of the
 * Master Module Map (Ball Mastery, Shooting, Pick and Roll, …).
 */
export type Module = {
  /** Short module code used as the prefix of every drill code, e.g. `COD`. */
  code: string;
  /** Coach-facing module name. */
  name: string;
  /** Development area the module belongs to. */
  area: string;
  /** What the module develops, in methodological terms. */
  purpose: string;
  /** Emoji used in the UI. */
  icon: string;
  /** Modules that should normally be trained before this one. */
  prerequisites: string[];
  /** Default methodological phase drills of this module belong to. */
  phase: Phase;
};

/** The BPDS progression ladder used by Generator Engine v1. */
export type ProgressionStage =
  | 'Technique'
  | 'Movement'
  | 'Speed'
  | 'Combination'
  | 'Reaction'
  | 'Defender'
  | 'Game';

/** Whether a drill is performed in place, on the move, or supports both. */
export type DrillMovementMode = 'Stationary' | 'Moving' | 'Both';

/** Training formats a drill can support. */
export type DrillTrainingFormat = 'Individual' | 'Small group' | 'Team' | 'Both';

/** Space requirement normalized for Generator Engine v1. */
export type DrillSpaceRequirement = 'Small space' | 'Half court' | 'Full court' | 'Any';

/** Mental processing demand of a drill. */
export type CognitiveLoad = 'Low' | 'Medium' | 'High';

/** Amount of physical contact included in a drill. */
export type ContactLevel = 'None' | 'Guided' | 'Live';

/** Complexity of a tactical decision inside a drill. */
export type TacticalComplexity = 1 | 2 | 3;

/** Youth athletic-development emphasis used by the weekly rotation. */
export type AthleticFocus =
  | 'None'
  | 'Speed / Acceleration'
  | 'Agility / Balance / Deceleration'
  | 'Reaction / Coordination';

/**
 * Optional metadata used only by the Generator Engine.
 *
 * It is intentionally namespaced and partial on each Drill so the existing
 * catalog and remotely stored JSON records remain valid during migration.
 */
export type DrillGeneratorMetadata = {
  schemaVersion: 1;
  minimumAge: AgeGroup;
  maximumAge: AgeGroup;
  typicalIntroductionAge: AgeGroup;
  difficultyScore: number;
  primarySkill: string;
  secondarySkills: string[];
  skillFamily: string;
  movementMode: DrillMovementMode;
  progressionStage: ProgressionStage;
  trainingFormat: DrillTrainingFormat;
  minPlayers: number;
  maxPlayers: number;
  basketsRequired: number;
  spaceRequired: DrillSpaceRequirement;
  equipmentRequired: string[];
  workSeconds: number;
  restSeconds: number;
  repetitions: number;
  sets: number;
  intensity: Intensity;
  cognitiveLoad: CognitiveLoad;
  reaction: boolean;
  defender: boolean;
  contactLevel: ContactLevel;
  bothHands: boolean;
  combinationElements?: number;
  offDribbleShooting?: boolean;
  tacticalComplexity?: TacticalComplexity;
  smallSidedPlayersPerTeam?: number;
  athleticFocus?: AthleticFocus;
  prerequisiteDrillIds: string[];
  progressionDrillIds: string[];
  regressionDrillIds: string[];
  compatibleNextDrillIds: string[];
  weeklyPriority: number;
  preferredPracticesPerWeek: number[];
  objective: string;
  execution: string[];
  coachingPoints: string[];
  commonMistakes: string[];
  corrections: string[];
  performanceStandard: string;
  gameTransfer: string;
  videoUrl: string;
};

/** A fully described BPDS drill record. */
export type Drill = {
  /** Internal id, the lower-cased drill code. */
  id: string;
  /** BPDS drill code, e.g. `COD-L3-016`. */
  code: string;
  /** Coach-facing drill name. */
  name: string;
  /** Code of the {@link Module} this drill belongs to. */
  moduleCode: string;
  /** Sub-category inside the module. */
  category: string;
  /** BPDS level: 1 Foundation, 2 Development, 3 Performance. */
  level: SkillLevel;
  /** Age at which the drill is typically introduced. */
  typicalIntroduction: string;
  /** Age groups the drill is suitable for. */
  suitableAges: AgeGroup[];
  /** Whether the skill is core, supporting or advanced. */
  skillStatus: string;
  /** What the drill develops. */
  objective: string;
  /** The methodological justification a coach can read out loud. */
  whyThisDrill: string;
  /** Equipment required to run the drill. */
  equipment: string[];
  /** Minimum number of players. */
  minPlayers: number;
  /** Maximum number of players. */
  maxPlayers: number;
  /** Court configurations the drill can run in. */
  courtArea: string[];
  /** How to set the drill up. */
  setup: string;
  /** Step-by-step execution. */
  execution: string[];
  /** Key coaching points. */
  coachingPoints: string[];
  /** Mistakes coaches should look for. */
  commonMistakes: string[];
  /** Corrections for those mistakes. */
  corrections: string[];
  /** Easier versions of the drill. */
  regression: string[];
  /** Harder versions of the drill. */
  progression: string[];
  /** Ways to measure performance. */
  performanceOptions: string[];
  /** Alternative versions. */
  variations: string[];
  /** Reads the player must make. */
  reads: string[];
  /** How the skill shows up in a real game. */
  gameApplication: string;
  /** Prescribed repetitions. */
  repetitions: string;
  /** Prescribed work time. */
  workTime: string;
  /** Prescribed rest time. */
  restTime: string;
  /** Default duration in minutes. */
  duration: number;
  /** Physical intensity. */
  intensity: Intensity;
  /** Whether live defense is involved. */
  withDefense: boolean;
  /** Whether the drill is individual, group, or both. */
  grouping: Grouping;
  /** Demonstration video URL. */
  videoUrl: string;
  /** Thumbnail URL. */
  thumbnail: string;
  /** Free-form search tags. */
  tags: string[];
  /** Ids of related drills. */
  relatedDrills: string[];
  /** Ids of drills that should be trained first. */
  prerequisiteDrills: string[];
  /** Ids of drills that naturally follow. */
  followUpDrills: string[];
  /** True when the drill is BPDS original content. */
  bpdsOriginal: boolean;
  /** Optional, gradually migrated Generator Engine metadata. */
  generator?: Partial<DrillGeneratorMetadata>;
  /** Only published drills are offered to coaches. */
  published: boolean;
};

/**
 * Returns the BPDS level label for a drill level.
 * @param level the BPDS skill level.
 * @returns `Level 1 Foundation`, `Level 2 Development` or `Level 3 Performance`.
 */
export function drillLevelLabel(level: SkillLevel): string {
  const names: Record<SkillLevel, string> = {
    1: 'Level 1 Foundation',
    2: 'Level 2 Development',
    3: 'Level 3 Performance',
  };
  return names[level];
}

/**
 * True when a drill can be run by a given number of players.
 * @param drill the drill to check.
 * @param playerCount how many players are available.
 */
export function fitsPlayerCount(drill: Drill, playerCount: number): boolean {
  return playerCount >= drill.minPlayers;
}

/**
 * True when every piece of equipment a drill needs is available.
 * @param drill the drill to check.
 * @param available equipment the coach declared as available.
 */
export function hasEquipment(drill: Drill, available: string[]): boolean {
  return drill.equipment.every((e) => e === 'No additional equipment' || available.includes(e));
}
