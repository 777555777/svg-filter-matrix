import { dom } from './dom.ts';
import { filterHistory, filterMatrixState, MAX_FILTERS } from './state.ts';
import { PRESETS } from './presets.ts';
import type { Matrix } from './types.ts';
import { setMatrixUI, updateFilterUI, updateHistoryList, updateControlsState } from './ui.ts';

// ---------------------------------------------------------------------------
// SVG filter chain
// ---------------------------------------------------------------------------

function createFilterElement(matrix: Matrix, id: string): SVGElement {
  const fe = document.createElementNS('http://www.w3.org/2000/svg', 'feConvolveMatrix');
  const flat = matrix.flat();
  const divisor = flat.reduce((sum, val) => sum + val, 0);
  const safeDivisor = divisor === 0 ? 1 : divisor;

  fe.setAttribute('order', '3');
  fe.setAttribute('kernelMatrix', flat.join(' '));
  fe.setAttribute('divisor', String(safeDivisor));
  fe.setAttribute('data-id', id);

  if (divisor === 0) {
    fe.setAttribute('preserveAlpha', 'true');
  }

  return fe;
}

/** Rebuild the entire SVG <filter> contents from history + current preview */
export function updateFilterChain(): void {
  dom.svgFilter.innerHTML = '';

  filterHistory.forEach((filter, index) => {
    dom.svgFilter.appendChild(createFilterElement(filter.matrix, `applied-${index}`));
  });

  dom.svgFilter.appendChild(createFilterElement(filterMatrixState, 'preview'));
  updateFilterUI();
}

// ---------------------------------------------------------------------------
// Matrix helpers
// ---------------------------------------------------------------------------

/** Push matrix values to UI inputs + rebuild SVG filter chain */
export function setMatrix(matrix: Matrix): void {
  setMatrixUI(matrix);
  updateFilterChain();
}

// ---------------------------------------------------------------------------
// Preset handling
// ---------------------------------------------------------------------------

/** Load a preset into state + UI (also rebuilds the filter chain) */
export function applyPreset(presetName: string): void {
  const preset = PRESETS[presetName];
  if (!preset) return;

  filterMatrixState.length = 0;
  preset.forEach((row) => filterMatrixState.push([...row]));
  setMatrix(filterMatrixState);
  dom.preset.value = presetName;
}

// ---------------------------------------------------------------------------
// History actions
// ---------------------------------------------------------------------------

export function applyCurrentFilter(): void {
  if (filterHistory.length >= MAX_FILTERS) {
    alert(`Maximum of ${MAX_FILTERS} filters reached!`);
    return;
  }

  filterHistory.push({
    matrix: filterMatrixState.map((row) => [...row]),
    preset: dom.preset.value,
    timestamp: Date.now(),
  });

  if (filterHistory.length >= MAX_FILTERS) {
    applyPreset('identity');
  } else if (dom.preset.value !== 'custom') {
    applyPreset(dom.preset.value);
  }

  updateFilterChain();
  updateHistoryList();
}

export function undoLastFilter(): void {
  if (filterHistory.length === 0) return;
  filterHistory.pop();
  updateFilterChain();
  updateHistoryList();
  updateControlsState();
}

export function resetAllFilters(): void {
  filterHistory.length = 0;
  applyPreset('identity');
  updateHistoryList();
  updateControlsState();
}

export function removeFilter(index: number): void {
  filterHistory.splice(index, 1);
  updateFilterChain();
  updateHistoryList();
  updateControlsState();
}
