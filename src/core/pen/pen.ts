import { fnv1a, mulberry32 } from '../randomness/rng';

export interface Pt {
  x: number;
  y: number;
}

export interface Tuning {
  // Base warp amplitude in unit measure (window height = 2).
  amplitude: number;
  scratchWeight: number;
  // Below kochHand a stroke hangs on the hand only; above kochFrame fully on the beat.
  kochHand: number;
  kochFrame: number;
  handGain: number;
  frameGain: number;
  // 0 blunt ends, 1 running out to a point.
  spitz: number;
}

export interface StrokeOptions {
  name: string;
  width: number;
  spitz?: number;
  closed?: boolean;
  ruhig?: boolean;
}

const MEANDER_SUPPORTS = 12;
const SCRATCH_SUPPORTS = 40;
const FIELD = MEANDER_SUPPORTS + SCRATCH_SUPPORTS;
const SAMPLE_STEP = 0.012;
const BEATS_PER_SECOND = 8;

interface Field {
  meander: number[];
  scratch: number[];
}

interface Gains {
  handGain: number;
  frameGain: number;
  mix: number;
}

function sampleField(supports: number[], t: number, shift: number): number {
  const n = supports.length;
  const x = t * n + shift;
  const i0 = Math.floor(x);
  const f = x - i0;
  const at = (k: number) => supports[(((i0 + k) % n) + n) % n];
  const p0 = at(-1);
  const p1 = at(0);
  const p2 = at(1);
  const p3 = at(2);
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * f +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f +
      (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f)
  );
}

function centripetalCatmull(pts: Pt[]): Pt[] {
  if (pts.length < 3) return pts.slice();
  const out: Pt[] = [];
  const alpha = 0.5;
  const dist = (a: Pt, b: Pt) =>
    Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2) ** alpha || 1e-6;
  const lerpPt = (a: Pt, b: Pt, s: number): Pt => ({
    x: a.x + (b.x - a.x) * s,
    y: a.y + (b.y - a.y) * s,
  });
  const evalSeg = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, u: number): Pt => {
    const t1 = dist(p0, p1);
    const t2 = t1 + dist(p1, p2);
    const t3 = t2 + dist(p2, p3);
    const t = t1 + u * (t2 - t1);
    const at = (p: Pt, q: Pt, tp: number, tq: number): Pt =>
      lerpPt(p, q, (t - tp) / (tq - tp || 1e-6));
    const a1 = at(p0, p1, 0, t1);
    const a2 = at(p1, p2, t1, t2);
    const a3 = at(p2, p3, t2, t3);
    const b1 = at(a1, a2, 0, t2);
    const b2 = at(a2, a3, t1, t3);
    return at(b1, b2, t1, t2);
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < 12; s++) out.push(evalSeg(p0, p1, p2, p3, s / 12));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function pathNormals(pts: Pt[]): { nx: number; ny: number }[] {
  const normals: { nx: number; ny: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1e-6;
    normals.push({ nx: -dy / len, ny: dx / len });
  }
  return normals;
}

function pathLength(pts: Pt[]): number {
  let length = 0;
  for (let i = 1; i < pts.length; i++) {
    length += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return length;
}

function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let prev = pts[0];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    let next = pts[i];
    let segLen = Math.hypot(next.x - prev.x, next.y - prev.y);
    while (carry + segLen >= step) {
      const t = (step - carry) / segLen;
      const p = { x: prev.x + (next.x - prev.x) * t, y: prev.y + (next.y - prev.y) * t };
      out.push(p);
      prev = p;
      segLen = Math.hypot(next.x - prev.x, next.y - prev.y);
      carry = 0;
    }
    carry += segLen;
    prev = next;
  }
  // The end point always belongs: appended when far, replacing when close.
  const last = out[out.length - 1];
  const end = pts[pts.length - 1];
  if (Math.hypot(end.x - last.x, end.y - last.y) > step / 2) out.push(end);
  else out[out.length - 1] = end;
  return out;
}

export class Pen {
  private fields = new Map<string, Field>();
  private takt = 0;

  // The seed is not a constructor argument: the warp hangs on trace names, and
  // scene trace names embed the window address, so the seed travels inside them.
  constructor(
    private tuning: Tuning,
    private taktVersatz: number,
    private inkColor: string,
  ) {}

  get ink(): string {
    return this.inkColor;
  }

  setTime(time: number): void {
    this.takt = Math.floor(time * BEATS_PER_SECOND + this.taktVersatz);
  }

  private field(name: string): Field {
    let f = this.fields.get(name);
    if (!f) {
      const r = mulberry32(fnv1a(name));
      const all: number[] = [];
      for (let i = 0; i < FIELD; i++) all.push(r() * 2 - 1);
      f = {
        meander: all.slice(0, MEANDER_SUPPORTS),
        scratch: all.slice(MEANDER_SUPPORTS),
      };
      this.fields.set(name, f);
    }
    return f;
  }

  // The hand stream hangs on the trace name only; the frame stream rides the same
  // field but offset by the beat, so it re-rolls every takt and nothing else does.
  private warpedPath(pts: Pt[], name: string, amp: number, gains: Gains, ghost: boolean): Pt[] {
    const f = this.field(ghost ? `${name}~` : name);
    const handMeanderShift = ghost ? 7 : 0;
    const handScratchShift = ghost ? 13 : 0;
    const frameMeanderShift = (ghost ? 5 : 3) * this.takt + (ghost ? 7 : 0);
    const frameScratchShift = (ghost ? 11 : 7) * this.takt + (ghost ? 13 : 0);
    const normals = pathNormals(pts);
    const out: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const t = pts.length === 1 ? 0 : i / (pts.length - 1);
      const { nx, ny } = normals[i];
      const hand =
        sampleField(f.meander, t, handMeanderShift) +
        this.tuning.scratchWeight * sampleField(f.scratch, t, handScratchShift);
      const frame =
        sampleField(f.meander, t, frameMeanderShift) +
        this.tuning.scratchWeight * sampleField(f.scratch, t, frameScratchShift);
      const off = amp * (gains.handGain * hand + gains.mix * gains.frameGain * frame);
      out.push({ x: pts[i].x + nx * off, y: pts[i].y + ny * off });
    }
    return out;
  }

  private ribbon(ctx: CanvasRenderingContext2D, pts: Pt[], width: number, spitz: number): void {
    const left: Pt[] = [];
    const right: Pt[] = [];
    const normals = pathNormals(pts);
    for (let i = 0; i < pts.length; i++) {
      const t = i / (pts.length - 1);
      const { nx, ny } = normals[i];
      // Human verdict: window lines read best fat at the ends, thinning through
      // the middle — a deliberate divergence from the reference's pressure rule
      // (thin at touchdown/liftoff), which was tried and rejected on the page.
      const taper = (2 * Math.min(t, 1 - t)) ** 2;
      const w = (width / 2) * (1 - spitz * taper);
      left.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w });
      right.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w });
    }
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (const p of left) ctx.lineTo(p.x, p.y);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fill();
  }

  stroke(ctx: CanvasRenderingContext2D, raw: Pt[], opts: StrokeOptions): void {
    let pts = raw.filter(
      (p, i) => i === 0 || Math.hypot(p.x - raw[i - 1].x, p.y - raw[i - 1].y) > 1e-6,
    );
    if (pts.length < 2) return;

    if (opts.closed) {
      // Closed shapes overshoot 3.5% past their start so the set-down mark stays.
      let perimeter = 0;
      for (let i = 0; i < pts.length; i++) {
        const q = pts[(i + 1) % pts.length];
        perimeter += Math.hypot(q.x - pts[i].x, q.y - pts[i].y);
      }
      const runOut = perimeter * 0.035;
      const loop = [pts[pts.length - 1], ...pts, pts[0], pts[1]];
      pts = resample(centripetalCatmull(loop), SAMPLE_STEP);
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const d = Math.hypot(pts[i].x - pts[0].x, pts[i].y - pts[0].y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const start = pts.slice(best);
      let travelled = 0;
      let tip = start[start.length - 1];
      for (let i = 1; i < start.length && travelled < runOut; i++) {
        const d = Math.hypot(start[i].x - start[i - 1].x, start[i].y - start[i - 1].y);
        travelled += d;
        tip = start[i];
      }
      pts = travelled >= runOut ? start : [...start, tip];
    } else {
      pts = resample(centripetalCatmull(pts), SAMPLE_STEP);
    }
    const length = pathLength(pts);

    const tuning = this.tuning;
    let mix = 0;
    if (!opts.ruhig) {
      if (opts.closed) mix = 1;
      else if (length < tuning.kochHand) mix = 0;
      else if (length < tuning.kochFrame) {
        mix = (length - tuning.kochHand) / (tuning.kochFrame - tuning.kochHand);
      } else mix = 1;
    }
    const ampScale = length < tuning.kochHand ? 0.5 : 1;
    const amp = tuning.amplitude * ampScale;

    const gains: Gains = { handGain: tuning.handGain, frameGain: tuning.frameGain, mix };
    const strokeSpitz = opts.spitz ?? tuning.spitz;
    const ghost = this.warpedPath(pts, opts.name, amp * 1.7 + 0.004, gains, true);
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = this.ink;
    this.ribbon(ctx, ghost, opts.width / 2, strokeSpitz);
    ctx.restore();

    const warped = this.warpedPath(pts, opts.name, amp, gains, false);
    ctx.fillStyle = this.ink;
    this.ribbon(ctx, warped, opts.width, strokeSpitz);
  }

  dot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, name: string): void {
    const tilt = ((fnv1a(name) % 1000) / 1000) * Math.PI;
    const cap = Math.min(0.15 * r, 0.007);
    const scratch = this.field(name).scratch;
    const ring: Pt[] = [];
    // Open loop: the set-down gap stays visible.
    for (let i = 0; i <= 20; i++) {
      const a = 0.15 + (i / 20) * (2 * Math.PI - 0.3);
      const rr = r * (1 + 0.08 * Math.cos(2 * (a - tilt)));
      const wobble = scratch[i % SCRATCH_SUPPORTS] * cap;
      ring.push({
        x: cx + Math.cos(a) * rr + wobble,
        y: cy + Math.sin(a) * rr + wobble * 0.5,
      });
    }
    const pts = resample(centripetalCatmull(ring), SAMPLE_STEP / 2);
    const gains: Gains = { handGain: this.tuning.handGain, frameGain: 0, mix: 0 };
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = this.ink;
    this.ribbon(
      ctx,
      this.warpedPath(pts, `${name}~`, 0.004 * 1.7 + 0.004, gains, true),
      r * 0.25,
      this.tuning.spitz,
    );
    ctx.restore();
    ctx.fillStyle = this.ink;
    this.ribbon(ctx, this.warpedPath(pts, name, 0.004, gains, false), r * 0.5, this.tuning.spitz);
  }
}
