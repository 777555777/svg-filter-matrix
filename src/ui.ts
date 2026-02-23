import { dom } from './dom.ts';
import { filterHistory, filterMatrixState, MAX_FILTERS, originalImageUrl } from './state.ts';
import { PRESETS } from './presets.ts';
import type { Matrix, FilterHistoryEntry, AdjustmentState } from './types.ts';

/** Sync the 3×3 number inputs with the given matrix values */
export function setMatrixUI(matrix: Matrix): void {
  dom.matrixInputs.forEach((input, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    input.value = String(matrix[row][col]);
  });
}

/** Check if current matrix matches a preset and update the <select> */
export function updatePresetSelection(): void {
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (matricesMatch(filterMatrixState, preset)) {
      dom.preset.value = name;
      return;
    }
  }
  dom.preset.value = 'custom';
}

/** Deep-compare two matrices */
function matricesMatch(a: Matrix, b: Matrix): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

/** Update filter-count badge + button disabled states */
export function updateFilterUI(): void {
  dom.filterCount.textContent = String(filterHistory.length);

  // Update meter bar
  dom.filterMeterFill.style.width = `${(filterHistory.length / MAX_FILTERS) * 100}%`;

  const limitReached = filterHistory.length >= MAX_FILTERS;

  dom.undoBtn.disabled = filterHistory.length === 0;
  dom.applyBtn.disabled = limitReached;

  const hasImage = originalImageUrl !== '';
  if (!hasImage) {
    dom.applyBtn.disabled = true;
  }

  if (limitReached) {
    dom.preset.disabled = true;
    dom.matrixInputs.forEach((input) => {
      input.disabled = true;
    });
  }
}

/** Append a single new history item to the list without re-rendering anything else */
export function appendHistoryItem(entry: FilterHistoryEntry, index: number): void {
  // Demote the previous last button from "Undo" to "Revert"
  const btns = dom.historyList.querySelectorAll<HTMLButtonElement>('.history-remove');
  if (btns.length > 0) btns[btns.length - 1].title = 'Revert to before this filter';

  const li = document.createElement('li');
  li.className = 'history-item';
  li.innerHTML = `
    <span class="history-index">${index + 1}.</span>
    <span class="history-name">${entry.label}</span>
    <button class="history-remove" data-index="${index}" title="Undo this filter">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `;
  dom.historyList.appendChild(li);
  updateFilterUI();
}

/** Animate items from fromIndex onwards out of the list, then remove them from the DOM */
export function removeHistoryItems(fromIndex: number, onDone: () => void): void {
  const items = dom.historyList.querySelectorAll<HTMLElement>('.history-item');
  const toRemove = Array.from(items).slice(fromIndex);

  if (toRemove.length === 0) {
    onDone();
    return;
  }

  toRemove.forEach((el) => el.classList.add('removing'));

  setTimeout(() => {
    toRemove.forEach((el) => el.remove());
    // Promote the new last item's button back to "Undo"
    const remaining = dom.historyList.querySelectorAll<HTMLButtonElement>('.history-remove');
    if (remaining.length > 0) remaining[remaining.length - 1].title = 'Undo this filter';
    onDone();
  }, 260);
}

/** Full list clear – only called on reset when the entire history is wiped */
export function rebuildHistoryList(): void {
  dom.historyList.innerHTML = '';
  updateFilterUI();
}

/** Sync adjustment slider UI with state */
export function setAdjustmentUI(st: AdjustmentState): void {
  dom.adjGray.value = String(st.grayscale);
  dom.adjR.value = String(st.r);
  dom.adjG.value = String(st.g);
  dom.adjB.value = String(st.b);
  dom.adjContrast.value = String(st.contrast);
  dom.adjGrayVal.textContent = `${st.grayscale}%`;
  dom.adjRVal.textContent = `${st.r}%`;
  dom.adjGVal.textContent = `${st.g}%`;
  dom.adjBVal.textContent = `${st.b}%`;
  dom.adjContrastVal.textContent = `${st.contrast}%`;
}

/** Enable / disable controls depending on image-loaded + filter-limit state */
export function updateControlsState(): void {
  const hasImage = originalImageUrl !== '';
  const limitReached = filterHistory.length >= MAX_FILTERS;

  dom.preset.disabled = !hasImage || limitReached;
  dom.matrixInputs.forEach((input) => {
    input.disabled = !hasImage || limitReached;
  });

  // Adjustment sliders
  const adjDisabled = !hasImage || limitReached;
  dom.adjGray.disabled = adjDisabled;
  dom.adjR.disabled = adjDisabled;
  dom.adjG.disabled = adjDisabled;
  dom.adjB.disabled = adjDisabled;
  dom.adjContrast.disabled = adjDisabled;

  dom.applyBtn.disabled = !hasImage || limitReached;
  dom.deleteBtn.disabled = !hasImage;
  dom.downloadBtn.disabled = !hasImage;
  dom.resetBtn.disabled = !hasImage;

  if (!hasImage) {
    dom.undoBtn.disabled = true;
  }
}
