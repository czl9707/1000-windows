// The wall's texture: the paper stipple base across the whole wall, and the
// ragged illustrative brick-patch islands over it — the settled treatment
// from the throwaway prototype. Both draw on the wall plane (z = 0), where
// the projection is the identity, so the pen draws 2D points directly.
//
// The texture is seeded per wall slot: a slot is a coarse cell of the world
// grid (SLOT_W × SLOT_H), its rolls derived from the meta-seed and the
// slot's coordinates, so the surface differs region to region, survives
// panning, and re-rolls with the meta-seed like every window does.
import { fnv1a, mulberry32 } from '@/core/randomness/rng';
import type { Pen } from '@/pen/pen';
import { WALL_TEXTURE_WASH } from '@/styling/roles';
import { WEIGHTS } from '@/styling/weights';
import type { Camera } from './grid';
import { pairKey } from './pens';

const SLOT_W = 1.5;
const SLOT_H = 1.1;

interface Slot {
  si: number;
  ti: number;
}

// `margin` widens the extent so a slot's pen is alive before its patch
// first scrolls into view.
export function textureSlots(camera: Camera, extentW: number, extentH: number, margin = 0): Slot[] {
  const si0 = Math.floor((camera.x - extentW / 2 - margin) / SLOT_W);
  const si1 = Math.floor((camera.x + extentW / 2 + margin) / SLOT_W);
  const ti0 = Math.floor((camera.y - extentH / 2 - margin) / SLOT_H);
  const ti1 = Math.floor((camera.y + extentH / 2 + margin) / SLOT_H);
  const slots: Slot[] = [];
  for (let ti = ti0; ti <= ti1; ti++) {
    for (let si = si0; si <= si1; si++) {
      slots.push({ si, ti });
    }
  }
  return slots;
}

export function slotPenSeed(metaSeed: number, si: number, ti: number): number {
  return fnv1a(`wall:${metaSeed}:${si}:${ti}`);
}

// Stipple tile recovered verbatim from the nolli landing hero: drawn at
// its original scale so the grain keeps it.
const STIPPLE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='g' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch' result='fine'/%3E%3CfeColorMatrix in='fine' type='matrix' values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 4 0 0 0 -2.6' result='dots'/%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.045' numOctaves='2' seed='11' stitchTiles='stitch' result='patch'/%3E%3CfeColorMatrix in='patch' type='matrix' values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 3 0 0 0 -0.9' result='mask'/%3E%3CfeComposite in='dots' in2='mask' operator='in'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23g)'/%3E%3C/svg%3E";
const STIPPLE_UNITS = 3.4;
let stipple: HTMLImageElement | null = null;

export function drawStipple(ctx: CanvasRenderingContext2D, camera: Camera, extentW: number, extentH: number): void {
  if (!stipple) {
    stipple = new Image();
    stipple.src = STIPPLE_SRC;
  }
  if (!stipple.complete || !stipple.naturalWidth) return;
  ctx.save();
  ctx.globalAlpha = WALL_TEXTURE_WASH.stipple;
  // Tiles anchor at the world origin: panning slides the grain with the
  // wall, it never swims against it.
  const i0 = Math.floor((camera.x - extentW / 2) / STIPPLE_UNITS);
  const j0 = Math.floor((camera.y - extentH / 2) / STIPPLE_UNITS);
  for (let i = i0; i * STIPPLE_UNITS < camera.x + extentW / 2; i++) {
    for (let j = j0; j * STIPPLE_UNITS < camera.y + extentH / 2; j++) {
      ctx.drawImage(stipple, i * STIPPLE_UNITS, j * STIPPLE_UNITS, STIPPLE_UNITS, STIPPLE_UNITS);
    }
  }
  ctx.restore();
}

// Ragged islands of brickwork like the sketchbook reference: each patch is a
// handful of long horizontal course lines that overshoot the patch edge,
// with short vertical joints ticked between courses — sparse, partial, never
// a closed box. Silhouettes step because every course's length and offset
// rolls separately. Every stroke is `ruhig`: mortar does not tremble.
const BRICK_HEIGHT = 0.055;

export function drawPatchSlot(
  ctx: CanvasRenderingContext2D,
  pen: Pen,
  metaSeed: number,
  si: number,
  ti: number,
  ink: string,
): void {
  const r = mulberry32(fnv1a(`patch:${metaSeed}:${si}:${ti}`));
  if (r() > 0.78) return;
  const cx = si * SLOT_W + 0.25 + r() * (SLOT_W - 0.5);
  const cy = ti * SLOT_H + 0.2 + r() * (SLOT_H - 0.4);
  const rows = 2 + Math.floor(r() * 6);
  const baseW = 0.45 + r() * 0.65;
  const tilt = (r() - 0.5) * 0.03;
  const h = (rows - 1) * BRICK_HEIGHT;
  ctx.save();
  ctx.globalAlpha = WALL_TEXTURE_WASH.patch;
  for (let ri = 0; ri < rows; ri++) {
    const rr = mulberry32(fnv1a(`course:${metaSeed}:${si}:${ti}:${ri}`));
    const len = baseW * (0.55 + rr() * 0.7);
    const x0 = cx - len / 2 + (rr() - 0.5) * 0.1;
    const y = cy - h / 2 + ri * BRICK_HEIGHT;
    const runPast = 0.03 + rr() * 0.05;
    pen.stroke(
      ctx,
      [
        { x: x0 - runPast, y: y + (rr() - 0.5) * 0.006 },
        { x: x0 + len + runPast, y: y + tilt + (rr() - 0.5) * 0.006 },
      ],
      { name: `hl:${si}:${ti}:${ri}`, width: WEIGHTS.frame, color: ink, ruhig: true, spitz: 0.6 },
    );
    if (ri === rows - 1) continue;
    const step = 0.13 + rr() * 0.05;
    const off = rr() * step;
    const j0 = Math.ceil((x0 + 0.04 - off) / step);
    const j1 = Math.floor((x0 + len - 0.06 - off) / step);
    for (let ji = j0; ji <= j1; ji++) {
      const rj = mulberry32(fnv1a(`joint:${metaSeed}:${si}:${ti}:${ri}:${ji}`));
      if (rj() > 0.72) continue;
      const jx = ji * step + off + (rj() - 0.5) * 0.008;
      pen.stroke(
        ctx,
        [
          { x: jx, y: y + rj() * 0.012 },
          { x: jx + (rj() - 0.5) * 0.008, y: y + BRICK_HEIGHT },
        ],
        { name: `vj:${si}:${ti}:${ri}:${ji}`, width: WEIGHTS.frame, color: ink, ruhig: true, spitz: 0.6 },
      );
    }
  }
  ctx.restore();
}
