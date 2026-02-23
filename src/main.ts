import { dom } from './dom.ts';
import { filterMatrixState } from './state.ts';
import { setMatrix, applyPreset, applyCurrentFilter, undoLastFilter, resetAllFilters, removeFilter } from './filter.ts';
import { updatePresetSelection } from './ui.ts';
import { handleFileChange, handleDropzoneClick, handleFileDrop, handleDragOver, clearImage } from './file-import.ts';

function init(): void {
  // Matrix input events (rAF-debounced to avoid redundant filter rebuilds)
  let rafPending = false;
  dom.matrixInputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const index = Array.from(dom.matrixInputs).indexOf(target);
      const row = Math.floor(index / 3);
      const col = index % 3;
      filterMatrixState[row][col] = parseFloat(target.value) || 0;
      updatePresetSelection();
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          setMatrix(filterMatrixState);
        });
      }
    });
  });

  // File import
  dom.fileInput.addEventListener('change', handleFileChange);
  dom.dropzone.addEventListener('click', handleDropzoneClick);
  dom.dropzone.addEventListener('drop', handleFileDrop);
  dom.dropzone.addEventListener('dragover', handleDragOver);

  // Preset selection
  dom.preset.addEventListener('change', (e) => {
    applyPreset((e.target as HTMLSelectElement).value);
  });

  // Filter actions
  dom.applyBtn.addEventListener('click', applyCurrentFilter);
  dom.undoBtn.addEventListener('click', undoLastFilter);
  dom.deleteBtn.addEventListener('click', clearImage);
  dom.resetBtn.addEventListener('click', resetAllFilters);

  // History remove – event delegation (no window.removeFilter needed)
  dom.historyList.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.history-remove');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    removeFilter(index);
  });

  // Set initial matrix state
  setMatrix(filterMatrixState);
}

init();
