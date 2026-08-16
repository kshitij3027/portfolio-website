import { FRAME_H, FRAME_W, MORPH } from '../config';
import { camera } from './camera';
import { clock } from './clock';
import { Mode, evalParticle, pool, type TargetList } from './particles';
import { mulberry32 } from './rng';

/**
 * Differential morph: old particles near a new target slide to it; orphaned old
 * particles fade out; unclaimed targets bloom in from the camera's focal center
 * with a temporary brightness boost. Matched particles keep slot & seed.
 */
export function morphTo(targets: TargetList): void {
  const now = clock.now();
  pool.compact(now);

  const rng = mulberry32((now | 0) ^ 0x9e3779b9);

  // proximity threshold expressed in frame px at the current zoom
  const screenPerFrame = (Math.max(innerWidth / FRAME_W, innerHeight / FRAME_H) || 0.5) * camera.zoomNow();
  const threshold = MORPH.proximityPx / Math.max(screenPerFrame, 0.05);
  const cell = Math.max(threshold, 8);
  const cols = Math.ceil((FRAME_W * 1.5) / cell);

  // bucket targets
  const grid = new Map<number, number[]>();
  for (let i = 0; i < targets.count; i++) {
    const key = Math.floor((targets.x[i] + FRAME_W * 0.25) / cell) + Math.floor((targets.y[i] + FRAME_H * 0.25) / cell) * cols;
    const arr = grid.get(key);
    if (arr) arr.push(i);
    else grid.set(key, [i]);
  }
  const claimed = new Uint8Array(targets.count);
  const thresholdSq = threshold * threshold;

  // pass 1: match live particles to nearby targets
  const liveAtStart = pool.live;
  for (let p = 0; p < liveAtStart; p++) {
    const cur = evalParticle(pool, p, now);
    if (cur.mode === Mode.FadeOut) continue; // already dying; let it finish

    const cx = Math.floor((cur.x + FRAME_W * 0.25) / cell);
    const cy = Math.floor((cur.y + FRAME_H * 0.25) / cell);
    let best = -1;
    let bestD = thresholdSq;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const arr = grid.get(cx + ox + (cy + oy) * cols);
        if (!arr) continue;
        for (const ti of arr) {
          if (claimed[ti]) continue;
          const dx = targets.x[ti] - cur.x;
          const dy = targets.y[ti] - cur.y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = ti;
          }
        }
      }
    }

    if (best >= 0) {
      claimed[best] = 1;
      pool.retarget(
        p,
        cur.x,
        cur.y,
        cur.b,
        targets.x[best],
        targets.y[best],
        targets.b[best],
        now + rng() * MORPH.slideDelayMaxMs,
        MORPH.slideMs,
      );
    } else {
      const ang = rng() * Math.PI * 2;
      const drift = 20 + rng() * 30;
      pool.kill(p, cur.x, cur.y, cur.b, now, MORPH.fadeOutMs, Math.cos(ang) * drift, Math.sin(ang) * drift);
    }
  }

  // pass 2: unclaimed targets bloom in from the focal center
  const focal = camera.screenCenterInFrame();
  const spread = 260 * MORPH.explodeIntensity;
  for (let ti = 0; ti < targets.count; ti++) {
    if (claimed[ti]) continue;
    const ang = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * spread;
    // text particles get uniform size so strokes render evenly
    const size = targets.b[ti] >= 0.99 ? 1 : 0.75 + rng() * 0.5;
    pool.add(
      focal.x + Math.cos(ang) * r,
      focal.y + Math.sin(ang) * r,
      targets.x[ti],
      targets.y[ti],
      0,
      targets.b[ti],
      now + rng() * MORPH.explodeDelayMaxMs,
      MORPH.explodeMs,
      Mode.ExplodeIn,
      rng(),
      size,
    );
  }
}
