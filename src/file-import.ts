import { dom } from './dom.ts';
import { resetAllFilters } from './filter.ts';
import { updateControlsState } from './ui.ts';

function loadImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result;
    if (typeof result === 'string') {
      dom.inputImg.setAttribute('src', result);
      updateControlsState();
    }
  };
  reader.readAsDataURL(file);
}

export function handleFileChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) loadImageFile(file);
}

export function handleDropzoneClick(e: Event): void {
  if (e.target !== dom.fileInput) {
    dom.fileInput.click();
  }
}

export function handleFileDrop(e: DragEvent): void {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (file) loadImageFile(file);
}

export function handleDragOver(e: DragEvent): void {
  e.preventDefault();
}

export function clearImage(): void {
  dom.inputImg.setAttribute('src', '');
  resetAllFilters();
}
