import type { Matrix, FilterHistoryEntry } from './types.ts';
import { PRESETS } from './presets.ts';

export const MAX_FILTERS = 16;

/** Current matrix being edited – always a mutable deep copy */
export const filterMatrixState: Matrix = PRESETS.identity.map((row) => [...row]);

/** Applied filter stack (max MAX_FILTERS entries) */
export const filterHistory: FilterHistoryEntry[] = [];
