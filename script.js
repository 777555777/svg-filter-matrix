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
  greyscale: document.querySelector('[d-ref="greyscale"]'),
  invert: document.querySelector('[d-ref="invert"]'),
  preset: document.querySelector('[d-ref="preset"]'),
  matrix: document.querySelectorAll('[d-ref="matrix"] input[type="number"]'),
  download: document.querySelector('[d-ref="download"]'),
  filename: document.querySelector('[d-ref="filename"]'),
  outputImg: document.querySelector('[d-ref="output-img"]'),
  filterMatrix: document.querySelector('feConvolveMatrix'),
  filterConvolve: document.querySelector('#convolve'),
};

// Create a deep copy to avoid mutating the original preset
const filterMatrixState = presets.identity.map((row) => [...row]);

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
}

function appStartup() {
  initMatrixInputs();
  setMatrix(filterMatrixState);
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
 * Set the kernelMatrix attribute of the feConvolveMatrix filter
 * @param {number[][]} matrix
 */
function setMatrixSVG(matrix) {
  const matrixString = matrix.flat().join(' ');
  const divisor = matrix.flat().reduce((sum, val) => sum + val, 0);
  // edge detection can have a divisor of 0, but feConvolveMatrix
  // doesn't allow that, so we set it to 1 in that case
  const safeDivisor = divisor === 0 ? 1 : divisor;
  ElementRefs.filterMatrix.setAttribute('kernelMatrix', matrixString);
  ElementRefs.filterMatrix.setAttribute('divisor', safeDivisor);
  if (divisor === 0) {
    ElementRefs.filterMatrix.setAttribute('preserveAlpha', 'true');
  } else {
    ElementRefs.filterMatrix.removeAttribute('preserveAlpha');
  }
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
      ElementRefs.outputImg.setAttribute('src', e.target.result);
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
  }
}

ElementRefs.preset.addEventListener('change', handlePresetChange);

function handlePresetChange(e) {
  const presetName = e.target.value;
  applyPreset(presetName);
}
// #endregion
