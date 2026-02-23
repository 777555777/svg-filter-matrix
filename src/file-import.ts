import { dom } from './dom.ts';
import { resetAllFilters } from './filter.ts';
import { setOriginalImageUrl, MAX_IMAGE_DIM } from './state.ts';
import { trackObjectUrl, revokeTrackedObjectUrl } from './object-url.ts';

const MAX_FILE_SIZE_BYTES = 75 * 1024 * 1024;

function loadImageFile(file: File): void {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    alert('Please select an image up to 75 MB');
    return;
  }

  // Keep support broad (image/*), including GIF/WebP/etc.
  if (file.type && !file.type.startsWith('image/')) {
    alert('Please select a valid image file');
    return;
  }

  const objectUrl = trackObjectUrl(URL.createObjectURL(file));
  const img = new Image();
  img.onload = () => {
    const { naturalWidth: w, naturalHeight: h } = img;

    if (w <= MAX_IMAGE_DIM && h <= MAX_IMAGE_DIM) {
      setOriginalImageUrl(objectUrl);
      resetAllFilters();
      return;
    }

    // Down-scale to fit within 4K
    revokeTrackedObjectUrl(objectUrl);
    const scale = MAX_IMAGE_DIM / Math.max(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setOriginalImageUrl(trackObjectUrl(URL.createObjectURL(blob)));
        resetAllFilters();
      },
      'image/jpeg',
      0.95
    );
  };
  img.onerror = () => {
    revokeTrackedObjectUrl(objectUrl);
    alert('Could not load this image file');
  };
  img.src = objectUrl;
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
  setOriginalImageUrl('');
  dom.inputImg.src = '';
  resetAllFilters();
}
