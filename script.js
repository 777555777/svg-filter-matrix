// =============================================
// #region: Presets
// =============================================

const presets = {
  identity: [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ],
  blurGaussian: [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ],
  blurBox: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ],
  edgeSobelX: [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ],
  edgeSobelY: [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ],
  edgeLaplace: [
    [0, -1, 0],
    [-1, 4, -1],
    [0, -1, 0],
  ],
  sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
  emboss: [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ],
};
// #endregion

const ElementRefs = {
  import: document.querySelector('[d-ref="import"]'),
  dropzone: document.querySelector('[d-ref="dropzone"]'),
  inputImg: document.querySelector('[d-ref="input-img"]'),
  delete: document.querySelector('[d-ref="delete"]'),
  reset: document.querySelector('[d-ref="reset"]'),
  preset: document.querySelector('[d-ref="preset"]'),
  matrix: document.querySelectorAll('[d-ref="matrix"] input[type="number"]'),
  apply: document.querySelector('[d-ref="apply"]'),
  undo: document.querySelector('[d-ref="undo"]'),
  filterCount: document.querySelector('[d-ref="filter-count"]'),
  historyList: document.querySelector('[d-ref="history-list"]'),
  svgFilter: document.querySelector('#convolve'),
};

// Create a deep copy to avoid mutating the original preset
const filterMatrixState = presets.identity.map((row) => [...row]);

// Filter history state
const MAX_FILTERS = 8;
const filterHistory = [];

console.log('ElementRefs', ElementRefs);

function initMatrixInputs() {
  for (const input of ElementRefs.matrix) {
    input.addEventListener('input', handleMatrixInput);
  }
}

function handleMatrixInput(e) {
  const index = Array.from(ElementRefs.matrix).indexOf(e.target);
  const row = Math.floor(index / 3);
  const col = index % 3;
  const value = parseFloat(e.target.value) || 0;
  filterMatrixState[row][col] = value;
  setMatrix(filterMatrixState);

  // Check if current matrix matches any preset
  updatePresetSelection();
}

function appStartup() {
  initMatrixInputs();
  initFilterActions();
  setMatrix(filterMatrixState);
  updateFilterChain();
}

appStartup();

function setMatrix(matrix) {
  setMatrixUI(matrix);
  setMatrixSVG(matrix);
}

/**
 * Set the values of the matrix input fields in the UI based on the provided matrix
 * @param {number[][]} matrix
 */
function setMatrixUI(matrix) {
  ElementRefs.matrix.forEach((input, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    input.value = matrix[row][col];
  });
}

/**
 * Set the kernelMatrix attribute for the preview (last filter in chain)
 * @param {number[][]} matrix
 */
function setMatrixSVG(matrix) {
  // Update preview - this modifies the last filter element
  updateFilterChain();
}

// =============================================
// #region: File Import
// =============================================

function loadImageFile(file) {
  if (file && file.type.startsWith('image/')) {
    console.log('file', file);
    const reader = new FileReader();
    reader.onload = function (e) {
      ElementRefs.inputImg.setAttribute('src', e.target.result);
      updateControlsState();
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please select a valid image file');
  }
}

ElementRefs.import.addEventListener('change', handleFileChange);

function handleFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    loadImageFile(file);
  }
}

ElementRefs.dropzone.addEventListener('click', handleDropzoneClick);

function handleDropzoneClick(e) {
  // Don't trigger if clicking the input itself
  if (e.target !== ElementRefs.import) {
    ElementRefs.import.click();
  }
}

ElementRefs.dropzone.addEventListener('drop', handleFileDrop, false);

function handleFileDrop(e) {
  e.preventDefault();
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    loadImageFile(files[0]);
  }
}

// #endregion

// =============================================
// #region: Preset Handling
// =============================================

function applyPreset(presetName) {
  const presetMatrix = presets[presetName];
  if (presetMatrix) {
    filterMatrixState.length = 0; // Clear current state
    // Create deep copy to avoid mutating the original preset
    presetMatrix.forEach((row) => filterMatrixState.push([...row]));
    setMatrix(filterMatrixState);
    // Update select to match preset
    ElementRefs.preset.value = presetName;
  }
}

/**
 * Check if the current matrix matches any preset and update the select accordingly
 */
function updatePresetSelection() {
  // Check if current matrix matches any preset
  for (const [presetName, presetMatrix] of Object.entries(presets)) {
    if (matricesMatch(filterMatrixState, presetMatrix)) {
      ElementRefs.preset.value = presetName;
      return;
    }
  }

  // If no match found, set to custom
  ElementRefs.preset.value = 'custom';
}

/**
 * Check if two matrices are equal
 * @param {number[][]} matrix1
 * @param {number[][]} matrix2
 * @returns {boolean}
 */
function matricesMatch(matrix1, matrix2) {
  if (matrix1.length !== matrix2.length) return false;

  for (let i = 0; i < matrix1.length; i++) {
    if (matrix1[i].length !== matrix2[i].length) return false;
    for (let j = 0; j < matrix1[i].length; j++) {
      if (matrix1[i][j] !== matrix2[i][j]) return false;
    }
  }

  return true;
}

ElementRefs.preset.addEventListener('change', handlePresetChange);

function handlePresetChange(e) {
  const presetName = e.target.value;
  applyPreset(presetName);
}
// #endregion

// =============================================
// #region: Filter Chain Management
// =============================================

function updateFilterChain() {
  // Clear existing filters
  ElementRefs.svgFilter.innerHTML = '';

  // Add all applied filters from history
  filterHistory.forEach((filter, index) => {
    const feMatrix = createFilterElement(filter.matrix, `applied-${index}`);
    ElementRefs.svgFilter.appendChild(feMatrix);
  });

  // Add current preview filter (the one being edited)
  const previewMatrix = createFilterElement(filterMatrixState, 'preview');
  ElementRefs.svgFilter.appendChild(previewMatrix);

  // Update UI
  updateFilterUI();
}

function createFilterElement(matrix, id) {
  const feConvolve = document.createElementNS('http://www.w3.org/2000/svg', 'feConvolveMatrix');
  const matrixString = matrix.flat().join(' ');
  const divisor = matrix.flat().reduce((sum, val) => sum + val, 0);
  const safeDivisor = divisor === 0 ? 1 : divisor;

  feConvolve.setAttribute('order', '3');
  feConvolve.setAttribute('kernelMatrix', matrixString);
  feConvolve.setAttribute('divisor', safeDivisor);
  feConvolve.setAttribute('data-id', id);

  if (divisor === 0) {
    feConvolve.setAttribute('preserveAlpha', 'true');
  }

  return feConvolve;
}

function applyCurrentFilter() {
  if (filterHistory.length >= MAX_FILTERS) {
    alert(`Maximum of ${MAX_FILTERS} filters reached!`);
    return;
  }

  // Get current preset name
  const presetName = ElementRefs.preset.value;

  // Save current matrix to history
  filterHistory.push({
    matrix: filterMatrixState.map((row) => [...row]),
    preset: presetName,
    timestamp: Date.now(),
  });

  // If we just reached the limit, switch to identity
  if (filterHistory.length >= MAX_FILTERS) {
    applyPreset('identity');
  } else {
    // Keep the current preset selected (don't reset to identity)
    // Just create a fresh copy of the current matrix
    const currentPreset = ElementRefs.preset.value;
    if (currentPreset !== 'custom') {
      applyPreset(currentPreset);
    }
  }

  // Update the filter chain
  updateFilterChain();

  // Update history list UI
  updateHistoryList();
}

function undoLastFilter() {
  if (filterHistory.length === 0) return;

  filterHistory.pop();
  updateFilterChain();
  updateHistoryList();
  updateControlsState();
}

function resetAllFilters() {
  filterHistory.length = 0;
  applyPreset('identity');
  updateFilterChain();
  updateHistoryList();
  updateControlsState();
}

function updateFilterUI() {
  ElementRefs.filterCount.textContent = filterHistory.length;
  const limitReached = filterHistory.length >= MAX_FILTERS;

  // Undo always depends on history
  ElementRefs.undo.disabled = filterHistory.length === 0;

  // Apply button disabled when limit reached
  ElementRefs.apply.disabled = limitReached;

  // Re-check if image is loaded
  const hasImage = ElementRefs.inputImg.getAttribute('src') !== '';
  if (!hasImage) {
    ElementRefs.apply.disabled = true;
  }

  // Disable preset and matrix inputs when limit reached
  if (limitReached) {
    ElementRefs.preset.disabled = true;
    ElementRefs.matrix.forEach((input) => {
      input.disabled = true;
    });
  }
}

function updateHistoryList() {
  let html = '';
  filterHistory.forEach((filter, index) => {
    const presetLabel = getPresetLabel(filter.preset);
    html += `
      <li class="history-item">
        <span class="history-index">${index + 1}.</span>
        <span class="history-name">${presetLabel}</span>
        <button class="history-remove" onclick="removeFilter(${index})" title="Remove this filter">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </li>
    `;
  });
  ElementRefs.historyList.innerHTML = html;
}

function getPresetLabel(presetName) {
  const option = ElementRefs.preset.querySelector(`option[value="${presetName}"]`);
  return option ? option.textContent : presetName;
}

function removeFilter(index) {
  filterHistory.splice(index, 1);
  updateFilterChain();
  updateHistoryList();
  updateControlsState();
}

// Make removeFilter globally accessible for onclick
window.removeFilter = removeFilter;

// #endregion

// =============================================
// #region: File Actions
// =============================================

function initFilterActions() {
  ElementRefs.apply.addEventListener('click', applyCurrentFilter);
  ElementRefs.undo.addEventListener('click', undoLastFilter);
  ElementRefs.delete.addEventListener('click', clearImage);
  ElementRefs.reset.addEventListener('click', resetAllFilters);
}

function clearImage() {
  ElementRefs.inputImg.setAttribute('src', '');
  filterHistory.length = 0;
  applyPreset('identity');
  updateFilterChain();
  updateHistoryList();
  updateControlsState();
}

/**
 * Enable/disable controls based on whether an image is loaded
 */
function updateControlsState() {
  const hasImage = ElementRefs.inputImg.getAttribute('src') !== '';
  const limitReached = filterHistory.length >= MAX_FILTERS;

  // Disable/enable preset select (also disable when limit reached)
  ElementRefs.preset.disabled = !hasImage || limitReached;

  // Disable/enable matrix inputs (also disable when limit reached)
  ElementRefs.matrix.forEach((input) => {
    input.disabled = !hasImage || limitReached;
  });

  // Disable/enable action buttons
  ElementRefs.apply.disabled = !hasImage || limitReached;
  ElementRefs.delete.disabled = !hasImage;
  ElementRefs.reset.disabled = !hasImage;

  // Undo button depends on history
  if (!hasImage) {
    ElementRefs.undo.disabled = true;
  }
}

// #endregion
