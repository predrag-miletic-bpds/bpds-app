import type { Drill } from '@predrag-miletic/bpds-methodology.entities.methodology';

/** How serious a finding on an imported row is. */
export type IssueSeverity = 'error' | 'warning';

/** One problem found on a single imported row. */
export type ImportIssue = {
  /** Zero-based index of the row in the submitted batch. */
  row: number;
  /** Drill code of the row, when it could be read. */
  code?: string;
  /** The field the issue is about, or `record` when it concerns the whole row. */
  field: string;
  /** Whether the row is rejected (`error`) or accepted with a caveat (`warning`). */
  severity: IssueSeverity;
  /** Coach-facing explanation of what is wrong. */
  message: string;
};

/** The outcome of validating and importing a batch of drill rows. */
export type ImportResult = {
  /** Rows that passed validation, completed with BPDS defaults. */
  accepted: Drill[];
  /** Codes of rows that were rejected. */
  rejected: string[];
  /** Every error and warning found, in row order. */
  issues: ImportIssue[];
  /** Accepted rows whose code is new to the catalog. */
  added: number;
  /** Accepted rows that replace an existing drill with the same code. */
  updated: number;
};

/** Options accepted by the import service. */
export type ImportOptions = {
  /** Drill codes already in the catalog, used for add/update and duplicate detection. */
  existingCodes?: string[];
  /** Module codes the catalog knows about. Unknown modules are rejected. */
  moduleCodes?: string[];
  /** When true, accepted rows are forced to `published: false` for review. */
  asDraft?: boolean;
};
