// Demos register themselves from their chapter's demo.ts; DemoCanvas pulls
// them in with a build-time glob, so no component imports a chapter by name.

export interface DemoHandle {
  destroy(): void;
}

// The reseed buttons drive demos through this — demos with no tuning
// parameters implement nothing wider.
export interface ReseedHandle extends DemoHandle {
  reseed(value: number): void;
}

// The contract a demo implements so the shared controls island can drive it;
// `setParam` carries only the demo's declared tuning parameters.
export interface TuningHandle extends ReseedHandle {
  setParam(key: string, value: number): void;
  resetParams(): void;
  snapshot(): Record<string, number>;
  subscribe(cb: () => void): () => void;
}

type Painter = (canvas: HTMLCanvasElement) => DemoHandle;

export function rollSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

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

// The guards' keys derive from the contracts: a key added to or removed
// from an interface fails this compile, so the runtime check cannot drift.
const RESEED_KEYS: { [K in keyof ReseedHandle]: K } = { destroy: 'destroy', reseed: 'reseed' };
const TUNING_KEYS: { [K in keyof TuningHandle]: K } = {
  ...RESEED_KEYS,
  setParam: 'setParam',
  resetParams: 'resetParams',
  snapshot: 'snapshot',
  subscribe: 'subscribe',
};

function isTuningHandle(handle: DemoHandle): handle is TuningHandle {
  return Object.values(TUNING_KEYS).every((key) => key in handle);
}

function isReseedHandle(handle: DemoHandle): handle is ReseedHandle {
  return Object.values(RESEED_KEYS).every((key) => key in handle);
}

export function tuningHandleFor(canvas: HTMLCanvasElement): TuningHandle | undefined {
  const handle = mounted.get(canvas);
  if (!handle) return undefined;
  if (!isTuningHandle(handle)) {
    throw new Error('tuning controls: demo exposes no tuning handle');
  }
  return handle;
}

// For controls that only re-roll: a demo with no tuning handle still
// answers here.
export function reseedHandleFor(canvas: HTMLCanvasElement): ReseedHandle | undefined {
  const handle = mounted.get(canvas);
  if (!handle) return undefined;
  if (!isReseedHandle(handle)) {
    throw new Error('reseed controls: demo exposes no reseed handle');
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
