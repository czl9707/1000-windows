export interface DemoHandle {
  destroy(): void;
}

export function mount(canvas: HTMLCanvasElement): DemoHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('demo canvas: 2d context unavailable');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };

  let frame = 0;
  let running = false;

  const tick = () => {
    ctx.fillStyle = 'rgb(229 222 214)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const onMotionChange = () => {
    stop();
    resize();
    start();
  };
  reducedMotion.addEventListener('change', onMotionChange);

  start();

  return {
    destroy() {
      stop();
      observer.disconnect();
      reducedMotion.removeEventListener('change', onMotionChange);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

export function mountAll(root: ParentNode = document, selector = '[data-demo]'): DemoHandle[] {
  const handles: DemoHandle[] = [];
  for (const el of root.querySelectorAll<HTMLCanvasElement>(selector)) {
    handles.push(mount(el));
  }
  return handles;
}
