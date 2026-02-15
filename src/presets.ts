import type { Matrix } from './types.ts';

export const PRESETS: Record<string, Matrix> = {
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
