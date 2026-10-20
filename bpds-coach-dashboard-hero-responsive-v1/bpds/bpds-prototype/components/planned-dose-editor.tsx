import { useEffect, useState } from 'react';
import type {
  CoachDoseOverrideV1,
  RecommendedDoseTarget,
} from '@predrag-miletic/bpds-methodology.entities.methodology';
import type { PracticeItem } from '../data/types.js';
import { Badge, Button, Input } from '../ui/ui.js';

const targetValue = (target: RecommendedDoseTarget): string => {
  const range = target.target;
  if (range?.min === undefined && range?.max === undefined) return 'Not specified';
  const value = range.min === range.max
    ? String(range.min)
    : `${range.min ?? '…'}–${range.max ?? '…'}`;
  return `${value} ${range.unit ?? target.type.toLowerCase()}`;
};

/** Compact, typed dose text. No arbitrary object serialization reaches the UI. */
export const formatPlannedDoseTargetV1 = (
  target: RecommendedDoseTarget,
): string => `${targetValue(target)} · ${target.type} · ${target.scope}`;

/** Build a primary override while preserving any existing supported secondary override. */
export const createPrimaryDoseOverrideV1 = (
  item: PracticeItem,
  value: number,
): CoachDoseOverrideV1 => {
  if (!item.plannedDose) {
    throw new Error('Practice item has no BPDS dose recommendation.');
  }
  const recommendation = item.plannedDose.recommendation.primary;
  return {
    ...item.plannedDose.override,
    primary: {
      ...recommendation,
      target: {
        ...recommendation.target,
        min: value,
        max: value,
      },
    },
  };
};

const exactValue = (item: PracticeItem): string => {
  const primary = item.plannedDose?.override?.primary
    ?? item.plannedDose?.recommendation.primary;
  const range = primary?.target;
  return range?.min !== undefined && range.min === range.max
    ? String(range.min)
    : '';
};

export type PlannedDoseEditorProps = {
  item: PracticeItem;
  error?: string;
  onApply: (override: CoachDoseOverrideV1) => void;
  onRemove: () => void;
};

/** Minimal Builder control for existing Step 3B-3 coach dose overrides. */
export function PlannedDoseEditor({
  item,
  error,
  onApply,
  onRemove,
}: PlannedDoseEditorProps) {
  const envelope = item.plannedDose;
  const [value, setValue] = useState(() => exactValue(item));

  useEffect(() => {
    setValue(exactValue(item));
  }, [item]);

  if (!envelope) return null;

  const unit = envelope.recommendation.primary.target?.unit
    ?? envelope.recommendation.primary.type.toLowerCase();
  const numericValue = Number(value);
  const canApply = value.trim() !== '' && Number.isFinite(numericValue);

  return (
    <div
      data-testid={`planned-dose-${item.id}`}
      style={{
        margin: '8px 0 2px 30px',
        padding: '10px 12px',
        border: '1px solid var(--bpds-line)',
        borderRadius: 9,
        background: 'var(--bpds-panel)',
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <Badge tone="blue">
          Recommended: {formatPlannedDoseTargetV1(envelope.recommendation.primary)}
        </Badge>
        {envelope.override?.primary ? (
          <Badge tone="orange">
            Coach: {formatPlannedDoseTargetV1(envelope.override.primary)}
          </Badge>
        ) : null}
        <Badge tone={envelope.effective.provenance.primary === 'COACH_OVERRIDE' ? 'orange' : 'green'}>
          Effective: {formatPlannedDoseTargetV1(envelope.effective.primary)}
        </Badge>
      </div>

      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 750 }}>Coach override ({unit})</span>
        <Input
          aria-label={`Coach override for ${item.id}`}
          type="number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          style={{ width: 110 }}
        />
        <Button
          size="sm"
          variant="primary"
          disabled={!canApply}
          onClick={() => onApply(createPrimaryDoseOverrideV1(item, numericValue))}
        >
          {envelope.override ? 'Replace override' : 'Apply override'}
        </Button>
        {envelope.override ? (
          <Button size="sm" onClick={onRemove}>Remove override</Button>
        ) : null}
      </div>

      {error ? (
        <div role="alert" style={{ color: '#c2440f', fontSize: 12, fontWeight: 700 }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
