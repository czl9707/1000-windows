// Demos register themselves from their chapter's demo.ts; DemoCanvas pulls
// them in with a build-time glob, so no component imports a chapter by name.

export interface DemoHandle {
  destroy(): void;
}

// The contract a demo implements so the shared controls island can drive it.
// `reseed` is the re-roll the reseed button performs; `setParam` carries only
// the demo's declared tuning parameters.
export interface TuningHandle extends DemoHandle {
  setParam(key: string, value: number): void;
  reseed(value: number): void;
  resetParams(): void;
  snapshot(): Record<string, number>;
  subscribe(cb: () => void): () => void;
}

type Painter = (canvas: HTMLCanvasElement) => DemoHandle;

const kinds = new Map<string, Painter>();
const mounted = new WeakMap<HTMLCanvasElement, DemoHandle>();
const waiters = new WeakMap<HTMLCanvasElement, ((handle: DemoHandle) => void)[]>();

export function registerDemo(kind: string, painter: Painter): void {
  if (kinds.has(kind)) throw new Error(`demo canvas: kind "${kind}" registered twice`);
  kinds.set(kind, painter);
}

// The controls island awaits this instead of polling: a canvas whose demo
// never mounts keeps its promise pending (sliders visibly disabled) while
// mountAll surfaces the error.
export function handleRegistered(canvas: HTMLCanvasElement): Promise<DemoHandle> {
  const existing = mounted.get(canvas);
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const list = waiters.get(canvas) ?? [];
    list.push(resolve);
    waiters.set(canvas, list);
  });
}

function isTuningHandle(handle: DemoHandle): handle is TuningHandle {
  return 'setParam' in handle && 'reseed' in handle && 'resetParams' in handle && 'snapshot' in handle && 'subscribe' in handle;
}

export function tuningHandleFor(canvas: HTMLCanvasElement): TuningHandle | undefined {
  const handle = mounted.get(canvas);
  if (!handle) return undefined;
  if (!isTuningHandle(handle)) {
    throw new Error('tuning controls: demo exposes no tuning handle');
  }
  return handle;
}

export function mount(canvas: HTMLCanvasElement): DemoHandle {
  const kind = canvas.dataset.demo;
  if (!kind) throw new Error('demo canvas: missing data-demo attribute');
  const painter = kinds.get(kind);
  if (!painter) throw new Error(`demo canvas: unknown demo kind "${kind}"`);
  const handle = painter(canvas);
  mounted.set(canvas, handle);
  const waiting = waiters.get(canvas);
  if (waiting) {
    waiters.delete(canvas);
    for (const resolve of waiting) resolve(handle);
  }
  return handle;
}

// Every canvas gets its shot even when one fails; the failures then surface
// together, each named, instead of the first one silencing its siblings.
export function mountAll(root: ParentNode = document, selector = '[data-demo]'): DemoHandle[] {
  const results: DemoHandle[] = [];
  const failures: string[] = [];
  for (const canvas of root.querySelectorAll<HTMLCanvasElement>(selector)) {
    try {
      results.push(mount(canvas));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      failures.push(`${canvas.dataset.demo ?? '?'}: ${message}`);
    }
  }
  if (failures.length > 0) throw new Error(`demo canvas: ${failures.join('; ')}`);
  return results;
}
