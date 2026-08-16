/** Every tunable of the animation system, mirrored from docs/animation-spec.md. */

export const FRAME_W = 2800;
export const FRAME_H = 1600;

export const SAMPLE = {
  /** grid gap in frame px between candidate particles */
  gap: 2,
  /** luminance (0-255) below which a pixel emits no particle */
  lumThreshold: 24,
  /** mid-tone band passed through a Bayer matrix for stipple fills */
  bayerLow: 24,
  bayerHigh: 110,
  /** luminance at/above which a pixel is "text": flat full brightness, no jitter */
  solidLum: 180,
  /** resample at gap+1 if a frame exceeds this */
  maxTargets: 240_000,
};

export const POOL_CAP = 260_000;
export const DPR_MAX = 2;

export const DOT = {
  /** base point size in screen px at zoom 1 */
  base: 2.7,
  /** random per-particle size variation factor */
  scale: 0.4,
};

/** Frame-px units. Kept small — larger values smear glyphs into mush. */
export const WOBBLE = {
  radial: 0.18,
  lateral: 0.24,
  jitter: 0.07,
};

export const SHIMMER = {
  xyPx: 3, // screen px drift amplitude
  rot: 0.005, // radians
  zoom: 0.012,
  speed: 0.1, // Hz-ish
};

export const HEARTBEAT = {
  bpm: 44,
  waveSpeed: 900, // frame px / s
  ringThickness: 400, // frame px
  maxDisp: 1.6, // frame px
};

export const MORPH = {
  /** screen-px proximity within which an old particle slides to a new target */
  proximityPx: 20,
  slideMs: 600,
  slideDelayMaxMs: 150,
  fadeOutMs: 600,
  explodeMs: 2000,
  explodeDelayMaxMs: 400,
  explodeIntensity: 1.2,
  /** brightness boost multiplier for newly exploded-in particles */
  boost: 1.6,
  boostDecayMs: 1200,
};

export const CAMERA = {
  tweenMs: 1000,
  parallaxPx: 6,
  parallaxLerp: 0.06,
};

export const TYPING_MS_PER_CHAR = 30;

export const TERM = {
  showHideMs: 300,
  defaultScale: 1.2,
  zoomScale: 1.34,
};
