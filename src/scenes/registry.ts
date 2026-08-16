import type { CameraPreset } from '../engine/camera';
import { sampleFrame } from '../engine/sampler';
import type { TargetList } from '../engine/particles';
import { FRAME_H, FRAME_W } from '../config';
import { makeFrameCanvas, type Ctx } from './kit';
import { drawCoda } from './frames/codaTerm';
import { drawEmpty } from './frames/emptyFrame';
import { drawIntro, drawOutro } from './frames/introWordmark';
import { drawRag } from './frames/ragApp';
import { drawSentinel } from './frames/sentinel';

export type SceneName =
  | 'intro-wordmark'
  | 'rag-boot'
  | 'rag-boot-out'
  | 'rag-empty'
  | 'rag-query'
  | 'rag-routing'
  | 'rag-answer'
  | 'rag-full'
  | 'coda-launch'
  | 'coda-prompt'
  | 'coda-react'
  | 'coda-code'
  | 'coda-done'
  | 'sentinel-upload'
  | 'sentinel-ingest'
  | 'sentinel-dash'
  | 'sentinel-chain-z'
  | 'sentinel-incident-z'
  | 'outro-wordmark'
  | 'empty';

interface SceneDef {
  /** Own draw, or reuse another scene's image (camera-only variant). */
  draw?: (ctx: Ctx) => void;
  sameAs?: SceneName;
  camera: CameraPreset;
}

export const SCENES: Record<SceneName, SceneDef> = {
  'intro-wordmark': { draw: drawIntro, camera: { zoom: 1.15, cx: 0.5, cy: 0.52 } },
  'rag-boot': { draw: (c) => drawRag(c, 'boot'), camera: { zoom: 1.35, cx: 0.5, cy: 0.42 } },
  'rag-boot-out': { draw: (c) => drawRag(c, 'boot-out'), camera: { zoom: 1.35, cx: 0.5, cy: 0.46 } },
  'rag-empty': { draw: (c) => drawRag(c, 'empty'), camera: { zoom: 1.08, cx: 0.5, cy: 0.5 } },
  'rag-query': { draw: (c) => drawRag(c, 'query'), camera: { zoom: 1.3, cx: 0.6, cy: 0.34 } },
  'rag-routing': { draw: (c) => drawRag(c, 'routing'), camera: { zoom: 1.5, cx: 0.5, cy: 0.46 } },
  'rag-answer': { draw: (c) => drawRag(c, 'answer'), camera: { zoom: 1.35, cx: 0.5, cy: 0.48 } },
  'rag-full': { sameAs: 'rag-answer', camera: { zoom: 1.08, cx: 0.5, cy: 0.5 } },
  'coda-launch': { draw: (c) => drawCoda(c, 'launch'), camera: { zoom: 1.25, cx: 0.42, cy: 0.42 } },
  'coda-prompt': { draw: (c) => drawCoda(c, 'prompt'), camera: { zoom: 1.45, cx: 0.4, cy: 0.44 } },
  'coda-react': { draw: (c) => drawCoda(c, 'react'), camera: { zoom: 1.5, cx: 0.4, cy: 0.56 } },
  'coda-code': { draw: (c) => drawCoda(c, 'code'), camera: { zoom: 1.55, cx: 0.62, cy: 0.55 } },
  'coda-done': { draw: (c) => drawCoda(c, 'done'), camera: { zoom: 1.15, cx: 0.5, cy: 0.5 } },
  'sentinel-upload': { draw: (c) => drawSentinel(c, 'upload'), camera: { zoom: 1.2, cx: 0.5, cy: 0.5 } },
  'sentinel-ingest': { draw: (c) => drawSentinel(c, 'ingest'), camera: { zoom: 1.4, cx: 0.5, cy: 0.42 } },
  'sentinel-dash': { draw: (c) => drawSentinel(c, 'dashboard'), camera: { zoom: 1.05, cx: 0.5, cy: 0.5 } },
  'sentinel-chain-z': { sameAs: 'sentinel-dash', camera: { zoom: 1.9, cx: 0.5, cy: 0.5 } },
  'sentinel-incident-z': { sameAs: 'sentinel-dash', camera: { zoom: 2.0, cx: 0.68, cy: 0.7 } },
  'outro-wordmark': { draw: drawOutro, camera: { zoom: 1.2, cx: 0.5, cy: 0.5 } },
  empty: { draw: drawEmpty, camera: { zoom: 1.0, cx: 0.5, cy: 0.5 } },
};

const targetCache = new Map<SceneName, TargetList>();
const frameCache = new Map<SceneName, HTMLCanvasElement>();

function resolveDrawName(name: SceneName): SceneName {
  const def = SCENES[name];
  return def.sameAs ?? name;
}

/** Render + sample unique frames once (call after fonts are ready). */
export function prerenderAll(names?: SceneName[]): void {
  const { canvas, ctx } = makeFrameCanvas();
  for (const name of names ?? (Object.keys(SCENES) as SceneName[])) {
    const drawName = resolveDrawName(name);
    if (targetCache.has(drawName)) continue;
    const def = SCENES[drawName];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, FRAME_W, FRAME_H);
    def.draw!(ctx);
    targetCache.set(drawName, sampleFrame(ctx.getImageData(0, 0, FRAME_W, FRAME_H)));
    // keep a copy for ?frame debugging
    const copy = document.createElement('canvas');
    copy.width = FRAME_W;
    copy.height = FRAME_H;
    copy.getContext('2d')!.drawImage(canvas, 0, 0);
    frameCache.set(drawName, copy);
  }
}

export function getTargets(name: SceneName): TargetList {
  const t = targetCache.get(resolveDrawName(name));
  if (!t) throw new Error(`scene not prerendered: ${name}`);
  return t;
}

export function getFrameCanvas(name: SceneName): HTMLCanvasElement | undefined {
  return frameCache.get(resolveDrawName(name));
}

export function sceneCamera(name: SceneName): CameraPreset {
  return SCENES[name].camera;
}

export const SCENE_ORDER = Object.keys(SCENES) as SceneName[];
