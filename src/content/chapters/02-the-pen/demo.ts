// The control UI for this API lives in the React island
// (src/components/DemoCanvasControls.tsx).
import type { Tuning } from '../../../core/pen/pen';
import { Pen } from '../../../core/pen/pen';
import { registerDemo, type DemoHandle } from '../../../components/mount';
import type { NumericTuningKey } from '../../../core/pen/tuning';
import { fnv1a } from '../../../core/randomness/rng';
import { DEFAULT_TUNING } from '../../../core/pen/tuning';
import { drawWindow } from '../../../core/window-shell/window';

interface PenDemoHandle extends DemoHandle {
  setParam(key: NumericTuningKey, value: number): void;
  snapshot(): Tuning;
  subscribe(cb: () => void): () => void;
}

const SEED = 1335613256;

function mountPenPrototype(canvas: HTMLCanvasElement): PenDemoHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('demo canvas: 2d context unavailable');

  const tuning: Tuning = { ...DEFAULT_TUNING };

  let ground = '';
  let ink = '';
  const readColors = () => {
    const style = getComputedStyle(document.body);
    const bg = style.getPropertyValue('--color-primary-background').trim();
    const fg = style.getPropertyValue('--color-primary-foreground').trim();
    if (!bg || !fg) throw new Error('demo canvas: background/foreground tokens missing');
    ground = `rgb(${bg})`;
    ink = `rgb(${fg})`;
  };

  let pen = createPen();
  function createPen(): Pen {
    const windowSeed = fnv1a(`${SEED}:w:0,0`);
    const versatz = (fnv1a(`takt:${windowSeed}`) / 0xffffffff) * 8;
    return new Pen(tuning, versatz, ink);
  }

  const paint = (time: number) => {
    pen.setTime(time);
    ctx.save();
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const scale = Math.min(w / 2.6, h / 3.0);
    ctx.scale(dpr * scale, dpr * scale);
    ctx.translate(w / (2 * scale), h / (2 * scale));
    drawWindow(ctx, pen, SEED);
    ctx.restore();
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let running = false;
  const tick = () => {
    paint(performance.now() / 1000);
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || reducedMotion.matches) return;
    running = true;
    frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  const repaintStatic = () => {
    resize();
    paint(0);
  };

  const listeners = new Set<() => void>();
  const notify = () => {
    for (const cb of listeners) cb();
  };

  const observer = new ResizeObserver(() => {
    repaintStatic();
    start();
  });
  observer.observe(canvas);
  const themeObserver = new MutationObserver(() => {
    readColors();
    if (!running) repaintStatic();
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  readColors();
  pen = createPen();
  repaintStatic();
  const onMotionChange = () => {
    stop();
    repaintStatic();
    start();
  };
  reducedMotion.addEventListener('change', onMotionChange);
  start();

  const handle: PenDemoHandle = {
    setParam(key, value) {
      tuning[key] = value;
      if (!running) repaintStatic();
      notify();
    },
    snapshot: () => ({ ...tuning }),
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    destroy() {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      reducedMotion.removeEventListener('change', onMotionChange);
      listeners.clear();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
  return handle;
}

registerDemo('pen-prototype', mountPenPrototype);