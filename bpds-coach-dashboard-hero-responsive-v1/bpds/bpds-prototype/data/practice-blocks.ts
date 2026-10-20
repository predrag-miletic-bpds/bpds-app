import type { Practice, PracticeItem } from '@predrag-miletic/bpds-practices.entities.practice';

export type PracticeDrillItem = PracticeItem & {
  kind: 'drill';
  durationSeconds: number;
  blockId: string;
};

export type PracticeBlock = {
  id: string;
  name: string;
  order: number;
  drills: PracticeDrillItem[];
  durationSeconds: number;
};

export type PracticeWithBlocks = Practice & {
  blocks: PracticeBlock[];
  durationSeconds: number;
  items: PracticeItem[];
};

export type DrillForPracticeBlocks = {
  id: string;
  moduleCode?: string;
  category?: string;
  name?: string;
  duration?: number;
};

export function formatPracticeSeconds(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function durationSecondsForItem(
  item: Partial<PracticeItem> & { durationSeconds?: unknown },
  drill?: DrillForPracticeBlocks,
): number {
  const explicit = Number(item.durationSeconds);
  if (Number.isFinite(explicit)) return Math.max(0, Math.round(explicit));

  const minutes = Number(item.duration ?? drill?.duration ?? 0);
  return Number.isFinite(minutes) ? Math.max(0, Math.round(minutes * 60)) : 0;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'practice';
}

export function buildPracticeBlocks(
  items: readonly PracticeItem[] | null | undefined,
  drills: readonly DrillForPracticeBlocks[],
): { items: PracticeItem[]; blocks: PracticeBlock[]; durationSeconds: number } {
  const safeItems = Array.isArray(items) ? items : [];
  const drillsById = new Map(drills.map((drill) => [drill.id, drill]));
  const blocksByKey = new Map<string, PracticeBlock>();

  const normalizedItems = safeItems.map((item) => {
    if (item.kind !== 'drill' || !item.drillId) return item;

    const drill = drillsById.get(item.drillId);
    const blockKey = drill?.moduleCode ?? item.phase ?? 'practice';
    const blockName = drill?.category ?? item.phase ?? 'Practice';
    let block = blocksByKey.get(blockKey);

    if (!block) {
      block = {
        id: `block-${slug(blockKey)}-${blocksByKey.size + 1}`,
        name: blockName,
        order: blocksByKey.size,
        drills: [],
        durationSeconds: 0,
      };
      blocksByKey.set(blockKey, block);
    }

    const durationSeconds = durationSecondsForItem(item, drill);
    const normalized = {
      ...item,
      durationSeconds,
      blockId: block.id,
    } as PracticeDrillItem;

    block.drills.push(normalized);
    block.durationSeconds += durationSeconds;
    return normalized;
  });

  const blocks = [...blocksByKey.values()];
  return {
    items: normalizedItems,
    blocks,
    durationSeconds: blocks.reduce((total, block) => total + block.durationSeconds, 0),
  };
}

export function withPracticeBlocks(
  practice: Practice,
  items: readonly PracticeItem[],
  drills: readonly DrillForPracticeBlocks[],
): PracticeWithBlocks {
  const result = buildPracticeBlocks(items, drills);
  return {
    ...practice,
    items: result.items,
    blocks: result.blocks,
    durationSeconds: result.durationSeconds,
  } as PracticeWithBlocks;
}

export function sessionDurationSeconds(
  item: PracticeDrillItem | undefined,
  overrides: Record<string, number>,
): number {
  if (!item) return 0;
  return overrides[item.id] ?? item.durationSeconds;
}

export function adjustSessionDuration(
  item: PracticeDrillItem | undefined,
  overrides: Record<string, number>,
  deltaSeconds: number,
): { overrides: Record<string, number>; durationSeconds: number } {
  if (!item) return { overrides, durationSeconds: 0 };
  const durationSeconds = Math.max(0, sessionDurationSeconds(item, overrides) + deltaSeconds);
  return {
    overrides: { ...overrides, [item.id]: durationSeconds },
    durationSeconds,
  };
}

export function blockSessionDuration(
  block: PracticeBlock,
  overrides: Record<string, number>,
): number {
  return block.drills.reduce((total, item) => total + sessionDurationSeconds(item, overrides), 0);
}

export function practiceSessionDuration(
  blocks: readonly PracticeBlock[],
  overrides: Record<string, number>,
): number {
  return blocks.reduce((total, block) => total + blockSessionDuration(block, overrides), 0);
}
