import { dom } from './dom.ts';
import {
  filterHistory,
  filterMatrixState,
  adjustmentState,
  resetAdjustmentState,
  MAX_FILTERS,
  originalImageUrl,
} from './state.ts';
import { PRESETS } from './presets.ts';
import type { Matrix, AdjustmentState } from './types.ts';
import {
  setMatrixUI,
  updateFilterUI,
  setAdjustmentUI,
  appendHistoryItem,
  removeHistoryItems,
  rebuildHistoryList,
  updateControlsState,
} from './ui.ts';
import { trackObjectUrl, pruneTrackedObjectUrls } from './object-url.ts';

// ---------------------------------------------------------------------------
// Mode helper
// ---------------------------------------------------------------------------

export function getActiveMode(): 'convolution' | 'adjustment' {
  return dom.modeConv.checked ? 'convolution' : 'adjustment';
}

// ---------------------------------------------------------------------------
// SVG filter – rebuild the single filter primitive based on active mode
// ---------------------------------------------------------------------------

function applyConvolveFilter(matrix: Matrix): void {
  dom.svgFilter.innerHTML = '';
  const fe = document.createElementNS('http://www.w3.org/2000/svg', 'feConvolveMatrix');
  const flat = matrix.flat();
  const divisor = flat.reduce((s, v) => s + v, 0);
  const safeDivisor = divisor === 0 ? 1 : divisor;
  fe.setAttribute('order', '3');
  fe.setAttribute('kernelMatrix', flat.join(' '));
  fe.setAttribute('divisor', String(safeDivisor));
  if (divisor === 0) fe.setAttribute('preserveAlpha', 'true');
  dom.svgFilter.appendChild(fe);
}

function buildColorMatrix(st: AdjustmentState): string {
  const t = st.grayscale / 100; // 0–1
  const r = st.r / 100;
  const g = st.g / 100;
  const b = st.b / 100;
  const c = st.contrast / 100; // 0–2, 1 = no change
  const bias = (1 - c) / 2; // contrast-about-midpoint bias

  // Luminance coefficients (Rec. 709)
  const rC = 0.2126,
    gC = 0.7152,
    bC = 0.0722;
  const s = 1 - t; // saturation remaining

  // Per-channel grayscale blend scaled by contrast c, with bias offset
  const m = [
    /* R row */ c * (rC + s * (1 - rC)) * r,
    c * (gC - s * gC) * r,
    c * (bC - s * bC) * r,
    0,
    bias,
    /* G row */ c * (rC - s * rC) * g,
    c * (gC + s * (1 - gC)) * g,
    c * (bC - s * bC) * g,
    0,
    bias,
    /* B row */ c * (rC - s * rC) * b,
    c * (gC - s * gC) * b,
    c * (bC + s * (1 - bC)) * b,
    0,
    bias,
    /* A row */ 0,
    0,
    0,
    1,
    0,
  ];

  return m.map((v) => v.toFixed(4)).join(' ');
}

function applyColorMatrixFilter(st: AdjustmentState): void {
  dom.svgFilter.innerHTML = '';
  const fe = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
  fe.setAttribute('type', 'matrix');
  fe.setAttribute('values', buildColorMatrix(st));
  dom.svgFilter.appendChild(fe);
}

/** Sync the SVG filter element with current mode + state */
export function updateFilterChain(): void {
  if (getActiveMode() === 'convolution') {
    applyConvolveFilter(filterMatrixState);
  } else {
    applyColorMatrixFilter(adjustmentState);
  }
  updateFilterUI();
}

// ---------------------------------------------------------------------------
// Canvas bake
// ---------------------------------------------------------------------------

function bakeFilteredImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = dom.inputImg.naturalWidth;
    canvas.height = dom.inputImg.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'url(#convolve)';
    ctx.drawImage(dom.inputImg, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob while baking filter'));
          return;
        }
        resolve(trackObjectUrl(URL.createObjectURL(blob)));
      },
      'image/jpeg',
      0.95
    );
  });
}

function pruneUnusedObjectUrls(): void {
  const live = new Set<string>();
  if (originalImageUrl) live.add(originalImageUrl);
  if (dom.inputImg.src) live.add(dom.inputImg.src);
  filterHistory.forEach((entry) => {
    if (entry.snapshotUrl) live.add(entry.snapshotUrl);
  });
  pruneTrackedObjectUrls(live);
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

function getConvolutionLabel(): string {
  const option = dom.preset.querySelector<HTMLOptionElement>(`option[value="${dom.preset.value}"]`);
  return option?.textContent ?? dom.preset.value;
}

function getAdjustmentLabel(st: AdjustmentState): string {
  const parts: string[] = [];
  if (st.grayscale > 0) parts.push(`Gray ${st.grayscale}%`);
  if (st.r !== 100 || st.g !== 100 || st.b !== 100) parts.push(`RGB ${st.r}/${st.g}/${st.b}`);
  if (st.contrast !== 100) parts.push(`Contrast ${st.contrast}%`);
  return parts.length > 0 ? parts.join(' · ') : 'Identity';
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

  try {
    const mode = getActiveMode();
    const label = mode === 'convolution' ? getConvolutionLabel() : getAdjustmentLabel(adjustmentState);

    // Snapshot the current img src before baking
    const snapshotUrl = dom.inputImg.src;
    const bakedUrl = await bakeFilteredImage();

    filterHistory.push({ label, snapshotUrl });
    dom.inputImg.src = bakedUrl;

    // Reset current operator to identity after apply
    if (mode === 'convolution') {
      if (filterHistory.length >= MAX_FILTERS) {
        applyPreset('identity');
      } else if (dom.preset.value !== 'custom') {
        applyPreset(dom.preset.value);
      }
    } else {
      resetAdjustmentState();
      setAdjustmentUI(adjustmentState);
    }

    updateFilterChain();
    appendHistoryItem(filterHistory[filterHistory.length - 1], filterHistory.length - 1);
  } catch (error) {
    console.error('Failed to apply filter', error);
  }
  pruneUnusedObjectUrls();
  updateControlsState();
}

export function undoLastFilter(): void {
  if (filterHistory.length === 0) return;

  const entry = filterHistory.pop()!;
  dom.inputImg.src = entry.snapshotUrl;

  updateFilterChain();
  updateControlsState();
  removeHistoryItems(filterHistory.length, () => {});
  pruneUnusedObjectUrls();
}

export function resetAllFilters(): void {
  filterHistory.length = 0;

  if (originalImageUrl) {
    dom.inputImg.src = originalImageUrl;
  }

  applyPreset('identity');
  resetAdjustmentState();
  setAdjustmentUI(adjustmentState);
  rebuildHistoryList();
  updateControlsState();
  pruneUnusedObjectUrls();
}

/** Revert to state before filter at index (removes it and everything after) */
export function removeFilter(index: number): void {
  if (index < 0 || index >= filterHistory.length) return;

  dom.inputImg.src = filterHistory[index].snapshotUrl;
  filterHistory.splice(index);

  updateFilterChain();
  updateControlsState();
  removeHistoryItems(index, () => {});
  pruneUnusedObjectUrls();
}
