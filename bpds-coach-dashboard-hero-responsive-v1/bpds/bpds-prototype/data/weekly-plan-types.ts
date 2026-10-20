import type {
  AgeGroup,
  GeneratorContext,
  Practice,
  PlayerSkillLevel,
  SkillLevel,
} from './types.js';

/**
 * Weekly Plan domain types.
 *
 * These types sit alongside the single-practice generator context — a weekly
 * plan is just a schedule of {@link WeeklyDaySlot}s that each produce a
 * normal `Practice` through the existing practice service. Vocabulary types
 * (`AgeGroup`, `SkillLevel`, `PlayerSkillLevel`, `GeneratorContext`,
 * `Practice`) are re-used from the app's central type adapter rather than
 * redefined here.
 */

/** Named days of the week, Monday first, used to schedule weekly sessions. */
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** A single day of the week a weekly plan session can be scheduled on. */
export type WeekDay = typeof WEEKDAYS[number];

/** Who the week is being planned for — same vocabulary the single-practice generator uses. */
export type WeeklyTrainingType = GeneratorContext['trainingType'];

/** Session intensity, reusing the generator's own intensity vocabulary. */
export type WeeklyIntensity = GeneratorContext['intensity'];

/** Where the team sits in its season. Informational only — it never changes generation. */
export type SeasonPhase = 'Pre-Season' | 'In-Season' | 'Post-Season' | 'Off-Season';

/** The role a single session plays inside the weekly Learn -> Develop -> Decide -> Apply/Compete progression. */
export type WeeklySessionRole =
  | 'Learn / Develop / Apply'
  | 'Learn & Build'
  | 'Develop'
  | 'Develop & Decide'
  | 'Decide & Apply'
  | 'Decide Under Pressure'
  | 'Apply & Compete'
  | 'Pre-Game Application';

/** Which slice of the weekly focus split (Primary / Secondary / Maintenance) a session is built around. */
export type WeeklyFocusMode = 'Primary' | 'Secondary' | 'Maintenance';

/** One scheduled day inside a weekly plan, before generation. */
export type WeeklyDaySlot = {
  /** Stable id for the slot, unique inside the plan. */
  id: string;
  /** The weekday the session is scheduled on. */
  dayOfWeek: WeekDay;
  /** Planned session length in minutes. */
  duration: number;
};

/** The coach's weekly training context — the input to the weekly plan generator. */
export type WeeklyPlanContext = {
  /** Who the week is being planned for. */
  trainingType: WeeklyTrainingType;
  /** Ids of the players training, when not training a full team. */
  playerIds: string[];
  /** Optional team id when training a full team. */
  teamId?: string;
  /** ISO date (ideally a Monday) the week starts on. */
  weekStart: string;
  /** Age group the week targets. */
  ageGroup: AgeGroup;
  /**
   * BPDS methodological level (1 Foundation, 2 Development, 3 Performance).
   * The coach sets this explicitly — BPDS never advances it automatically.
   */
  bpdsLevel: SkillLevel;
  /** Scheduled days for this week, one per session (1–4 sessions). */
  days: WeeklyDaySlot[];
  /** Main weekly training focus. */
  primaryFocus: string;
  /** Secondary weekly training focus. */
  secondaryFocus: string;
  /** Optional light maintenance focus, kept alive alongside primary/secondary work. */
  maintenanceFocus?: string;
  /** Weekday of the next game, if any — the session right before it is tapered automatically. */
  gameDay?: WeekDay;
  /** Where the team sits in its season — informational only. */
  seasonPhase: SeasonPhase;
  /** How many players are on the court. */
  playerCount: number;
  /** How many baskets are available. */
  baskets: number;
  /** Court configuration available. */
  courtSize: string;
  /** Equipment declared as available. */
  equipment: string[];
  /** Whether live defense may be used across the week. */
  withDefense: boolean;
};

/** One generated (or pending) session inside a weekly plan. */
export type WeeklySession = {
  /** Stable id, matches the originating {@link WeeklyDaySlot} id. */
  id: string;
  /** The weekday the session runs on. */
  dayOfWeek: WeekDay;
  /** ISO date of the session, derived from the plan's week start. */
  date: string;
  /** Planned session length in minutes. */
  duration: number;
  /** The session's role in the weekly progression. */
  role: WeeklySessionRole;
  /** Which weekly focus bucket this session is built around. */
  focusMode: WeeklyFocusMode;
  /** Session intensity used to generate the practice. */
  intensity: WeeklyIntensity;
  /** Coach-facing intensity label, e.g. "3/5" or "3-4/5". */
  intensityLabel: string;
  /** Whether the coach locked this session so a whole-week regenerate skips it. */
  locked: boolean;
  /** The generator context this session was (or would be) built from. */
  ctx: GeneratorContext;
  /** The generated practice, once built. */
  practice?: Practice;
};

/** A full weekly plan: the coach's context plus one generated session per scheduled day. */
export type WeeklyPlan = {
  /** Stable plan id. */
  id: string;
  /** The context the plan was built from. */
  context: WeeklyPlanContext;
  /** One session per scheduled day, in the order the coach scheduled them. */
  sessions: WeeklySession[];
  /**
   * Non-blocking guidance shown when the plan sits outside typical BPDS age
   * norms (session count, duration or rest days). BPDS still generates the
   * plan — this is a warning, never a block.
   */
  ageGuidanceWarning?: string;
};

/** Maps a numeric BPDS level to the coach-facing skill label the practice generator expects. */
export const LEVEL_TO_PLAYER_SKILL: Record<SkillLevel, PlayerSkillLevel> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};
