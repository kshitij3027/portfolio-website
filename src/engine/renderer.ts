import { DOT, DPR_MAX, FRAME_H, FRAME_W, HEARTBEAT, MORPH, WOBBLE } from '../config';
import { camera } from './camera';
import { clock } from './clock';
import { STRIDE, pool } from './particles';

const VERT = `
precision highp float;

attribute vec2 aFrom;
attribute vec2 aTo;
attribute vec2 aBright;   // fromB, toB
attribute vec3 aTiming;   // start, dur, mode
attribute vec2 aIdent;    // seed, size

uniform mat3 uMat;
uniform float uTime;      // clock ms
uniform float uDotPx;     // physical px at zoom 1
uniform float uZoomSize;  // dot growth factor from zoom
uniform vec3 uWobble;     // radial, lateral, jitter (frame px)
uniform vec4 uHeart;      // periodMs, waveSpeed(px/s), ring, maxDisp
uniform vec2 uHeartC;     // frame coords of heartbeat center
uniform vec2 uBoost;      // boostAmount, decayMs

varying float vAlpha;
varying float vBright;

void main() {
  float start = aTiming.x;
  float dur = max(aTiming.y, 1.0);
  float mode = aTiming.z;
  float seed = aIdent.x;

  float t = clamp((uTime - start) / dur, 0.0, 1.0);
  float easeOut = 1.0 - pow(1.0 - t, 3.0);

  vec2 pos = mix(aFrom, aTo, easeOut);
  float b = mix(aBright.x, aBright.y, easeOut);
  float alpha = 1.0;

  if (mode > 1.5) {
    // FadeOut: ease-in alpha decay while drifting
    alpha = 1.0 - t * t;
  } else if (mode > 0.5) {
    // ExplodeIn: brightness boost decaying after arrival start
    float bt = clamp((uTime - start) / uBoost.y, 0.0, 1.0);
    b *= 1.0 + (uBoost.x - 1.0) * (1.0 - bt);
    alpha = min(t * 4.0, 1.0);
  }

  // text pixels (target brightness ~1) barely move so glyphs stay razor sharp
  float calm = 1.0 - 0.8 * smoothstep(0.8, 1.0, aBright.y);

  // idle wobble (sum of sines; phase from seed)
  float ph = seed * 6.28318;
  float wt = uTime * 0.001;
  pos += vec2(
    sin(wt * 1.31 + ph) * uWobble.x + sin(wt * 2.17 + ph * 1.7) * uWobble.z,
    cos(wt * 1.09 + ph * 1.3) * uWobble.y + cos(wt * 1.93 + ph * 2.3) * uWobble.z
  ) * calm;

  // heartbeat: radial ring rippling outward from center
  float beatT = mod(uTime, uHeart.x) * 0.001;
  float waveR = beatT * uHeart.y;
  vec2 rel = pos - uHeartC;
  float dist = length(rel);
  float g = exp(-pow((dist - waveR) / uHeart.z, 2.0));
  pos += (dist > 0.001 ? rel / dist : vec2(0.0)) * g * uHeart.w * calm;

  vec3 clip = uMat * vec3(pos, 1.0);
  gl_Position = vec4(clip.xy, 0.0, 1.0);
  gl_PointSize = uDotPx * aIdent.y * uZoomSize;
  vAlpha = alpha;
  vBright = b;
}
`;

const FRAG = `
precision mediump float;
varying float vAlpha;
varying float vBright;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  float edge = smoothstep(0.5, 0.42, r);
  float a = edge * vAlpha * vBright;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vec3(1.0), a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`shader: ${gl.getShaderInfoLog(sh) ?? 'unknown'}`);
  }
  return sh;
}

export class Renderer {
  private gl!: WebGLRenderingContext;
  private buf!: WebGLBuffer;
  private canvas!: HTMLCanvasElement;
  private uMat!: WebGLUniformLocation;
  private uTime!: WebGLUniformLocation;
  private uDotPx!: WebGLUniformLocation;
  private uZoomSize!: WebGLUniformLocation;
  private rafId = 0;
  private lastRaf = 0;
  private frameCallbacks: Array<() => void> = [];

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`link: ${gl.getProgramInfoLog(prog) ?? 'unknown'}`);
    }
    gl.useProgram(prog);

    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, pool.data.byteLength, gl.DYNAMIC_DRAW);

    const stride = STRIDE * 4;
    const bind = (name: string, size: number, offsetFloats: number) => {
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offsetFloats * 4);
    };
    bind('aFrom', 2, 0);
    bind('aTo', 2, 2);
    bind('aBright', 2, 4);
    bind('aTiming', 3, 6);
    bind('aIdent', 2, 9);

    const u = (n: string) => gl.getUniformLocation(prog, n)!;
    this.uMat = u('uMat');
    this.uTime = u('uTime');
    this.uDotPx = u('uDotPx');
    this.uZoomSize = u('uZoomSize');
    gl.uniform3f(u('uWobble'), WOBBLE.radial, WOBBLE.lateral, WOBBLE.jitter);
    gl.uniform4f(
      u('uHeart'),
      60_000 / HEARTBEAT.bpm,
      HEARTBEAT.waveSpeed,
      HEARTBEAT.ringThickness,
      HEARTBEAT.maxDisp,
    );
    gl.uniform2f(u('uHeartC'), FRAME_W / 2, FRAME_H / 2);
    gl.uniform2f(u('uBoost'), MORPH.boost, MORPH.boostDecayMs);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 1);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = Math.min(devicePixelRatio || 1, DPR_MAX);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    camera.setViewport(w, h);
  }

  /** Register a per-frame callback (terminal anchor sync, FPS meters…). */
  onFrame(cb: () => void): void {
    this.frameCallbacks.push(cb);
  }

  start(): void {
    const loop = (ts: number) => {
      this.rafId = requestAnimationFrame(loop);
      const dt = this.lastRaf ? ts - this.lastRaf : 16.7;
      this.lastRaf = ts;
      clock.tick(dt);
      camera.update();
      this.draw();
      for (const cb of this.frameCallbacks) cb();
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  /** Single frame without starting the rAF loop (reduced-motion static mode). */
  drawOnce(): void {
    this.draw();
  }

  private draw(): void {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!pool.live) return;

    if (pool.dirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pool.data.subarray(0, pool.live * STRIDE));
      pool.dirty = false;
    }

    const dpr = Math.min(devicePixelRatio || 1, DPR_MAX);
    gl.uniformMatrix3fv(this.uMat, false, camera.matrix());
    gl.uniform1f(this.uTime, clock.now());
    gl.uniform1f(this.uDotPx, DOT.base * dpr);
    // dot size follows the true on-screen scale so texture stays fine-grained
    // on phones (low screen-px/frame-px) instead of blobbing together
    const spf = camera.screenPerFrame();
    const sizeFactor = Math.pow(Math.min(Math.max(spf / 0.56, 0.5), 1.2), 0.6);
    gl.uniform1f(this.uZoomSize, sizeFactor);
    gl.drawArrays(gl.POINTS, 0, pool.live);
  }
}

export const renderer = new Renderer();
