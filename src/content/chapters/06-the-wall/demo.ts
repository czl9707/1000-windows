// The pointer stands in for where this canvas sits relative to the screen's
// centre, the same stand-in the motion chapter uses — on the home wall that
// offset is the canvas's real position. Panning lives on the home page; this
// is the wall at rest.
import { createDemoLoop, cssBox, trackPointerEye } from '@/components/demoLoop';
import { registerDemo, type ReseedHandle } from '@/components/mount';
import { PITCH_X, PITCH_Y } from '@/core/wall/grid';
import { Wall } from '@/core/wall/wall';

const STRIP_COLS = 3;
const STRIP_ROWS = 2;
const STRIP_SEED = 1335613256;

const STRIP_CELLS = [
  { col: -1, row: -1 },
  { col: 0, row: -1 },
  { col: 1, row: -1 },
  { col: -1, row: 0 },
  { col: 0, row: 0 },
  { col: 1, row: 0 },
];

function mountWallStrip(canvas: HTMLCanvasElement): ReseedHandle {
  const wall = new Wall(STRIP_SEED);
  // The two rows sit at y = −2 and 0; a camera half a pitch up centres the
  // 3 × 2 frame on the canvas.
  wall.camera = { x: 0, y: -PITCH_Y / 2 };

  const pointer = trackPointerEye(canvas, STRIP_COLS * PITCH_X, STRIP_ROWS * PITCH_Y);

  const loop = createDemoLoop(
    canvas,
    (ctx, time, colors, eye) => {
      const box = cssBox(canvas);
      // The camera sits still, so the extent spills over into wall wherever
      // the canvas is not exactly 9 × 4 units.
      const unit = Math.min(box.width / (STRIP_COLS * PITCH_X), box.height / (STRIP_ROWS * PITCH_Y));
      wall.draw(ctx, box, { unit, eye, cells: STRIP_CELLS }, time, colors);
    },
    pointer.eye,
  );

  return {
    reseed(value) {
      wall.reseed(value);
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
