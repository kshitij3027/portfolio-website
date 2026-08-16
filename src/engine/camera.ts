import { CAMERA, FRAME_H, FRAME_W, SHIMMER } from '../config';
import { clock } from './clock';

export interface CameraPreset {
  zoom: number;
  cx: number; // fraction of frame width
  cy: number; // fraction of frame height
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Maps frame space (2800x1600 px) to the viewport with cover-fit, a zoomable
 * preset center, slow sinusoidal shimmer, and mouse parallax.
 */
export class Camera {
  private from: CameraPreset = { zoom: 1, cx: 0.5, cy: 0.5 };
  private to: CameraPreset = { zoom: 1, cx: 0.5, cy: 0.5 };
  private tweenStart = 0;
  private tweenDur = 0;

  private parallaxX = 0;
  private parallaxY = 0;
  private targetParallaxX = 0;
  private targetParallaxY = 0;

  private viewW = 1;
  private viewH = 1;

  /** max zoom clamp (mobile-lite sets this to 1.6) */
  maxZoom = Infinity;

  /** Optional preset remap (portrait phones rescale zoom for tall screens). */
  private adapter: ((p: CameraPreset) => CameraPreset) | null = null;

  setAdapter(fn: ((p: CameraPreset) => CameraPreset) | null): void {
    this.adapter = fn;
  }

  private adapt(p: CameraPreset): CameraPreset {
    return this.adapter ? this.adapter(p) : { ...p };
  }

  setViewport(w: number, h: number): void {
    this.viewW = w;
    this.viewH = h;
  }

  jumpTo(preset: CameraPreset): void {
    const p = this.adapt(preset);
    this.from = { ...p };
    this.to = { ...p };
    this.tweenDur = 0;
  }

  tweenTo(preset: CameraPreset, ms: number = CAMERA.tweenMs): void {
    this.from = this.current();
    this.to = this.adapt(preset);
    this.tweenStart = clock.now();
    this.tweenDur = ms;
  }

  setPointer(nx: number, ny: number): void {
    // nx/ny in [-1, 1] from viewport center
    this.targetParallaxX = nx * CAMERA.parallaxPx;
    this.targetParallaxY = ny * CAMERA.parallaxPx;
  }

  /** Smoothed parallax step — call once per frame. */
  update(): void {
    this.parallaxX += (this.targetParallaxX - this.parallaxX) * CAMERA.parallaxLerp;
    this.parallaxY += (this.targetParallaxY - this.parallaxY) * CAMERA.parallaxLerp;
  }

  current(): CameraPreset {
    if (this.tweenDur <= 0) return { ...this.to };
    const t = Math.min((clock.now() - this.tweenStart) / this.tweenDur, 1);
    const e = easeInOutCubic(t);
    return {
      zoom: this.from.zoom + (this.to.zoom - this.from.zoom) * e,
      cx: this.from.cx + (this.to.cx - this.from.cx) * e,
      cy: this.from.cy + (this.to.cy - this.from.cy) * e,
    };
  }

  /** screen px per frame px, including zoom + shimmer-zoom. */
  private scale(p: CameraPreset, shimmerZoom: number): number {
    const cover = Math.max(this.viewW / FRAME_W, this.viewH / FRAME_H);
    return cover * Math.min(p.zoom, this.maxZoom) * (1 + shimmerZoom);
  }

  /** Effective frame center, clamped so the view never over-scans the frame edges. */
  private frameCenter(p: CameraPreset, s: number): { x: number; y: number } {
    const visW = this.viewW / s;
    const visH = this.viewH / s;
    const x = visW >= FRAME_W ? FRAME_W / 2 : Math.min(Math.max(p.cx * FRAME_W, visW / 2), FRAME_W - visW / 2);
    const y = visH >= FRAME_H ? FRAME_H / 2 : Math.min(Math.max(p.cy * FRAME_H, visH / 2), FRAME_H - visH / 2);
    return { x, y };
  }

  private shimmer(): { x: number; y: number; rot: number; zoom: number } {
    const t = (clock.now() / 1000) * SHIMMER.speed * Math.PI * 2;
    return {
      x: Math.sin(t * 1.0) * SHIMMER.xyPx,
      y: Math.cos(t * 0.83 + 1.7) * SHIMMER.xyPx,
      rot: Math.sin(t * 0.61 + 0.9) * SHIMMER.rot,
      zoom: Math.sin(t * 0.47 + 2.3) * SHIMMER.zoom,
    };
  }

  /**
   * 3x3 matrix (column-major, for GL) taking frame coords to clip space.
   * screen = R(rot) * (frame - center) * s + viewCenter + shimmerXY + parallax
   */
  matrix(): Float32Array {
    const p = this.current();
    const sh = this.shimmer();
    const s = this.scale(p, sh.zoom);
    const c = this.frameCenter(p, s);
    const cxF = c.x;
    const cyF = c.y;
    const cos = Math.cos(sh.rot) * s;
    const sin = Math.sin(sh.rot) * s;
    const tx = this.viewW / 2 + sh.x + this.parallaxX - (cxF * cos - cyF * sin);
    const ty = this.viewH / 2 + sh.y + this.parallaxY - (cxF * sin + cyF * cos);
    // screen -> clip
    const ax = 2 / this.viewW;
    const ay = -2 / this.viewH;
    // clip = (screen * a) + b, compose into one mat3
    return new Float32Array([
      cos * ax,
      sin * ay,
      0,
      -sin * ax,
      cos * ay,
      0,
      tx * ax - 1,
      ty * ay + 1,
      1,
    ]);
  }

  /** Effective zoom (for dot sizing). */
  zoomNow(): number {
    return Math.min(this.current().zoom, this.maxZoom);
  }

  /** Absolute screen px per frame px at the current zoom (no shimmer). */
  screenPerFrame(): number {
    const cover = Math.max(this.viewW / FRAME_W, this.viewH / FRAME_H);
    return cover * Math.min(this.current().zoom, this.maxZoom);
  }

  /** Frame coords -> CSS screen px (for anchoring DOM terminals to scene features). */
  frameToScreen(fx: number, fy: number): { x: number; y: number } {
    const p = this.current();
    const sh = this.shimmer();
    const s = this.scale(p, sh.zoom);
    const c = this.frameCenter(p, s);
    const cxF = c.x;
    const cyF = c.y;
    const cos = Math.cos(sh.rot);
    const sin = Math.sin(sh.rot);
    const dx = fx - cxF;
    const dy = fy - cyF;
    return {
      x: (dx * cos - dy * sin) * s + this.viewW / 2 + sh.x + this.parallaxX,
      y: (dx * sin + dy * cos) * s + this.viewH / 2 + sh.y + this.parallaxY,
    };
  }

  /** Screen center expressed in frame coords (explosion origin). */
  screenCenterInFrame(): { x: number; y: number } {
    const p = this.current();
    return { x: p.cx * FRAME_W, y: p.cy * FRAME_H };
  }
}

export const camera = new Camera();
