import { CARDS } from './copy';
import type { DirectorCtx } from './director';

/**
 * One ~78s cycle. The particle canvas carries the whole demo; the chapter
 * card narrates it. Every scene state holds long enough to be read — dwells
 * assume the ~2s morph settle happens inside them.
 */
export async function runCycle(c: DirectorCtx): Promise<void> {
  const { card } = c;

  // ---- intro: the name blooms out of nothing ----
  c.setScene('intro-wordmark');
  await c.wait(4200);

  // ---- 01 · agentic RAG ----
  c.setScene('rag-boot');
  await card.begin(CARDS.rag.tab, CARDS.rag.desc, { x: 0.05, y: 0.66 });
  await c.wait(800);
  await card.caption(CARDS.rag.caps.boot);
  await c.wait(800);
  c.setScene('rag-boot-out');
  await c.wait(3200);

  c.setScene('rag-empty');
  await c.wait(2600);

  await card.caption(CARDS.rag.caps.question);
  await c.wait(400);
  c.setScene('rag-query');
  await c.wait(3000);

  await card.caption(CARDS.rag.caps.routing);
  await c.wait(500);
  c.setScene('rag-routing');
  await c.wait(3400);

  await card.caption(CARDS.rag.caps.answer);
  await c.wait(500);
  c.setScene('rag-answer');
  await c.wait(3400);

  c.setScene('rag-full');
  await c.wait(2400);
  await card.hide();
  await c.wait(800);

  // ---- 02 · codagent ----
  c.setScene('coda-launch');
  await card.begin(CARDS.coda.tab, CARDS.coda.desc, { x: 0.05, y: 0.68 });
  await c.wait(800);
  await card.caption(CARDS.coda.caps.launch);
  await c.wait(900);

  await card.caption(CARDS.coda.caps.prompt);
  await c.wait(400);
  c.setScene('coda-prompt');
  await c.wait(2800);

  await card.caption(CARDS.coda.caps.gate);
  await c.wait(500);
  c.setScene('coda-react');
  await c.wait(3200);

  await card.caption(CARDS.coda.caps.code);
  await c.wait(500);
  c.setScene('coda-code');
  await c.wait(3800);

  c.setScene('coda-done');
  await c.wait(2200);
  await card.hide();
  await c.wait(800);

  // ---- 03 · sentinellite ----
  c.setScene('sentinel-upload');
  await card.begin(CARDS.soc.tab, CARDS.soc.desc, { x: 0.05, y: 0.66 });
  await c.wait(800);
  await card.caption(CARDS.soc.caps.upload);
  await c.wait(1000);

  c.setScene('sentinel-ingest');
  await c.wait(800);
  await card.caption(CARDS.soc.caps.triage);
  await c.wait(2600);

  c.setScene('sentinel-dash');
  await c.wait(3200);

  await card.caption(CARDS.soc.caps.chain);
  await c.wait(500);
  c.setScene('sentinel-chain-z');
  await c.wait(3200);

  await card.caption(CARDS.soc.caps.approve);
  await c.wait(500);
  c.setScene('sentinel-incident-z');
  await c.wait(3000);

  c.cameraTo({ zoom: 1.1, cx: 0.5, cy: 0.5 });
  await c.wait(2600);
  await card.hide();
  await c.wait(700);

  // ---- outro: signature, then dissolve ----
  c.setScene('outro-wordmark');
  await c.wait(2800);
  c.setScene('empty');
  await c.wait(2800);
}
