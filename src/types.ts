export type Matrix = number[][];

export interface FilterHistoryEntry {
  matrix: Matrix;
  preset: string;
  timestamp: number;
}
