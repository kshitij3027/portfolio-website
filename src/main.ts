import './styles/main.css';
import { camera } from './engine/camera';
import { clock } from './engine/clock';
import { morphTo } from './engine/morph';
import { renderer } from './engine/renderer';
import {
  SCENE_ORDER,
  getFrameCanvas,
  getTargets,
  prerenderAll,
  sceneCamera,
  type SceneName,
} from './scenes/registry';
import { startDirector } from './orchestration/director';
import { mountFab } from './ui/socialFab';

async function loadFonts(): Promise<void> {
  await Promise.all([
    document.fonts.load('900 220px Inter'),
    document.fonts.load('700 100px Inter'),
    document.fonts.load('600 40px Inter'),
    document.fonts.load('400 40px Inter'),
    document.fonts.load('700 40px "JetBrains Mono"'),
    document.fonts.load('500 40px "JetBrains Mono"'),
    document.fonts.load('400 40px "JetBrains Mono"'),
    document.fonts.load('italic 400 60px "Instrument Serif"'),
  ]).catch(() => undefined);
  await document.fonts.ready;
}

/** Debug: show a frame's raw Canvas2D image, letterboxed. */
function rawFrameMode(name: SceneName): void {
  const stage = document.getElementById('stage') as HTMLCanvasElement;
  const ctx = stage.getContext('2d')!;
  const draw = () => {
    stage.width = innerWidth;
    stage.height = innerHeight;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, stage.width, stage.height);
    const frame = getFrameCanvas(name);
    if (!frame) {
      ctx.fillStyle = '#f55';
      ctx.font = '16px monospace';
      ctx.fillText(`unknown frame: ${name}`, 40, 60);
      return;
    }
    const s = Math.min(stage.width / frame.width, stage.height / frame.height);
    const w = frame.width * s;
    const h = frame.height * s;
    ctx.drawImage(frame, (stage.width - w) / 2, (stage.height - h) / 2, w, h);
    ctx.fillStyle = '#0f0';
    ctx.font = '13px monospace';
    ctx.fillText(`frame: ${name}`, 10, innerHeight - 12);
  };
  draw();
  window.addEventListener('resize', draw);
}

/** Debug: show one sampled scene as live particles; arrows cycle scenes. */
function sceneMode(initial: SceneName): void {
  renderer.init(document.getElementById('stage') as HTMLCanvasElement);
  renderer.start();

  let idx = Math.max(SCENE_ORDER.indexOf(initial), 0);
  const show = (jump: boolean) => {
    const name = SCENE_ORDER[idx];
    if (jump) camera.jumpTo(sceneCamera(name));
    else camera.tweenTo(sceneCamera(name));
    morphTo(getTargets(name));
    console.info(`[scene] ${name} · ${getTargets(name).count} targets`);
  };
  show(true);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      idx = (idx + 1) % SCENE_ORDER.length;
      show(false);
    } else if (e.key === 'ArrowLeft') {
      idx = (idx - 1 + SCENE_ORDER.length) % SCENE_ORDER.length;
      show(false);
    }
  });
}

function wirePointerParallax(): void {
  window.addEventListener('pointermove', (e) => {
    camera.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });
}

function wirePause(): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clock.pause();
    else clock.resume();
  });
  const hero = document.getElementById('hero')!;
  new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!document.hidden) {
          if (en.isIntersecting) clock.resume();
          else clock.pause();
        }
      }
    },
    { threshold: 0.05 },
  ).observe(hero);
}

/** prefers-reduced-motion: static intro frame, no animation loop. */
function staticMode(): void {
  renderer.init(document.getElementById('stage') as HTMLCanvasElement);
  camera.jumpTo(sceneCamera('intro-wordmark'));
  morphTo(getTargets('intro-wordmark'));
  // settle all morphs/wobble to a fixed instant, then draw exactly once
  for (let i = 0; i < 40; i++) clock.tick(100);
  camera.update();
  renderer.drawOnce();
}

function isPortraitPhone(): boolean {
  return innerWidth < 700 && innerHeight > innerWidth;
}

/** Reload when rotating across the poster/film boundary — cheapest correct transition. */
function watchOrientation(startedAsPoster: boolean): void {
  window.addEventListener('resize', () => {
    if (isPortraitPhone() !== startedAsPoster) location.reload();
  });
}

async function boot(): Promise<void> {
  mountFab(document.getElementById('fab')!);
  await loadFonts();

  const params = new URLSearchParams(location.search);
  const frameParam = params.get('frame') as SceneName | null;
  const sceneParam = params.get('scene') as SceneName | null;
  const seekParam = params.get('t');
  const hasDevParam = Boolean(frameParam || sceneParam || seekParam);

  // Portrait phones: play the full film through width-friendly cameras.
  if (isPortraitPhone()) {
    camera.setAdapter((p) => ({
      zoom: Math.min(Math.max(p.zoom * 0.42, 0.42), 0.85),
      cx: p.cx,
      cy: 0.5,
    }));
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches && !hasDevParam) {
    prerenderAll(['intro-wordmark']);
    staticMode();
    return;
  }

  prerenderAll();

  if (frameParam) {
    rawFrameMode(frameParam);
    return;
  }

  if (sceneParam) {
    sceneMode(sceneParam);
    wirePointerParallax();
    return;
  }

  renderer.init(document.getElementById('stage') as HTMLCanvasElement);
  renderer.start();
  wirePointerParallax();
  wirePause();
  watchOrientation(isPortraitPhone());
  startDirector(document.getElementById('terminals')!);

  if (seekParam) {
    void clock.fastForwardTo(Number(seekParam) * 1000);
  }

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__dbg = { clock, camera };
  }
}

void boot();
