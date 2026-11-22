// Shared scaffolding for chapter demo canvases: the painter draws the
// scene; everything here is the frame around it.

export interface DemoLoopHandle {
  subscribe(cb: () => void): () => void;
  notify(): void;
  repaint(): void;
  destroy(): void;
}

// The resolved eye: this canvas's offset from the screen centre, in unit
// measure. Structurally motion's Eye — components never import the engine;
// chapters pass it straight into the projection.
export interface EyeOffset {
  x: number;
  y: number;
}

const CENTRE: EyeOffset = { x: 0, y: 0 };

export function createDemoLoop(
  canvas: HTMLCanvasElement,
  // The theme arrives with every frame — its two colours and its night
  // flag, read off the page's own theme attribute. A theme switch
  // re-renders the same scene in the new colours — nothing downstream keeps
  // a palette. The eye arrives resolved; the painter draws it as given.
  paint: (
    ctx: CanvasRenderingContext2D,
    time: number,
    theme: { ink: string; paper: string; night: number; transitionMs: number },
    eye: EyeOffset,
  ) => void,
  // A demo maps its own input to the eye — the motion strip its pointer,
  // the home wall the canvas's real position — with whatever listeners it
  // needs.
  resolveEye: (canvas: HTMLCanvasElement) => EyeOffset = () => CENTRE,
): DemoLoopHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('demo canvas: 2d context unavailable');

  let theme = { ink: '', paper: '', night: 0, transitionMs: 0 };
  const readTheme = () => {
    const style = getComputedStyle(document.body);
    const channel = (name: string) => {
      const value = style.getPropertyValue(name).trim();
      if (!value) throw new Error(`demo canvas: theme channel ${name} missing`);
      return value;
    };
    const triplet = (base: string) =>
      `rgb(${channel(`${base}-r`)} ${channel(`${base}-g`)} ${channel(`${base}-b`)})`;
    const seconds = parseFloat(channel('--transition-theme'));
    if (!Number.isFinite(seconds)) throw new Error('demo canvas: --transition-theme token missing');
    theme = {
      ink: triplet('--theme-ink'),
      paper: triplet('--theme-paper'),
      night: document.body.getAttribute('data-theme') === 'dark' ? 1 : 0,
      transitionMs: seconds * 1000,
    };
  };

  const frame = (time: number) => {
    ctx.save();
    ctx.fillStyle = theme.paper;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paint(ctx, time, theme, resolveEye(canvas));
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
    readTheme();
    if (!running) repaint();
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

  readTheme();
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
      listeners.clear();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

export function cssBox(canvas: HTMLCanvasElement): { width: number; height: number; dpr: number } {
  const dpr = window.devicePixelRatio || 1;
  return { width: canvas.width / dpr, height: canvas.height / dpr, dpr };
}

// The pointer as the eye's stand-in: the cursor's offset from the canvas
// centre, normalized to the CSS box and scaled to the spans the caller
// gives — the cursor at an edge reads as this canvas sitting at the
// screen's edge. Leaving the canvas re-centres it.
export function trackPointerEye(
  canvas: HTMLCanvasElement,
  spanX: number,
  spanY: number,
): { eye: () => EyeOffset; unbind: () => void } {
  let pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };
  };
  const onLeave = () => {
    pointer = { x: 0, y: 0 };
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  return {
    eye: () => ({ x: pointer.x * spanX, y: pointer.y * spanY }),
    unbind: () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    },
  };
}

// The standard frame for painters that draw in unit measure. Call inside a
// ctx.save()/restore().
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
