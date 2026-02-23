function ref<T extends HTMLElement>(name: string): T {
  const el = document.querySelector<T>(`[d-ref="${name}"]`);
  if (!el) throw new Error(`Element [d-ref="${name}"] not found`);
  return el;
}

export const dom = {
  fileInput: ref<HTMLInputElement>('import'),
  dropzone: ref<HTMLLabelElement>('dropzone'),
  inputImg: ref<HTMLImageElement>('input-img'),
  deleteBtn: ref<HTMLButtonElement>('delete'),
  resetBtn: ref<HTMLButtonElement>('reset'),
  downloadBtn: ref<HTMLButtonElement>('download'),
  bakeOverlay: ref<HTMLElement>('bake-overlay'),
  preset: ref<HTMLSelectElement>('preset'),
  matrixInputs: document.querySelectorAll<HTMLInputElement>('[d-ref="matrix"] input[type="number"]'),
  applyBtn: ref<HTMLButtonElement>('apply'),
  undoBtn: ref<HTMLButtonElement>('undo'),
  filterCount: ref<HTMLElement>('filter-count'),
  historyList: ref<HTMLOListElement>('history-list'),
  svgFilter: document.querySelector<SVGFilterElement>('#convolve')!,
};
