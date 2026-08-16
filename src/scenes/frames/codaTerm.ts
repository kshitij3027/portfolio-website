import { CODA } from '../../orchestration/copy';
import { box, codeBlock, devChip, dragDots, greek, rule, text, windowChrome, type Ctx } from '../kit';

export type CodaStage = 'launch' | 'prompt' | 'react' | 'code' | 'done';

/** Chapter 2: the whole codagent ReAct session, drawn in particles. */
export function drawCoda(ctx: Ctx, stage: CodaStage): void {
  windowChrome(ctx, 320, 150, 2160, 1300, { kind: 'terminal', title: CODA.termTitle });
  devChip(ctx, 330, 126, 'coding-agent');
  dragDots(ctx, 2404, 106);

  // ---- launch block (all stages) ----
  text(ctx, 420, 330, '~ ❯', { px: 44, font: 'mono', ink: 170 });
  text(ctx, 520, 330, CODA.launchCmd, { px: 44, font: 'mono', weight: 700, ink: 253 });
  text(ctx, 420, 466, 'CODAGENT', { px: 96, font: 'mono', weight: 700, ink: 255, spacing: 10 });
  text(ctx, 420, 532, CODA.statusLine, { px: 38, font: 'mono', weight: 700, ink: 195 });
  rule(ctx, 420, 566, 1020, 110, 2);

  if (stage === 'launch') {
    text(ctx, 420, 664, 'you ❯', { px: 44, font: 'mono', ink: 242, weight: 700 });
    return;
  }

  // ---- typed request + plan (prompt, react, code, done) ----
  text(ctx, 420, 664, 'you ❯ write a python script that', { px: 44, font: 'mono', weight: 700, ink: 253 });
  text(ctx, 572, 726, 'dedupes customers.csv by email', { px: 44, font: 'mono', weight: 700, ink: 253 });
  text(ctx, 420, 798, 'plan: inspect csv → write dedupe.py', { px: 38, font: 'mono', weight: 700, ink: 190 });

  if (stage === 'prompt') return;

  // ---- tool call + approval gate (react, code, done) ----
  box(ctx, 420, 834, 1020, 190, { ink: 180, radius: 12 });
  text(ctx, 456, 902, CODA.toolLine, { px: 40, font: 'mono', weight: 700, ink: 232 });
  greek(ctx, 456, 938, 900, { lines: 2, lineH: 42, seed: 42, ink: 110, h: 10 });

  text(ctx, 420, 1098, CODA.gateLine, { px: 42, font: 'mono', weight: 700, ink: 253 });

  if (stage === 'react') return;

  // ---- code + resolution (code, done) ----
  codeBlock(ctx, 1500, 610, 940, { title: CODA.codeTitle, lines: [...CODA.codeLines], px: 40 });
  text(ctx, 420, 1192, CODA.wroteLine, { px: 40, font: 'mono', weight: 700, ink: 232 });
  text(ctx, 420, 1258, CODA.resultLine, { px: 40, font: 'mono', weight: 700, ink: 232 });

  if (stage === 'done') {
    text(ctx, 420, 1352, CODA.doneLine, { px: 42, font: 'mono', weight: 700, ink: 253 });
  }
}
