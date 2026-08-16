import { SOC } from '../../orchestration/copy';
import {
  box,
  button,
  chip,
  devChip,
  dragDots,
  dropzone,
  greek,
  killChain,
  progress,
  rule,
  statCard,
  text,
  windowChrome,
  type Ctx,
} from '../kit';

export type SentinelStage = 'upload' | 'ingest' | 'dashboard';

/** Chapter 3: SentinelLite SOC — dropzone → ingest → triage dashboard. */
export function drawSentinel(ctx: Ctx, stage: SentinelStage): void {
  windowChrome(ctx, 170, 120, 2460, 1360, { kind: 'browser', title: SOC.browserUrl });
  devChip(ctx, 180, 96, 'ingest-block');
  dragDots(ctx, 2564, 76);

  // ---- header (identical in all stages) ----
  text(ctx, 240, 302, SOC.header, { px: 46, font: 'mono', ink: 240, spacing: 8, weight: 700 });
  chip(ctx, 2320, 250, 'live', { px: 30, ink: 180 });
  rule(ctx, 240, 338, 2320, 110, 2);

  if (stage === 'upload') {
    dropzone(ctx, 770, 470, 1260, 640, { label: SOC.dropLabel, hints: SOC.sourceChips });
    return;
  }

  if (stage === 'ingest') {
    box(ctx, 850, 480, 1100, 214, { ink: 220, radius: 14, lineW: 3 });
    text(ctx, 900, 558, SOC.fileCard, { px: 42, font: 'mono', ink: 252, weight: 700 });
    progress(ctx, 900, 604, 1000, 0.62);
    text(ctx, 900, 672, 'parsing native schemas…', { px: 36, font: 'mono', weight: 700, ink: 185 });

    let cx = 600;
    for (const a of SOC.agents) {
      cx += chip(ctx, cx, 812, a, { px: 36, bright: true }) + 24;
    }
    chip(ctx, cx, 812, SOC.correlator, { px: 36, ink: 130 });
    text(ctx, 1400, 972, 'asyncio.gather · 4 domain agents in parallel', {
      px: 38,
      font: 'mono',
      weight: 700,
      ink: 185,
      align: 'center',
    });
    return;
  }

  // ---- dashboard ----
  const stats = SOC.stats;
  const cardW = 540;
  const gap = 30;
  const x0 = 170 + (2460 - (cardW * 4 + gap * 3)) / 2;
  stats.forEach((s, i) => {
    statCard(ctx, x0 + i * (cardW + gap), 400, cardW, 250, {
      value: s.value,
      label: s.label,
      bright: i === 3,
    });
  });

  killChain(ctx, 400, 800, 2000, SOC.killChain);

  // triage stream panel
  box(ctx, x0, 960, 1180, 400, { ink: 170, radius: 14 });
  text(ctx, x0 + 40, 1032, 'triage stream', { px: 36, font: 'mono', weight: 700, ink: 185 });
  greek(ctx, x0 + 40, 1070, 1090, { lines: 4, lineH: 48, seed: 21, ink: 105, h: 10 });
  chip(ctx, x0 + 40, 1280, 'CVE-2021-23337 · lodash', { px: 34, bright: true });

  // incident panel
  const ix = x0 + 1220;
  box(ctx, ix, 960, 1030, 400, { ink: 235, radius: 14, lineW: 3.5 });
  text(ctx, ix + 40, 1032, 'incident #1', { px: 36, font: 'mono', weight: 700, ink: 185 });
  text(ctx, ix + 40, 1096, SOC.incidentTitle, { px: 42, weight: 600, ink: 253 });
  rule(ctx, ix + 40, 1126, 950, 110, 2);
  text(ctx, ix + 40, 1188, SOC.incidentSub, { px: 38, font: 'mono', weight: 700, ink: 228 });
  greek(ctx, ix + 40, 1218, 950, { lines: 1, lineH: 42, seed: 33, ink: 105, h: 10 });
  button(ctx, ix + 40, 1276, 'approve', { px: 32, filled: true, mono: true });
  button(ctx, ix + 310, 1276, 'dismiss', { px: 32, mono: true, ink: 195 });
}
