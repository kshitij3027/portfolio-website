import { camera, type CameraPreset } from '../engine/camera';
import { clock } from '../engine/clock';
import { morphTo } from '../engine/morph';
import { getTargets, sceneCamera, type SceneName } from '../scenes/registry';
import { ChapterCard } from '../ui/chapterCard';
import { runCycle } from './timeline';

export interface DirectorCtx {
  wait(ms: number): Promise<void>;
  /** Differential-morph to a scene and tween the camera to its preset. */
  setScene(name: SceneName): void;
  /** Camera-only move (for pullbacks over the same image). */
  cameraTo(p: Partial<CameraPreset>, ms?: number): void;
  card: ChapterCard;
}

export function startDirector(terminalsRoot: HTMLElement): void {
  const card = new ChapterCard(terminalsRoot);

  const ctx: DirectorCtx = {
    wait: (ms) => clock.wait(ms),
    setScene: (name) => {
      camera.tweenTo(sceneCamera(name));
      morphTo(getTargets(name));
    },
    cameraTo: (p, ms) => {
      const cur = camera.current();
      camera.tweenTo({ ...cur, ...p }, ms);
    },
    card,
  };

  void (async () => {
    for (;;) {
      await runCycle(ctx);
    }
  })();
}
