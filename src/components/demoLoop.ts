// Shared scaffolding for chapter demo canvases: theme colours, resize, the
// frame loop, and the change-notification plumbing the controls island
// listens to. The painter draws the scene; everything here is the frame
// around it.

export interface DemoLoopHandle {
  subscribe(cb: () => void): () => void;
  notify(): void;
  // Resize to the CSS box and paint one still frame.
  repaint(): void;
  destroy(): void;
}

// The pointer's offset from the canvas centre, normalized to the CSS box
// (−0.5..0.5 per axis). The stand-in for where this canvas sits relative to
// the screen centre; the home wall replaces it with the real thing.
export interface Pointer {
  x: number;
  y: number;
}

// The resolved eye: this canvas's offset from the screen centre, in unit
// measure. Structurally motion's Eye; defined here because components never
// import the engine.
export interface Eye {
  x: number;
  y: number;
}

const CENTRE: Eye = { x: 0, y: 0 };

export function createDemoLoop(
  canvas: HTMLCanvasElement,
  // The theme's two colours arrive with every frame: a theme switch
  // re-renders the same scene in the new colours — nothing downstream keeps
  // a palette. The eye arrives resolved; the painter draws it as given.
  paint: (
    ctx: CanvasRenderingContext2D,
    time: number,
    colors: { ink: string; paper: string },
    eye: Eye,
  ) => void,
  // Where the eye sits for this scene. The default centres it: a demo maps
  // the pointer to the eye, the home wall will map the canvas's real
  // position.
  resolveEye: (canvas: HTMLCanvasElement, pointer: Pointer) => Eye = () => CENTRE,
): DemoLoopHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('demo canvas: 2d context unavailable');

  let colors = { ink: '', paper: '' };
  const readColors = () => {
    const style = getComputedStyle(document.body);
    const bg = style.getPropertyValue('--color-primary-background').trim();
    const fg = style.getPropertyValue('--color-primary-foreground').trim();
    if (!bg || !fg) throw new Error('demo canvas: background/foreground tokens missing');
    colors = { ink: `rgb(${fg})`, paper: `rgb(${bg})` };
  };

  let pointer: Pointer = { x: 0, y: 0 };

  const frame = (time: number) => {
    ctx.save();
    ctx.fillStyle = colors.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paint(ctx, time, colors, resolveEye(canvas, pointer));
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

  let raf = 0;
  let running = false;
  const tick = () => {
    frame(performance.now() / 1000);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (running) return;
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

  // The pointer feeds the still demos immediately; a running loop picks it
  // up on its next frame anyway. Leaving the canvas re-centres it.
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };
    if (!running) frame(0);
  };
  const onPointerLeave = () => {
    pointer = { x: 0, y: 0 };
    if (!running) frame(0);
  };
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);

  readColors();
  repaint();
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
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
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
