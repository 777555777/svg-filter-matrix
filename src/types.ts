export type Matrix = number[][];

export interface AdjustmentState {
  grayscale: number; // 0–100
  r: number; // 0–200, default 100
  g: number; // 0–200, default 100
  b: number; // 0–200, default 100
  contrast: number; // 0–200, default 100
}

export interface FilterHistoryEntry {
  label: string;
  snapshotUrl: string;
}
