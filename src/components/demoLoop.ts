// Shared scaffolding for chapter demo canvases: theme colours, resize, the
// frame loop with reduced-motion handling, and the change-notification
// plumbing the controls island listens to. The painter draws the scene;
// everything here is the frame around it.

export interface DemoLoopHandle {
  subscribe(cb: () => void): () => void;
  notify(): void;
  // Resize to the CSS box and paint one still frame.
  repaint(): void;
  destroy(): void;
}

export function createDemoLoop(
  canvas: HTMLCanvasElement,
  // The palette arrives with every frame: a theme switch re-renders the same
  // scene in the new colours — nothing downstream keeps a colour.
  paint: (ctx: CanvasRenderingContext2D, time: number, palette: { ink: string; paper: string }) => void,
): DemoLoopHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('demo canvas: 2d context unavailable');

  let palette = { ink: '', paper: '' };
  const readColors = () => {
    const style = getComputedStyle(document.body);
    const bg = style.getPropertyValue('--color-primary-background').trim();
    const fg = style.getPropertyValue('--color-primary-foreground').trim();
    if (!bg || !fg) throw new Error('demo canvas: background/foreground tokens missing');
    palette = { ink: `rgb(${fg})`, paper: `rgb(${bg})` };
  };

  const frame = (time: number) => {
    ctx.save();
    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paint(ctx, time, palette);
    ctx.restore();
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };

  const repaint = () => {
    resize();
    frame(0);
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  let running = false;
  const tick = () => {
    frame(performance.now() / 1000);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || reducedMotion.matches) return;
    running = true;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  const listeners = new Set<() => void>();
  const notify = () => {
    for (const cb of listeners) cb();
  };

  const observer = new ResizeObserver(() => {
    repaint();
    start();
  });
  observer.observe(canvas);
  const themeObserver = new MutationObserver(() => {
    readColors();
    if (!running) repaint();
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  readColors();
  repaint();
  const onMotionChange = () => {
    stop();
    repaint();
    start();
  };
  reducedMotion.addEventListener('change', onMotionChange);
  start();

  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    notify,
    repaint,
    destroy() {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      reducedMotion.removeEventListener('change', onMotionChange);
      listeners.clear();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

// The canvas CSS box in CSS pixels, for painters that scale unit measure to fit.
export function cssBox(canvas: HTMLCanvasElement): { width: number; height: number; dpr: number } {
  const dpr = window.devicePixelRatio || 1;
  return { width: canvas.width / dpr, height: canvas.height / dpr, dpr };
}

// The standard frame for painters that draw in unit measure: scale so the
// given unit span fits the canvas, then move the origin to its centre
// (yBias in unit measure). Call inside a ctx.save()/restore().
export function centreUnit(
  ctx: CanvasRenderingContext2D,
  box: { width: number; height: number; dpr: number },
  unitsWide: number,
  unitsTall: number,
  yBias = 0,
): void {
  const scale = Math.min(box.width / unitsWide, box.height / unitsTall);
  ctx.scale(box.dpr * scale, box.dpr * scale);
  ctx.translate(box.width / (2 * scale), box.height / (2 * scale) + yBias);
}
