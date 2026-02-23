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
  filterMeterFill: ref<HTMLElement>('filter-meter-fill'),
  svgFilter: document.querySelector<SVGFilterElement>('#convolve')!,
  // Mode switcher
  modeConv: ref<HTMLInputElement>('mode-conv'),
  modeAdj: ref<HTMLInputElement>('mode-adj'),
  sectionConvolution: ref<HTMLElement>('section-convolution'),
  sectionAdjustments: ref<HTMLElement>('section-adjustments'),
  // Adjustment sliders
  adjGray: ref<HTMLInputElement>('adj-gray'),
  adjR: ref<HTMLInputElement>('adj-r'),
  adjG: ref<HTMLInputElement>('adj-g'),
  adjB: ref<HTMLInputElement>('adj-b'),
  adjGrayVal: ref<HTMLElement>('adj-gray-val'),
  adjRVal: ref<HTMLElement>('adj-r-val'),
  adjGVal: ref<HTMLElement>('adj-g-val'),
  adjBVal: ref<HTMLElement>('adj-b-val'),
  adjContrast: ref<HTMLInputElement>('adj-contrast'),
  adjContrastVal: ref<HTMLElement>('adj-contrast-val'),
};
