import { SAMPLE } from '../config';
import { mulberry32 } from './rng';
import type { TargetList } from './particles';

/** 4x4 Bayer matrix, normalized thresholds in (0,1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/**
 * Grid-samples a grayscale frame into particle targets. Deterministic for a
 * given image, so unchanged regions of successive stage frames emit identical
 * targets (the differ then leaves them alone).
 *
 * Legibility contract: pixels at/above `solidLum` are TEXT — they sample at
 * flat full brightness with zero positional jitter, so the dense overlapping
 * dots fuse into solid strokes. Dimmer content keeps per-dot variation and
 * jitter for the organic stipple feel.
 */
export function sampleFrame(img: ImageData, gap: number = SAMPLE.gap): TargetList {
  const { width, height, data } = img;
  const est = Math.ceil((width / gap + 1) * (height / gap + 1));
  const xs = new Float32Array(est);
  const ys = new Float32Array(est);
  const bs = new Float32Array(est);
  let n = 0;
  const rng = mulberry32(0x5eed + gap);

  for (let y = 0; y < height; y += gap) {
    const gy = (y / gap) & 3;
    for (let x = 0; x < width; x += gap) {
      const lum = data[(y * width + x) * 4]; // grayscale: R channel
      if (lum < SAMPLE.lumThreshold) {
        rng(); // keep RNG stream aligned regardless of content
        rng();
        continue;
      }
      const jr1 = rng();
      const jr2 = rng();

      if (lum >= SAMPLE.solidLum) {
        // text/chrome: solid, grid-true, full brightness
        xs[n] = x;
        ys[n] = y;
        bs[n] = 1;
        n++;
        continue;
      }

      if (lum < SAMPLE.bayerHigh) {
        // mid-tones: ordered dithering decides survival
        const gx = (x / gap) & 3;
        if (lum / 255 <= BAYER[gy * 4 + gx] * (SAMPLE.bayerHigh / 255)) continue;
      }
      xs[n] = x + (jr1 - 0.5) * gap * 0.35;
      ys[n] = y + (jr2 - 0.5) * gap * 0.35;
      bs[n] = 0.5 + 0.5 * (lum / 255);
      n++;
    }
  }

  if (n > SAMPLE.maxTargets && gap < 6) {
    return sampleFrame(img, gap + 1);
  }

  return { x: xs.subarray(0, n), y: ys.subarray(0, n), b: bs.subarray(0, n), count: n };
}
