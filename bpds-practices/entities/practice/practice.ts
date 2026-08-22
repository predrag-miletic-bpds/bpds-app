import type { AgeGroup, Intensity, Phase, PlayerSkillLevel, TrainingType } from '@predrag-miletic/bpds-storage.entities.shared-types';

/** One entry on a practice timeline — either a drill or a break. */
export type PracticeItem = {
  /** Stable item id, unique inside the practice. */
  id: string;
  /** Whether the slot runs a drill or is a break. */
  kind: 'drill' | 'break';
  /** Id of the drill, when `kind` is `drill`. */
  drillId?: string;
  /** Display label, used for breaks. */
  label?: string;
  /** Duration in minutes. */
  duration: number;
  /** Methodological phase the item sits in. */
  phase: Phase;
  /** Coach note attached to this slot. */
  note?: string;
  /** Whether the coach marked this slot done in Practice Mode. */
  completed?: boolean;
};

/** The coach's training context, used as the generator input. */
export type GeneratorContext = {
  /** Who the practice is for. */
  trainingType: TrainingType;
  /** Ids of the players training. */
  playerIds: string[];
  /** Optional team id when training a full team. */
  teamId?: string;
  /** Age group of the group being trained. */
  ageGroup: AgeGroup;
  /** Coach-facing skill level of the group. */
  skillLevel: PlayerSkillLevel;
  /** Total session length in minutes. */
  duration: number;
  /** How many players are on the court. */
  playerCount: number;
  /** How many baskets are available. */
  baskets: number;
  /** Court configuration available. */
  courtSize: string;
  /** Equipment the coach declared as available. */
  equipment: string[];
  /** Main training focus. */
  primaryFocus: string;
  /** Optional secondary training focus. */
  secondaryFocus: string;
  /** Target session intensity. */
  intensity: Intensity;
  /** Whether live defense may be used. */
  withDefense: boolean;
  /** Whether a competitive block is required. */
  competitive: boolean;
  /** Whether a small-sided game is required. */
  smallSidedGame: boolean;
};

/** A saved or generated practice plan. */
export type Practice = {
  /** Stable practice id. */
  id: string;
  /** Practice name shown to the coach. */
  name: string;
  /** ISO date the practice was created. */
  date: string;
  /** Ids of the players the practice was built for. */
  playerIds: string[];
  /** Optional team id. */
  teamId?: string;
  /** Age group the practice targets. */
  ageGroup: AgeGroup;
  /** Skill level the practice targets. */
  skillLevel: PlayerSkillLevel;
  /** Planned session length in minutes. */
  duration: number;
  /** Main training focus. */
  primaryFocus: string;
  /** Optional secondary training focus. */
  secondaryFocus: string;
  /** Equipment the practice was planned around. */
  equipment: string[];
  /** Court configuration the practice was planned for. */
  courtSize: string;
  /** The methodological objective sentence. */
  objective: string;
  /** Ordered practice timeline. */
  items: PracticeItem[];
  /** Lifecycle status. */
  status: 'Draft' | 'Scheduled' | 'Completed';
  /** ISO date the coach last opened the practice. */
  lastOpened: string;
  /** Coach notes captured for the session. */
  notes?: string;
};

/** A completed training session recorded to history. */
export type HistoryEntry = {
  /** Stable history entry id. */
  id: string;
  /** ISO date the session was completed. */
  date: string;
  /** Name of the practice that was run. */
  practiceName: string;
  /** Ids of the players who trained. */
  playerIds: string[];
  /** Optional team id. */
  teamId?: string;
  /** Total minutes planned. */
  duration: number;
  /** Primary focus of the session. */
  focus: string;
  /** How many items the coach marked done. */
  completedDrills: number;
  /** How many drills the practice contained. */
  totalDrills: number;
  /** Coach notes captured during and after the session. */
  notes: string;
};

/**
 * Total planned duration of a practice in minutes.
 * @param practice the practice to measure.
 */
export function practiceDuration(practice: Practice): number {
  return practice.items.reduce((total, item) => total + item.duration, 0);
}

/**
 * How many timeline items in a practice are drills, ignoring breaks.
 * @param practice the practice to measure.
 */
export function drillCount(practice: Practice): number {
  return practice.items.filter((item) => item.kind === 'drill').length;
}

/**
 * Minutes allocated to each methodological phase in a practice.
 * @param practice the practice to measure.
 * @returns a map of phase to minutes, only for phases in use.
 */
export function phaseBreakdown(practice: Practice): Record<string, number> {
  return practice.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.phase] = (acc[item.phase] ?? 0) + item.duration;
    return acc;
  }, {});
}

/**
 * Builds the history entry for a practice the coach just finished.
 * @param practice the practice that was run.
 * @param notes combined coach notes for the session.
 * @param completedDrills how many items the coach marked done.
 * @param id stable id for the entry.
 * @param date ISO date of completion.
 */
export function toHistoryEntry(
  practice: Practice,
  notes: string,
  completedDrills: number,
  id: string,
  date: string,
): HistoryEntry {
  return {
    id,
    date,
    practiceName: practice.name,
    playerIds: practice.playerIds,
    teamId: practice.teamId,
    duration: practiceDuration(practice),
    focus: practice.primaryFocus,
    completedDrills,
    totalDrills: drillCount(practice),
    notes,
  };
}
