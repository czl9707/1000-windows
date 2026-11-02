// The wall's single entrypoint — drawWindow's counterpart one level up.
// The caller picks the view: the home wall culls with visibleCells; the
// strip pins a fixed frame. The pan gestures live beside it in wall/drag —
// a pannable surface binds them, the strip never does. The wall composites
// windows strictly through drawWindow; it knows nothing of what happens
// inside one.
import { Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import { makePalette, type ThemeColors } from '@/styling/roles';
import { windowSeed } from '@/core/randomness/rng';
import { drawWindow } from '@/core/entry';
import type { Eye } from '@/motion/projection';
import { glide as glideStep, type Velocity } from './camera';
import { PITCH_X, PITCH_Y, type Camera, type Cell } from './grid';
import { pairFrom, pairKey } from './pens';
import { PenLedger } from './ledger';
import { drawPatchSlot, drawStipple, slotPenSeed, textureSlots } from './texture';

// The canvas box in CSS pixels — the demo runtime's cssBox shape, restated
// here so the engine never imports the demo runtime.
export interface WallBox {
  width: number;
  height: number;
  dpr: number;
}

// `margin` widens the texture-slot pass so a slot's pen warms before its
// patch scrolls into view.
export interface WallFrame {
  unit: number;
  eye: Eye;
  cells: Cell[];
  margin?: number;
}

export class Wall {
  camera: Camera = { x: 0, y: 0 };
  velocity: Velocity = { x: 0, y: 0 };

  private metaSeed: number;
  // Set by the gesture wiring (wall/drag): while held, the camera answers
  // the pointer and advance() holds the glide.
  private dragging = false;
  private readonly cellPens: PenLedger;
  private readonly slotPens: PenLedger;

  constructor(metaSeed: number) {
    this.metaSeed = metaSeed;
    this.cellPens = new PenLedger((key) => {
      const [col, row] = pairFrom(key);
      return new Pen({ ...DEFAULT_TUNING }, windowSeed(this.metaSeed, col, row));
    });
    this.slotPens = new PenLedger((key) => {
      const [si, ti] = pairFrom(key);
      return new Pen({ ...DEFAULT_TUNING }, slotPenSeed(this.metaSeed, si, ti));
    });
  }

  reseed(metaSeed: number): void {
    this.metaSeed = Math.round(metaSeed);
    this.cellPens.clear();
    this.slotPens.clear();
  }

  beginDrag(): void {
    this.dragging = true;
    this.velocity = { x: 0, y: 0 };
  }

  endDrag(keepVelocity: boolean): void {
    this.dragging = false;
    if (!keepVelocity) this.velocity = { x: 0, y: 0 };
  }

  advance(dt: number): void {
    if (this.dragging) return;
    const next = glideStep(this.camera, this.velocity, dt);
    this.camera = next.camera;
    this.velocity = next.velocity;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    box: WallBox,
    frame: WallFrame,
    time: number,
    colors: ThemeColors,
  ): void {
    const extentW = box.width / frame.unit;
    const extentH = box.height / frame.unit;
    const palette = makePalette(colors);
    ctx.save();
    ctx.scale(box.dpr * frame.unit, box.dpr * frame.unit);
    // The camera point rides at the canvas centre.
    ctx.translate(
      box.width / (2 * frame.unit) - this.camera.x,
      box.height / (2 * frame.unit) - this.camera.y,
    );

    drawStipple(ctx, this.camera, extentW, extentH);

    const slots = textureSlots(this.camera, extentW, extentH, frame.margin ?? 0);
    this.slotPens.sync(slots.map((s) => pairKey(s.si, s.ti)));
    for (const { si, ti } of slots) {
      const pen = this.slotPens.get(pairKey(si, ti));
      pen.setTime(time);
      drawPatchSlot(ctx, pen, this.metaSeed, si, ti, colors.ink);
    }

    this.cellPens.sync(frame.cells.map((c) => pairKey(c.col, c.row)));
    for (const { col, row } of frame.cells) {
      const pen = this.cellPens.get(pairKey(col, row));
      pen.setTime(time);
      ctx.save();
      ctx.translate(col * PITCH_X, row * PITCH_Y);
      // The eye offset carries this window's origin seen from the global
      // eye: s·(w + p − camera) + eye·(s−1) — the wall plane stays pinned,
      // nearer layers drift by depth while the camera pans.
      drawWindow(
        ctx,
        pen,
        palette,
        {
          x: frame.eye.x + col * PITCH_X - this.camera.x,
          y: frame.eye.y + row * PITCH_Y - this.camera.y,
        },
      );
      ctx.restore();
    }
    ctx.restore();
  }
}
