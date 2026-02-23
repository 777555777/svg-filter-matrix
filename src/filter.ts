import { dom } from './dom.ts';
import { filterHistory, filterMatrixState, MAX_FILTERS, originalImageUrl } from './state.ts';
import { PRESETS } from './presets.ts';
import type { Matrix } from './types.ts';
import {
  setMatrixUI,
  updateFilterUI,
  appendHistoryItem,
  removeHistoryItems,
  rebuildHistoryList,
  updateControlsState,
} from './ui.ts';

// ---------------------------------------------------------------------------
// SVG filter – always a single feConvolveMatrix (live preview only)
// ---------------------------------------------------------------------------

/** Update the one existing <feConvolveMatrix> in-place */
function updateFilterElement(matrix: Matrix): void {
  const flat = matrix.flat();
  const divisor = flat.reduce((sum, val) => sum + val, 0);
  const safeDivisor = divisor === 0 ? 1 : divisor;

  const fe = dom.svgFilter.querySelector('feConvolveMatrix')!;
  fe.setAttribute('kernelMatrix', flat.join(' '));
  fe.setAttribute('divisor', String(safeDivisor));

  if (divisor === 0) {
    fe.setAttribute('preserveAlpha', 'true');
  } else {
    fe.removeAttribute('preserveAlpha');
  }
}

/** Sync the single SVG filter element with current matrix state */
export function updateFilterChain(): void {
  updateFilterElement(filterMatrixState);
  updateFilterUI();
}

// ---------------------------------------------------------------------------
// Canvas bake – rasterises the current SVG filter into the image
// ---------------------------------------------------------------------------

function bakeFilteredImage(): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = dom.inputImg.naturalWidth;
    canvas.height = dom.inputImg.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'url(#convolve)';
    ctx.drawImage(dom.inputImg, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.95
    );
  });
}

// ---------------------------------------------------------------------------
// Matrix helpers
// ---------------------------------------------------------------------------

/** Push matrix values to UI inputs + update SVG filter */
export function setMatrix(matrix: Matrix): void {
  setMatrixUI(matrix);
  updateFilterChain();
}

// ---------------------------------------------------------------------------
// Preset handling
// ---------------------------------------------------------------------------

/** Load a preset into state + UI */
export function applyPreset(presetName: string): void {
  const preset = PRESETS[presetName];
  if (!preset) return;

  filterMatrixState.length = 0;
  preset.forEach((row) => filterMatrixState.push([...row]));
  setMatrix(filterMatrixState);
  dom.preset.value = presetName;
}

// ---------------------------------------------------------------------------
// History actions (destructive bake workflow)
// ---------------------------------------------------------------------------

export async function applyCurrentFilter(): Promise<void> {
  if (filterHistory.length >= MAX_FILTERS) return;

  dom.applyBtn.disabled = true;

  // Flash the bake overlay to mask processing
  dom.bakeOverlay.classList.remove('active');
  void dom.bakeOverlay.offsetWidth;
  dom.bakeOverlay.classList.add('active');

  // Snapshot the current img src before baking
  const snapshotUrl = dom.inputImg.src;
  const bakedUrl = await bakeFilteredImage();

  filterHistory.push({
    matrix: filterMatrixState.map((row) => [...row]),
    preset: dom.preset.value,
    snapshotUrl,
  });

  dom.inputImg.src = bakedUrl;

  if (filterHistory.length >= MAX_FILTERS) {
    applyPreset('identity');
  } else if (dom.preset.value !== 'custom') {
    applyPreset(dom.preset.value);
  }

  updateFilterChain();
  appendHistoryItem(filterHistory[filterHistory.length - 1], filterHistory.length - 1);
}

export function undoLastFilter(): void {
  if (filterHistory.length === 0) return;

  const entry = filterHistory.pop()!;
  dom.inputImg.src = entry.snapshotUrl;

  updateFilterChain();
  updateControlsState();
  // fromIndex = new length (was the last index before pop)
  removeHistoryItems(filterHistory.length, () => {});
}

export function resetAllFilters(): void {
  filterHistory.length = 0;

  if (originalImageUrl) {
    dom.inputImg.src = originalImageUrl;
  }

  applyPreset('identity');
  rebuildHistoryList();
  updateControlsState();
}

/** Revert to state before filter at index (removes it and everything after) */
export function removeFilter(index: number): void {
  if (index < 0 || index >= filterHistory.length) return;

  dom.inputImg.src = filterHistory[index].snapshotUrl;
  filterHistory.splice(index);

  updateFilterChain();
  updateControlsState();
  removeHistoryItems(index, () => {});
}
