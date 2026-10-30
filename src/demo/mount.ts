export interface DemoHandle {
  destroy(): void;
}

export function mount(canvas: HTMLCanvasElement): DemoHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('demo canvas: 2d context unavailable');

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  return {
    destroy() {
      observer.disconnect();
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
