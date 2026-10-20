/**
 * Compatibility re-exports for the BPDS domain vocabulary.
 *
 * The prototype used to declare its own copies of these types. They now live
 * in the BPDS components, so this file is a thin adapter that keeps every
 * existing `../data/types.js` import working while there is exactly one
 * source of truth for the domain model.
 */
export type {
  AgeGroup,
  Phase,
  PlayerSkillLevel,
  SkillLevel,
} from '@predrag-miletic/bpds-storage.entities.shared-types';

export type { Drill, Module } from '@predrag-miletic/bpds-methodology.entities.methodology';

export type { Coach, Player, Team } from '@predrag-miletic/bpds-people.entities.people';

export type {
  GeneratorContext,
  HistoryEntry,
  Practice,
  PracticeItem,
} from '@predrag-miletic/bpds-practices.entities.practice';
