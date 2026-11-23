// The pointer stands in for where this canvas sits relative to the screen's
// centre, the same stand-in the motion chapter uses — on the home wall that
// offset is the canvas's real position. Panning lives on the home page; this
// is the wall at rest.
//
// The strip composes the wall from the module's exported pieces — the
// culling, the pen lifecycle, the texture — the way the engine's own draw
// does, at a fixed rest camera. At chapter 06's scope a window is its bare
// shell; the tenants and the colourways land in later chapters.
import { createDemoLoop, cssBox, trackPointerEye } from '@/components/demoLoop';
import { registerDemo, type ReseedHandle } from '@/components/mount';
import { Pen } from '@/pen/pen';
import { DEFAULT_TUNING } from '@/pen/tuning';
import type { Theme } from '@/styling/roles';
import { windowPalette } from '@/styling/colourway';
import { mockPalette } from '@/content/chapters/mock/palette';
import { windowSeed } from '@/core/randomness/rng';
import { execute } from '@/core/scene';
import { makeProjection, type Eye } from '@/motion/projection';
import { expandShell, shellMarks } from '@/core/window-shell';
import { PITCH_X, PITCH_Y, visibleCells, type Camera } from '@/core/wall';
import { pairFrom, pairKey } from '@/core/wall/pens';
import { PenLedger } from '@/core/wall/ledger';
import { drawWallSurface, slotPenSeed } from '@/core/wall/texture';

const STRIP_COLS = 3;
const STRIP_ROWS = 2;
const STRIP_SEED = 1335613256;

// The two rows sit at y = −2 and 0; a camera half a pitch up centres the
// 3 × 2 frame on the canvas.
const REST_CAMERA: Camera = { x: 0, y: -PITCH_Y / 2 };

function mountWallStrip(canvas: HTMLCanvasElement): ReseedHandle {
  let metaSeed = STRIP_SEED;
  const cellPens = new PenLedger((key) => {
    const [col, row] = pairFrom(key);
    return new Pen({ ...DEFAULT_TUNING }, windowSeed(metaSeed, col, row));
  });
  const slotPens = new PenLedger((key) => {
    const [si, ti] = pairFrom(key);
    return new Pen({ ...DEFAULT_TUNING }, slotPenSeed(metaSeed, si, ti));
  });

  const pointer = trackPointerEye(canvas, STRIP_COLS * PITCH_X, STRIP_ROWS * PITCH_Y);

  const loop = createDemoLoop(
    canvas,
    (ctx, time, theme: Theme, eye) => {
      const box = cssBox(canvas);
      // The camera sits still, so the extent spills over into wall wherever
      // the canvas is not exactly 9 × 4 units.
      const unit = Math.min(box.width / (STRIP_COLS * PITCH_X), box.height / (STRIP_ROWS * PITCH_Y));
      const extentW = box.width / unit;
      const extentH = box.height / unit;

      const cells = visibleCells(REST_CAMERA, extentW, extentH);
      cellPens.sync(cells.map((c) => pairKey(c.col, c.row)));

      ctx.save();
      ctx.scale(box.dpr * unit, box.dpr * unit);
      ctx.translate(box.width / (2 * unit) - REST_CAMERA.x, box.height / (2 * unit) - REST_CAMERA.y);

      // The wall surface rides the engine's palette pipe: the strip
      // resolves the palette, the surface dresses itself from it, so a
      // theme switch fades paper and texture with the windows.
      drawWallSurface(
        ctx,
        REST_CAMERA,
        extentW,
        extentH,
        metaSeed,
        slotPens,
        time,
        windowPalette(metaSeed, theme),
      );

      for (const { col, row } of cells) {
        const pen = cellPens.get(pairKey(col, row));
        pen.setTime(time);
        ctx.save();
        ctx.translate(col * PITCH_X, row * PITCH_Y);
        // The eye offset carries this window's origin seen from the global
        // eye: s·(w + p − camera) + eye·(s−1) — the wall plane stays pinned,
        // nearer layers drift by depth.
        const cellEye: Eye = {
          x: eye.x + col * PITCH_X - REST_CAMERA.x,
          y: eye.y + row * PITCH_Y - REST_CAMERA.y,
        };
        execute(
          shellMarks(expandShell(windowSeed(metaSeed, col, row))),
          pen,
          ctx,
          mockPalette(theme),
          makeProjection(cellEye),
        );
        ctx.restore();
      }
      ctx.restore();
    },
    pointer.eye,
  );

  return {
    reseed(value) {
      metaSeed = Math.round(value);
      cellPens.clear();
      slotPens.clear();
      loop.repaint();
      loop.notify();
    },
    destroy: () => {
      pointer.unbind();
      loop.destroy();
    },
  };
}

registerDemo('wall-strip', mountWallStrip);
