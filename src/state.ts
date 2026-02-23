import type { Matrix, FilterHistoryEntry } from './types.ts';
import { PRESETS } from './presets.ts';

export const MAX_FILTERS = 16;
export const MAX_IMAGE_DIM = 3840;

/** Current matrix being edited – always a mutable deep copy */
export const filterMatrixState: Matrix = PRESETS.identity.map((row) => [...row]);

/** Applied filter stack (max MAX_FILTERS entries) */
export const filterHistory: FilterHistoryEntry[] = [];

/** The original imported image URL – used for full reset */
export let originalImageUrl = '';
export function setOriginalImageUrl(url: string): void {
  originalImageUrl = url;
}
