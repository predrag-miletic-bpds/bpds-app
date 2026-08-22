import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';
import { MODULES } from '@predrag-miletic/bpds-methodology.modules-catalog';
import { DRILLS } from '@predrag-miletic/bpds-methodology.drill-catalog';
import { AGE_GROUPS } from '@predrag-miletic/bpds-storage.entities.shared-types';
import type { AgeGroup, Intensity, SkillLevel } from '@predrag-miletic/bpds-storage.entities.shared-types';
import type { ImportIssue, ImportOptions, ImportResult } from './content-import-types.js';

/** A raw, untrusted drill row as it arrives from a spreadsheet or JSON file. */
export type DrillRow = Record<string, unknown>;

/** The BPDS drill code pattern, e.g. `COD-L3-016` or `WUP-001`. */
const CODE_PATTERN = /^[A-Z]{2,4}-(L[123]-)?\d{3}$/;

/** Fields a row must carry for BPDS to accept it as a drill. */
const REQUIRED_FIELDS = ['code', 'name', 'moduleCode', 'level', 'objective', 'whyThisDrill'] as const;

/** Read a string field, trimming whitespace. */
function str(row: DrillRow, field: string): string {
  const value = row[field];
  return typeof value === 'string' ? value.trim() : '';
}

/** Read a field that may arrive as an array or as a delimited string. */
function list(row: DrillRow, field: string): string[] {
  const value = row[field];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[\n;|]/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

/** Read a numeric field, returning `undefined` when it is absent or unparseable. */
function num(row: DrillRow, field: string): number | undefined {
  const value = row[field];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Read a boolean field written as a boolean, `yes`/`no` or `true`/`false`. */
function bool(row: DrillRow, field: string, fallback: boolean): boolean {
  const value = row[field];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
    if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  }
  return fallback;
}

/**
 * Validates one raw row against the BPDS drill schema.
 *
 * Errors reject the row. Warnings let it through but tell the admin what the
 * import filled in for them, so nothing is ever silently invented.
 *
 * @param row the raw row.
 * @param index zero-based position of the row in the batch.
 * @param moduleCodes module codes the catalog knows about.
 * @returns every issue found on the row.
 */
export function validateRow(row: DrillRow, index: number, moduleCodes: string[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const code = str(row, 'code').toUpperCase();
  const add = (field: string, severity: ImportIssue['severity'], message: string) => {
    issues.push({ row: index, code: code || undefined, field, severity, message });
  };

  REQUIRED_FIELDS.forEach((field) => {
    if (field === 'level') {
      if (num(row, 'level') === undefined) add('level', 'error', 'Level is required and must be 1, 2 or 3.');
      return;
    }
    if (!str(row, field)) add(field, 'error', `${field} is required.`);
  });

  if (code && !CODE_PATTERN.test(code)) {
    add('code', 'error', `Drill code "${code}" does not follow the BPDS pattern MODULE-Lx-000.`);
  }

  const moduleCode = str(row, 'moduleCode').toUpperCase();
  if (moduleCode && !moduleCodes.includes(moduleCode)) {
    add('moduleCode', 'error', `Unknown module "${moduleCode}". It is not part of the BPDS Master Module Map.`);
  }
  if (code && moduleCode && !code.startsWith(`${moduleCode}-`)) {
    add('code', 'warning', `Drill code "${code}" does not start with its module code "${moduleCode}".`);
  }

  const level = num(row, 'level');
  if (level !== undefined && ![1, 2, 3].includes(level)) {
    add('level', 'error', `Level must be 1, 2 or 3, received "${level}".`);
  }

  const ages = list(row, 'suitableAges');
  const unknownAges = ages.filter((age) => !AGE_GROUPS.includes(age as AgeGroup));
  if (unknownAges.length) add('suitableAges', 'error', `Unknown age groups: ${unknownAges.join(', ')}.`);
  if (!ages.length) add('suitableAges', 'warning', 'No age groups given — the drill will be offered to every age group.');

  const minPlayers = num(row, 'minPlayers');
  const maxPlayers = num(row, 'maxPlayers');
  if (minPlayers !== undefined && maxPlayers !== undefined && minPlayers > maxPlayers) {
    add('minPlayers', 'error', `Minimum players (${minPlayers}) is greater than maximum players (${maxPlayers}).`);
  }

  const duration = num(row, 'duration');
  if (duration !== undefined && (duration < 1 || duration > 45)) {
    add('duration', 'warning', `Duration of ${duration} minutes is outside the usual 1–45 minute range.`);
  }

  const intensity = str(row, 'intensity');
  if (intensity && !['Low', 'Medium', 'High'].includes(intensity)) {
    add('intensity', 'error', `Intensity must be Low, Medium or High, received "${intensity}".`);
  }

  if (str(row, 'whyThisDrill') && str(row, 'whyThisDrill').length < 40) {
    add('whyThisDrill', 'warning', 'The methodological justification is very short — coaches rely on it to explain the drill.');
  }

  if (!list(row, 'coachingPoints').length) {
    add('coachingPoints', 'warning', 'No coaching points given.');
  }

  return issues;
}

/**
 * Turns a validated row into a complete {@link Drill}, filling every field the
 * row did not supply with a BPDS default.
 *
 * @param row the validated raw row.
 * @param asDraft when true the drill is imported unpublished, for review.
 */
export function toDrill(row: DrillRow, asDraft = false): Drill {
  const code = str(row, 'code').toUpperCase();
  const ages = list(row, 'suitableAges') as AgeGroup[];
  const intensity = str(row, 'intensity');

  return {
    id: code.toLowerCase(),
    code,
    name: str(row, 'name'),
    moduleCode: str(row, 'moduleCode').toUpperCase(),
    category: str(row, 'category') || 'General',
    level: (num(row, 'level') ?? 1) as SkillLevel,
    typicalIntroduction: str(row, 'typicalIntroduction') || 'U12+',
    suitableAges: ages.length ? ages : [...AGE_GROUPS],
    skillStatus: str(row, 'skillStatus') || 'Core skill',
    objective: str(row, 'objective'),
    whyThisDrill: str(row, 'whyThisDrill'),
    equipment: list(row, 'equipment').length ? list(row, 'equipment') : ['Basketballs'],
    minPlayers: num(row, 'minPlayers') ?? 1,
    maxPlayers: num(row, 'maxPlayers') ?? 12,
    courtArea: list(row, 'courtArea'),
    setup: str(row, 'setup'),
    execution: list(row, 'execution'),
    coachingPoints: list(row, 'coachingPoints'),
    commonMistakes: list(row, 'commonMistakes'),
    corrections: list(row, 'corrections'),
    regression: list(row, 'regression'),
    progression: list(row, 'progression'),
    performanceOptions: list(row, 'performanceOptions'),
    variations: list(row, 'variations'),
    reads: list(row, 'reads'),
    gameApplication: str(row, 'gameApplication'),
    repetitions: str(row, 'repetitions'),
    workTime: str(row, 'workTime'),
    restTime: str(row, 'restTime'),
    duration: num(row, 'duration') ?? 6,
    intensity: (['Low', 'Medium', 'High'].includes(intensity) ? intensity : 'Medium') as Intensity,
    withDefense: bool(row, 'withDefense', false),
    grouping: 'Both',
    videoUrl: str(row, 'videoUrl'),
    thumbnail: str(row, 'thumbnail'),
    tags: list(row, 'tags'),
    relatedDrills: list(row, 'relatedDrills'),
    prerequisiteDrills: list(row, 'prerequisiteDrills'),
    followUpDrills: list(row, 'followUpDrills'),
    bpdsOriginal: bool(row, 'bpdsOriginal', true),
    published: asDraft ? false : bool(row, 'published', false),
  };
}

/**
 * Validates and converts a batch of raw drill rows.
 *
 * Nothing is written anywhere — the result is a report the admin panel shows
 * before the admin confirms the import, so a bad spreadsheet can never damage
 * the drill catalog.
 *
 * @param rows the raw rows to import.
 * @param options existing codes, known modules and draft handling.
 * @returns the accepted drills, the rejected codes and every issue found.
 */
export function importDrills(rows: DrillRow[], options: ImportOptions = {}): ImportResult {
  const moduleCodes = options.moduleCodes ?? MODULES.map((m) => m.code);
  const existing = new Set((options.existingCodes ?? DRILLS.map((d) => d.code)).map((c) => c.toUpperCase()));

  const accepted: Drill[] = [];
  const rejected: string[] = [];
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();
  let added = 0;
  let updated = 0;

  rows.forEach((row, index) => {
    const code = str(row, 'code').toUpperCase();
    const rowIssues = validateRow(row, index, moduleCodes);

    if (code && seen.has(code)) {
      rowIssues.push({
        row: index, code, field: 'code', severity: 'error', message: `Duplicate drill code "${code}" inside the same batch.`,
      });
    }
    if (code) seen.add(code);

    issues.push(...rowIssues);

    if (rowIssues.some((issue) => issue.severity === 'error')) {
      rejected.push(code || `row ${index + 1}`);
      return;
    }

    accepted.push(toDrill(row, options.asDraft));
    if (existing.has(code)) updated += 1;
    else added += 1;
  });

  return { accepted, rejected, issues, added, updated };
}

/**
 * Merges accepted drills into a catalog, replacing records with the same code
 * and appending the rest. The input catalog is never mutated.
 *
 * @param catalog the current drill catalog.
 * @param incoming the drills to merge in.
 * @returns a new catalog.
 */
export function mergeDrills(catalog: Drill[], incoming: Drill[]): Drill[] {
  const byCode = new Map(catalog.map((drill) => [drill.code, drill]));
  incoming.forEach((drill) => byCode.set(drill.code, drill));
  return [...byCode.values()];
}

/**
 * The BPDS content import service used by the admin panel.
 *
 * Exposed as an object so the admin pages depend on a service surface rather
 * than on loose functions, keeping the door open for a server-side importer
 * later without any page changing.
 */
export const contentImport = {
  /** Validate one raw row against the BPDS drill schema. */
  validateRow,
  /** Validate and convert a whole batch, returning a report. */
  importDrills,
  /** Complete a validated row with BPDS defaults. */
  toDrill,
  /** Merge accepted drills into a catalog by code. */
  mergeDrills,
  /** The drill code pattern BPDS enforces. */
  codePattern: (): RegExp => CODE_PATTERN,
  /** The fields every imported row must carry. */
  requiredFields: (): string[] => [...REQUIRED_FIELDS],
};
