/**
 * Shared BPDS primitive types.
 *
 * These are the cross-domain vocabulary of the platform. Every other BPDS
 * domain (methodology, people, practices, admin) imports from here rather
 * than redefining its own age groups or skill levels, so the terminology
 * stays consistent as the product grows to the full BPDS exercise database.
 */

/** Age groups supported across the BPDS platform. */
export type AgeGroup = 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'Senior' | 'Professional';

/** Every age group in methodological order, youngest first. */
export const AGE_GROUPS: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Senior', 'Professional'];

/**
 * BPDS skill levels.
 * Level 1 Foundation, Level 2 Development, Level 3 Performance.
 */
export type SkillLevel = 1 | 2 | 3;

/** Human-readable BPDS level names, indexed by {@link SkillLevel}. */
export const SKILL_LEVEL_NAMES: Record<SkillLevel, string> = {
  1: 'Foundation',
  2: 'Development',
  3: 'Performance',
};

/** Coach-facing player skill labels. */
export type PlayerSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Elite';

/** Every player skill level in ascending order. */
export const PLAYER_SKILL_LEVELS: PlayerSkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

/** Physical intensity of a drill or a whole session. */
export type Intensity = 'Low' | 'Medium' | 'High';

/** Every intensity option. */
export const INTENSITIES: Intensity[] = ['Low', 'Medium', 'High'];

/** Whether a drill is performed alone or requires a group. */
export type Grouping = 'Individual' | 'Group' | 'Both';

/** Who the practice is being generated for. */
export type TrainingType = 'Individual' | 'Small group' | 'Team';

/**
 * The eight methodological phases of a BPDS practice, in fixed order.
 *
 * This ordering is the core of BPDS methodology — a practice always moves
 * from preparation through technical work and decision making into game
 * application and competition before cooling down. It is never a random mix.
 */
export type Phase =
  | 'Warm-Up and Movement Preparation'
  | 'Individual Skill Activation'
  | 'Technical Skill Development'
  | 'Skill Application'
  | 'Decision Making'
  | 'Game Application'
  | 'Competitive Play'
  | 'Cool Down';

/** The eight BPDS phases in methodological order. */
export const PHASES: Phase[] = [
  'Warm-Up and Movement Preparation',
  'Individual Skill Activation',
  'Technical Skill Development',
  'Skill Application',
  'Decision Making',
  'Game Application',
  'Competitive Play',
  'Cool Down',
];

/** Equipment a coach can declare as available. */
export const EQUIPMENT_OPTIONS = [
  'Basketballs',
  'Cones',
  'Flat markers',
  'Tennis balls',
  'Size 3 ball',
  'Size 3 overweight ball, 600 g',
  'Size 5 overweight ball, 900 g',
  'Resistance bands',
  'Mini bands',
  'Agility ladder',
  'Contact pad',
  'Chairs',
  'Reaction lights',
  'No additional equipment',
] as const;

/** A single piece of BPDS equipment. */
export type Equipment = (typeof EQUIPMENT_OPTIONS)[number];

/** Court configurations a session can run in. */
export const COURT_SIZES = [
  'Full court',
  'Half court',
  'Quarter court',
  'Small indoor space',
  'Outdoor court',
  'Home training area',
] as const;

/** A single court configuration. */
export type CourtSize = (typeof COURT_SIZES)[number];

/**
 * Version 1 active roles.
 *
 * Parent, Club, Academy and Federation exist in {@link FUTURE_ROLES} for the
 * data model only — they have no interfaces in Version 1.
 */
export type ActiveRole = 'Coach' | 'Admin';

/** Roles reserved for later releases. Present in the model, no interfaces. */
export const FUTURE_ROLES = ['Parent', 'Club Admin', 'Academy Admin', 'Federation Admin'] as const;

/** Any role known to the data model, active or reserved. */
export type Role = ActiveRole | (typeof FUTURE_ROLES)[number];

/** Subscription tiers. Modelled only — no payment processing in Version 1. */
export type SubscriptionTier = 'Free Preview' | 'Monthly' | 'Annual' | 'Club' | 'Academy' | 'Federation';

/** Anything persisted by a repository carries a stable string id. */
export type Identifiable = {
  /** Stable unique identifier. */
  id: string;
};

/** An ISO date string, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Returns today as an ISO `YYYY-MM-DD` date string. */
export function today(): IsoDate {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Creates a prefixed unique id.
 * @param prefix short domain prefix, e.g. `player` or `practice`.
 * @returns a unique id such as `player-l8x2k1-431`.
 */
export function createId(prefix: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 1000);
  return `${prefix}-${stamp}-${rand}`;
}

/**
 * Returns the age groups at or above a given age group.
 * @param from the youngest age group to include.
 * @returns the matching age groups in methodological order.
 */
export function agesFrom(from: AgeGroup): AgeGroup[] {
  return AGE_GROUPS.slice(AGE_GROUPS.indexOf(from));
}
