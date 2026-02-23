import type { Matrix, AdjustmentState, FilterHistoryEntry } from './types.ts';
import { PRESETS } from './presets.ts';

export const MAX_FILTERS = 16;
export const MAX_IMAGE_DIM = 3840;

/** Current convolution matrix – always a mutable deep copy */
export const filterMatrixState: Matrix = PRESETS.identity.map((row) => [...row]);

/** Current adjustment sliders */
export const adjustmentState: AdjustmentState = { grayscale: 0, r: 100, g: 100, b: 100, contrast: 100 };

export function resetAdjustmentState(): void {
  adjustmentState.grayscale = 0;
  adjustmentState.r = 100;
  adjustmentState.g = 100;
  adjustmentState.b = 100;
  adjustmentState.contrast = 100;
}

/** Applied filter stack (max MAX_FILTERS entries) */
export const filterHistory: FilterHistoryEntry[] = [];

/** The original imported image URL – used for full reset */
export let originalImageUrl = '';
export function setOriginalImageUrl(url: string): void {
  originalImageUrl = url;
}
