import { RAG } from '../../orchestration/copy';
import {
  box,
  chatBubble,
  chip,
  devChip,
  dragDots,
  routeDiagram,
  rule,
  text,
  windowChrome,
  type Ctx,
} from '../kit';

export type RagStage = 'boot' | 'boot-out' | 'empty' | 'query' | 'routing' | 'answer';

/**
 * Chapter 1. Two terminal stages (the boot, drawn entirely in particles),
 * then the browser chat app. Stages are strictly additive at fixed coordinates
 * so the differ only animates what changed.
 */
export function drawRag(ctx: Ctx, stage: RagStage): void {
  if (stage === 'boot' || stage === 'boot-out') {
    windowChrome(ctx, 620, 380, 1560, 840, { kind: 'terminal', title: 'agentic-rag — zsh' });
    devChip(ctx, 630, 356, 'compose');
    dragDots(ctx, 2124, 336);

    text(ctx, 720, 562, '$', { px: 44, font: 'mono', ink: 170 });
    text(ctx, 772, 562, RAG.bootCmd, { px: 44, font: 'mono', weight: 700, ink: 253 });

    if (stage === 'boot-out') {
      text(ctx, 720, 656, RAG.bootLines[0], { px: 42, font: 'mono', weight: 700, ink: 200 });
      text(ctx, 720, 730, RAG.bootLines[1], { px: 42, font: 'mono', weight: 700, ink: 200 });
      text(ctx, 720, 804, RAG.bootLines[2], { px: 42, font: 'mono', weight: 700, ink: 200 });
      text(ctx, 720, 878, RAG.bootLines[3], { px: 42, font: 'mono', weight: 700, ink: 200 });
      text(ctx, 720, 1000, RAG.readyLine, { px: 44, font: 'mono', weight: 700, ink: 252 });
    }
    return;
  }

  // ---------- browser chat app ----------
  windowChrome(ctx, 170, 120, 2460, 1360, { kind: 'browser', title: RAG.browserUrl });
  devChip(ctx, 180, 96, 'chat-thread-block');
  dragDots(ctx, 2564, 76);

  // sidebar (identical in all browser stages)
  text(ctx, 240, 296, 'agentic-rag', { px: 46, weight: 700, ink: 242 });
  rule(ctx, 240, 326, 460, 110, 2);
  text(ctx, 240, 410, 'threads', { px: 34, font: 'mono', weight: 700, ink: 180 });
  RAG.threads.forEach((t, i) => {
    text(ctx, 240, 486 + i * 92, t, { px: 33, weight: 600, ink: i === 0 ? 235 : 155 });
  });
  text(ctx, 240, 1078, 'documents', { px: 34, font: 'mono', weight: 700, ink: 180 });
  RAG.docs.forEach((d, i) => {
    text(ctx, 240, 1150 + i * 84, d, { px: 31, font: 'mono', weight: 700, ink: 175 });
  });
  rule(ctx, 780, 190, 2, 110, 1270);

  // input bar (identical in all browser stages)
  box(ctx, 820, 1290, 1600, 120, { ink: 190, radius: 16 });
  text(ctx, 860, 1368, 'Ask about your documents…', { px: 40, ink: 150 });
  box(ctx, 2332, 1312, 76, 76, { ink: 230, radius: 12, lineW: 3 });
  text(ctx, 2370, 1370, '↑', { px: 46, font: 'mono', ink: 248, align: 'center', weight: 700 });

  if (stage === 'empty') {
    text(ctx, 1620, 760, 'ready — 3 tools · vector / web / sql', {
      px: 42,
      font: 'mono',
      weight: 700,
      ink: 175,
      align: 'center',
    });
    return;
  }

  // user bubble (query, routing, answer)
  box(ctx, 1520, 284, 872, 182, { ink: 235, radius: 16, lineW: 3 });
  text(ctx, 1564, 360, 'What did our Q3 churn report say', { px: 44, weight: 600, ink: 253 });
  text(ctx, 1564, 422, 'about enterprise accounts?', { px: 44, weight: 600, ink: 253 });

  if (stage === 'routing') {
    routeDiagram(ctx, 980, 640, { branches: RAG.tools, active: 0, secondary: 2 });
    text(ctx, 980, 944, 'vector_search("q3 churn enterprise")', {
      px: 42,
      font: 'mono',
      weight: 700,
      ink: 222,
    });
    return;
  }

  if (stage === 'answer') {
    // collapsed tool chips
    let cx = 830;
    cx += chip(ctx, cx, 524, 'vector', { px: 32, bright: true }) + 20;
    cx += chip(ctx, cx, 524, 'sql', { px: 32, ink: 190 }) + 20;
    chip(ctx, cx, 524, 'web', { px: 32, ink: 130 });
    // assistant bubble
    chatBubble(ctx, 830, 660, 1220, {
      side: 'l',
      firstLine: RAG.answerFirstLine,
      greekLines: 3,
      seed: 11,
    });
    // citations
    let ax = 862;
    ax += chip(ctx, ax, 946, RAG.citations[0], { px: 30, bright: true }) + 22;
    chip(ctx, ax, 946, RAG.citations[1], { px: 30, ink: 195 });
  }
}
