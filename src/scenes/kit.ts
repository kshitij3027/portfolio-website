import { FRAME_H, FRAME_W } from '../config';
import { mulberry32 } from '../engine/rng';

/**
 * Wireframe UI kit — every scene frame draws through these primitives onto a
 * 2800x1600 grayscale canvas. Determinism contract: a chapter's stage frames
 * call the same primitives with the same coordinates and seeds for unchanged
 * regions, so the sampler emits identical particles there.
 *
 * Ink levels: 255 primary text · 200 chrome/lines · 130 secondary · 60-90 fills.
 * Legibility rule: real glyphs at >=34 frame px; smaller info is greeked.
 */

export type Ctx = CanvasRenderingContext2D;

export function makeFrameCanvas(): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  return { canvas, ctx };
}

function gray(ink: number): string {
  const v = Math.max(0, Math.min(255, Math.round(ink)));
  return `rgb(${v},${v},${v})`;
}

type FontKind = 'sans' | 'mono' | 'serif';

const FAMILY: Record<FontKind, string> = {
  sans: 'Inter, sans-serif',
  mono: '"JetBrains Mono", monospace',
  serif: '"Instrument Serif", serif',
};

export interface TextOpts {
  px?: number;
  font?: FontKind;
  weight?: number;
  ink?: number;
  italic?: boolean;
  align?: CanvasTextAlign;
  spacing?: number;
}

export function text(ctx: Ctx, x: number, y: number, s: string, o: TextOpts = {}): void {
  const { px = 36, font = 'sans', weight = 400, ink = 255, italic = false, align = 'left', spacing = 0 } = o;
  ctx.save();
  ctx.fillStyle = gray(ink);
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${px}px ${FAMILY[font]}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  if (spacing) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function measure(ctx: Ctx, s: string, o: TextOpts = {}): number {
  const { px = 36, font = 'sans', weight = 400, italic = false } = o;
  ctx.save();
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${px}px ${FAMILY[font]}`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

export function rule(ctx: Ctx, x: number, y: number, w: number, ink = 130, h = 2): void {
  ctx.fillStyle = gray(ink);
  ctx.fillRect(x, y, w, h);
}

export interface BoxOpts {
  ink?: number;
  lineW?: number;
  radius?: number;
  dashed?: boolean;
  fill?: number | null;
}

export function box(ctx: Ctx, x: number, y: number, w: number, h: number, o: BoxOpts = {}): void {
  const { ink = 200, lineW = 2.5, radius = 10, dashed = false, fill = null } = o;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill !== null) {
    ctx.fillStyle = gray(fill);
    ctx.fill();
  }
  ctx.strokeStyle = gray(ink);
  ctx.lineWidth = lineW;
  if (dashed) ctx.setLineDash([14, 12]);
  ctx.stroke();
  ctx.restore();
}

/** Seeded dashed placeholder lines standing in for unreadable body text. */
export interface GreekOpts {
  lines?: number;
  lineH?: number;
  seed?: number;
  ink?: number;
  h?: number;
  lastFrac?: number;
}

export function greek(ctx: Ctx, x: number, y: number, w: number, o: GreekOpts = {}): void {
  const { lines = 3, lineH = 34, seed = 1, ink = 110, h = 10, lastFrac = 0.55 } = o;
  const rng = mulberry32(seed);
  ctx.fillStyle = gray(ink);
  for (let l = 0; l < lines; l++) {
    const lineW = l === lines - 1 ? w * lastFrac : w * (0.86 + rng() * 0.14);
    let cx = x;
    while (cx < x + lineW) {
      const seg = 26 + rng() * 90;
      const width = Math.min(seg, x + lineW - cx);
      if (width > 12) ctx.fillRect(cx, y + l * lineH, width, h);
      cx += seg + 14 + rng() * 18;
    }
  }
}

export interface WindowOpts {
  kind?: 'browser' | 'terminal';
  title?: string;
  ink?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** OS window chrome: traffic dots + centered mono title (browser gets a url pill). */
export function windowChrome(ctx: Ctx, x: number, y: number, w: number, h: number, o: WindowOpts = {}): Rect {
  const { kind = 'browser', title = '', ink = 200 } = o;
  const bar = 66;
  box(ctx, x, y, w, h, { ink, radius: 14 });
  rule(ctx, x, y + bar, w, Math.min(ink, 140), 2);
  // traffic dots
  ctx.fillStyle = gray(150);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + 38 + i * 34, y + bar / 2, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  if (title) {
    if (kind === 'browser') {
      const tw = measure(ctx, title, { px: 26, font: 'mono' }) + 56;
      box(ctx, x + w / 2 - tw / 2, y + 12, tw, bar - 24, { ink: 120, radius: 8 });
      text(ctx, x + w / 2, y + bar / 2 + 9, title, { px: 26, font: 'mono', ink: 170, align: 'center' });
    } else {
      text(ctx, x + w / 2, y + bar / 2 + 9, title, { px: 26, font: 'mono', ink: 170, align: 'center' });
    }
  }
  return { x: x + 2, y: y + bar + 2, w: w - 4, h: h - bar - 4 };
}

/** juo-style block adornment: `< >` chip + block name at a window's top-left. */
export function devChip(ctx: Ctx, x: number, y: number, name: string): void {
  text(ctx, x, y, '<', { px: 30, font: 'mono', ink: 200, weight: 700 });
  text(ctx, x + 22, y, '>', { px: 30, font: 'mono', ink: 200, weight: 700 });
  text(ctx, x + 58, y, name, { px: 28, font: 'mono', ink: 180 });
}

/** 2x3 drag-handle dot grid (window top-right adornment). */
export function dragDots(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = gray(170);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.beginPath();
      ctx.arc(x + c * 16, y + r * 16, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export interface ButtonOpts {
  px?: number;
  filled?: boolean;
  ink?: number;
  padX?: number;
  padY?: number;
  mono?: boolean;
}

/** Returns button width. Filled buttons carve dark text out of a bright slab. */
export function button(ctx: Ctx, x: number, y: number, label: string, o: ButtonOpts = {}): number {
  const { px = 30, filled = false, ink = 210, padX = 30, padY = 20, mono = false } = o;
  const font: FontKind = mono ? 'mono' : 'sans';
  const tw = measure(ctx, label, { px, font, weight: 600 });
  const w = tw + padX * 2;
  const h = px + padY * 2;
  if (filled) {
    ctx.fillStyle = gray(235);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    text(ctx, x + padX, y + padY + px * 0.82, label, { px, font, weight: 700, ink: 15 });
  } else {
    box(ctx, x, y, w, h, { ink, radius: 10 });
    text(ctx, x + padX, y + padY + px * 0.82, label, { px, font, weight: 600, ink });
  }
  return w;
}

export interface ChipOpts {
  px?: number;
  ink?: number;
  bright?: boolean;
}

/** Small bordered label; returns its width. */
export function chip(ctx: Ctx, x: number, y: number, label: string, o: ChipOpts = {}): number {
  const { px = 34, ink = 170, bright = false } = o;
  const tw = measure(ctx, label, { px, font: 'mono' });
  const w = tw + 36;
  const h = px + 26;
  box(ctx, x, y, w, h, { ink: bright ? 240 : ink, radius: 8, lineW: bright ? 3 : 2 });
  text(ctx, x + 18, y + 13 + px * 0.82, label, { px, font: 'mono', ink: bright ? 250 : ink });
  return w;
}

export function progress(ctx: Ctx, x: number, y: number, w: number, frac: number): void {
  box(ctx, x, y, w, 18, { ink: 110, radius: 9 });
  ctx.fillStyle = gray(235);
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, Math.max((w - 6) * frac, 12), 12, 6);
  ctx.fill();
}

export interface StatCardOpts {
  value: string;
  label: string;
  bright?: boolean;
}

export function statCard(ctx: Ctx, x: number, y: number, w: number, h: number, o: StatCardOpts): void {
  box(ctx, x, y, w, h, { ink: o.bright ? 230 : 170, radius: 12, lineW: o.bright ? 3 : 2.5 });
  text(ctx, x + w / 2, y + h * 0.56, o.value, {
    px: 120,
    font: 'mono',
    weight: 700,
    ink: 255,
    align: 'center',
  });
  text(ctx, x + w / 2, y + h - 32, o.label, { px: 32, font: 'mono', weight: 700, ink: 180, align: 'center' });
}

export interface BubbleOpts {
  side: 'l' | 'r';
  firstLine?: string;
  greekLines?: number;
  seed?: number;
  h?: number;
}

/** Chat bubble; returns its rect. Right side = user (brighter). */
export function chatBubble(ctx: Ctx, x: number, y: number, w: number, o: BubbleOpts): Rect {
  const { side, firstLine, greekLines = 0, seed = 7, h } = o;
  const pad = 32;
  const lineH = 54;
  const contentLines = (firstLine ? 1 : 0) + greekLines;
  const bh = h ?? pad * 2 + Math.max(contentLines, 1) * lineH - 8;
  const ink = side === 'r' ? 235 : 185;
  box(ctx, x, y, w, bh, { ink, radius: 16, lineW: side === 'r' ? 3 : 2.5 });
  let cy = y + pad + 36;
  if (firstLine) {
    text(ctx, x + pad, cy, firstLine, { px: 44, font: 'sans', weight: 600, ink: side === 'r' ? 253 : 235 });
    cy += lineH;
  }
  if (greekLines > 0) {
    greek(ctx, x + pad, cy - 18, w - pad * 2, { lines: greekLines, lineH: 40, seed, ink: 120 });
  }
  return { x, y, w, h: bh };
}

export interface CodeBlockOpts {
  title: string;
  lines: string[];
  px?: number;
}

/** Terminal-style code block with a title bar; returns its rect. */
export function codeBlock(ctx: Ctx, x: number, y: number, w: number, o: CodeBlockOpts): Rect {
  const { title, lines, px = 38 } = o;
  const lineH = px * 1.5;
  const pad = 34;
  const barH = 58;
  const h = barH + pad * 2 + lines.length * lineH - px * 0.4;
  box(ctx, x, y, w, h, { ink: 210, radius: 12 });
  rule(ctx, x, y + barH, w, 140, 2);
  text(ctx, x + pad, y + barH - 19, title, { px: 26, font: 'mono', ink: 160 });
  lines.forEach((ln, i) => {
    const indent = ln.length - ln.trimStart().length;
    const keyword = /^(import|def|for|if|return|from|class|while)\b/.test(ln.trim());
    text(ctx, x + pad + indent * px * 0.28, y + barH + pad + i * lineH + px * 0.6, ln.trim(), {
      px,
      font: 'mono',
      weight: keyword ? 700 : 500,
      ink: keyword ? 255 : 205,
    });
  });
  return { x, y, w, h };
}

export interface RouteOpts {
  branches: readonly string[];
  active: number; // -1 none
  secondary?: number;
}

/** Agent node fanning out to tool nodes; the active edge+node glow. */
export function routeDiagram(ctx: Ctx, x: number, y: number, o: RouteOpts): void {
  const agentW = 210;
  const agentH = 84;
  box(ctx, x, y, agentW, agentH, { ink: 230, radius: 12, lineW: 3 });
  text(ctx, x + agentW / 2, y + agentH / 2 + 12, 'agent', { px: 36, font: 'mono', weight: 700, ink: 250, align: 'center' });

  const bx = x + agentW + 210;
  const spacing = 128;
  o.branches.forEach((b, i) => {
    const by = y + agentH / 2 - spacing + i * spacing - 38;
    const isActive = i === o.active;
    const isSecondary = i === o.secondary;
    const ink = isActive ? 252 : isSecondary ? 190 : 130;
    // edge
    ctx.save();
    ctx.strokeStyle = gray(ink);
    ctx.lineWidth = isActive ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x + agentW, y + agentH / 2);
    ctx.bezierCurveTo(x + agentW + 110, y + agentH / 2, bx - 110, by + 38, bx, by + 38);
    ctx.stroke();
    ctx.restore();
    // node
    const w = measure(ctx, b, { px: 34, font: 'mono', weight: 700 }) + 56;
    box(ctx, bx, by, w, 80, { ink, radius: 12, lineW: isActive ? 3.5 : 2 });
    text(ctx, bx + 28, by + 52, b, { px: 34, font: 'mono', weight: 700, ink: isActive ? 255 : ink });
  });
}

export interface KillChainStage {
  id: string;
  label: string;
}

/** Horizontal kill-chain rail with technique-ID nodes. */
export function killChain(ctx: Ctx, x: number, y: number, w: number, stages: readonly KillChainStage[]): void {
  const n = stages.length;
  const step = w / (n - 1);
  rule(ctx, x, y - 2, w, 120, 3);
  stages.forEach((s, i) => {
    const sx = x + i * step;
    ctx.fillStyle = gray(240);
    ctx.beginPath();
    ctx.arc(sx, y, 11, 0, Math.PI * 2);
    ctx.fill();
    const above = i % 2 === 0;
    text(ctx, sx, above ? y - 66 : y + 70, s.id, { px: 34, font: 'mono', ink: 250, align: 'center', weight: 700 });
    text(ctx, sx, above ? y - 28 : y + 108, s.label, { px: 32, font: 'sans', weight: 700, ink: 185, align: 'center' });
  });
}

export interface DropzoneOpts {
  label: string;
  hints: readonly string[];
}

export function dropzone(ctx: Ctx, x: number, y: number, w: number, h: number, o: DropzoneOpts): void {
  box(ctx, x, y, w, h, { ink: 190, radius: 18, dashed: true, lineW: 3.5 });
  // down-arrow glyph
  const cx = x + w / 2;
  const ay = y + h * 0.34;
  ctx.save();
  ctx.strokeStyle = gray(230);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, ay - 40);
  ctx.lineTo(cx, ay + 30);
  ctx.moveTo(cx - 26, ay + 2);
  ctx.lineTo(cx, ay + 30);
  ctx.lineTo(cx + 26, ay + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 44, ay + 62);
  ctx.lineTo(cx + 44, ay + 62);
  ctx.stroke();
  ctx.restore();
  text(ctx, cx, y + h * 0.62, o.label, { px: 44, font: 'mono', weight: 700, ink: 225, align: 'center' });
  // hint chips centered
  const px = 30;
  const widths = o.hints.map((hint) => measure(ctx, hint, { px, font: 'mono' }) + 36);
  const total = widths.reduce((a, b) => a + b, 0) + (o.hints.length - 1) * 20;
  let hx = cx - total / 2;
  for (let i = 0; i < o.hints.length; i++) {
    chip(ctx, hx, y + h * 0.72, o.hints[i], { px, ink: 160 });
    hx += widths[i] + 20;
  }
}
