import type { GeneratorContext, HistoryEntry, Practice, PracticeItem } from '@predrag-miletic/bpds-practices.entities.practice';
import { drillCount, phaseBreakdown, practiceDuration, toHistoryEntry } from '@predrag-miletic/bpds-practices.entities.practice';
import type { Repository } from '@predrag-miletic/bpds-storage.repository';
import { createId, today } from '@predrag-miletic/bpds-storage.entities.shared-types';
import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { getDrill } from '@predrag-miletic/bpds-methodology.drill-catalog';
import type { Alternative } from '@predrag-miletic/bpds-methodology.practice-generator';
import { findAlternatives, generatePractice } from '@predrag-miletic/bpds-methodology.practice-generator';

/** The repositories the practice service reads and writes. */
export type PracticeStores = {
  /** Saved and generated practices. */
  practices: Repository<Practice>;
  /** Completed session history, including coach notes. */
  history: Repository<HistoryEntry>;
};

/** The outcome of finishing a session in Practice Mode. */
export type CompletionResult = {
  /** The practice, now marked completed. */
  practice: Practice;
  /** The history entry written for the session. */
  entry: HistoryEntry;
};

/** The practice domain API used by the app. */
export type PracticeService = ReturnType<typeof createPracticeService>;

/**
 * Creates the BPDS practice service over the storage boundary.
 *
 * Generation, editing, running and history all go through this one surface, so
 * pages never reach into the generator or into persistence directly and the
 * same API can later be served by a backend without any page changing.
 *
 * @param stores the practice and history repositories.
 * @returns the practice domain API.
 */
export function createPracticeService(stores: PracticeStores) {
  const { practices, history } = stores;

  return {
    /** Every saved practice. */
    listPractices: (): Practice[] => practices.list(),

    /** One practice by id. */
    getPractice: (id: string): Practice | undefined => practices.get(id),

    /** Practices in a given lifecycle status. */
    listByStatus: (status: Practice['status']): Practice[] => practices.list().filter((p) => p.status === status),

    /**
     * Builds a methodologically correct practice from the coach's training
     * context. The result is a draft in memory — nothing is stored until
     * {@link savePractice} is called.
     *
     * @param ctx the coach's training context.
     */
    generate: (ctx: GeneratorContext): Practice => generatePractice(ctx),

    /** Insert or replace a practice. */
    savePractice: (practice: Practice): Practice => practices.upsert(practice),

    /** Delete a practice. */
    removePractice: (id: string): void => practices.remove(id),

    /**
     * Copies a practice as a fresh draft the coach can edit independently.
     * @param id the practice to copy.
     * @returns the copy, or `undefined` when the source is unknown.
     */
    duplicatePractice: (id: string): Practice | undefined => {
      const source = practices.get(id);
      if (!source) return undefined;
      return practices.add({
        ...source,
        id: createId('pr'),
        name: `${source.name} (Copy)`,
        date: today(),
        lastOpened: today(),
        status: 'Draft',
        items: source.items.map((item) => ({ ...item, completed: false })),
      });
    },

    /** Record that the coach opened a practice, for "recently opened" ordering. */
    touchPractice: (id: string): Practice | undefined => {
      const practice = practices.get(id);
      if (!practice) return undefined;
      return practices.update({ ...practice, lastOpened: today() });
    },

    /** Replace the timeline of a practice, keeping everything else intact. */
    updateItems: (id: string, items: PracticeItem[]): Practice | undefined => {
      const practice = practices.get(id);
      if (!practice) return undefined;
      return practices.update({ ...practice, items });
    },

    /** Toggle the done flag a coach sets on a slot in Practice Mode. */
    toggleItem: (id: string, itemId: string): Practice | undefined => {
      const practice = practices.get(id);
      if (!practice) return undefined;
      return practices.update({
        ...practice,
        items: practice.items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
      });
    },

    /** Attach a coach note to one slot on the timeline. */
    noteItem: (id: string, itemId: string, note: string): Practice | undefined => {
      const practice = practices.get(id);
      if (!practice) return undefined;
      return practices.update({
        ...practice,
        items: practice.items.map((item) => (item.id === itemId ? { ...item, note } : item)),
      });
    },

    /**
     * Swaps the drill in a slot for another one, keeping the slot's phase and
     * duration so the methodological structure of the practice is preserved.
     */
    replaceDrill: (id: string, itemId: string, drillId: string): Practice | undefined => {
      const practice = practices.get(id);
      if (!practice) return undefined;
      return practices.update({
        ...practice,
        items: practice.items.map((item) => (item.id === itemId ? { ...item, drillId } : item)),
      });
    },

    /** Suggested replacements for a drill, each with the reason it fits. */
    alternatives: (drill: Drill, practice: Practice): Alternative[] => findAlternatives(drill, practice),

    /** Resolve the drill behind a timeline slot. */
    drillOf: (item: PracticeItem): Drill | undefined => (item.drillId ? getDrill(item.drillId) : undefined),

    /** Total planned minutes of a practice. */
    durationOf: (practice: Practice): number => practiceDuration(practice),

    /** How many slots on the timeline are drills rather than breaks. */
    drillCountOf: (practice: Practice): number => drillCount(practice),

    /** Minutes allocated to each methodological phase. */
    phaseBreakdownOf: (practice: Practice): Record<string, number> => phaseBreakdown(practice),

    /**
     * Finishes a session: marks the practice completed and writes a history
     * entry with the coach's notes.
     *
     * @param id the practice that was run.
     * @param notes combined coach notes for the session.
     * @returns the completed practice and its history entry.
     */
    completePractice: (id: string, notes: string): CompletionResult | undefined => {
      const practice = practices.get(id);
      if (!practice) return undefined;
      const completedDrills = practice.items.filter((item) => item.kind === 'drill' && item.completed).length;
      const entry = toHistoryEntry(practice, notes, completedDrills, createId('h'), today());
      history.add(entry);
      const completed = practices.update({ ...practice, status: 'Completed', notes });
      return { practice: completed, entry };
    },

    /** Every completed session, newest first. */
    listHistory: (): HistoryEntry[] => history.list(),

    /** Completed sessions a given player took part in. */
    listPlayerHistory: (playerId: string): HistoryEntry[] => history
      .list()
      .filter((entry) => entry.playerIds.includes(playerId)),

    /** Delete a history entry. */
    removeHistoryEntry: (entryId: string): void => history.remove(entryId),

    /**
     * Headline training totals for the dashboard.
     * @returns completed sessions, minutes trained and drills completed.
     */
    totals: (): { sessions: number; minutes: number; drills: number } => history.list().reduce(
      (acc, entry) => ({
        sessions: acc.sessions + 1,
        minutes: acc.minutes + entry.duration,
        drills: acc.drills + entry.completedDrills,
      }),
      { sessions: 0, minutes: 0, drills: 0 },
    ),
  };
}
