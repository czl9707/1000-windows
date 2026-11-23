import { describe, expect, it } from 'vitest';
import { visibleCells } from './grid';
import { recordingCtx, stubWallImage } from './test-support';
import { Wall } from './index';

stubWallImage();

const channels = (css: string) => css.match(/\d+/g)!.map(Number);

describe('Wall.draw', () => {
  const DAY = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)', isNight: false, transitionMs: 600 };
  const NIGHT = { ink: 'rgb(255 255 255)', paper: 'rgb(10 10 10)', isNight: true, transitionMs: 600 };

  it('paints the wall surface through the fading palette', () => {
    const wall = new Wall(91234);
    const box = { width: 320, height: 200, dpr: 1 };
    const frame = {
      unit: 40,
      eye: { x: 0, y: 0 },
      cells: visibleCells(wall.camera, box.width / 40, box.height / 40),
    };

    wall.draw(recordingCtx().ctx, box, frame, 0, DAY, 0);
    const flip = recordingCtx();
    wall.draw(flip.ctx, box, frame, 0, NIGHT, 0);
    const mid = recordingCtx();
    wall.draw(mid.ctx, box, frame, 1, NIGHT, 300);
    const done = recordingCtx();
    wall.draw(done.ctx, box, frame, 2, NIGHT, 600);

    // The base fill is the first fillStyle each draw lays down; it fades
    // with the same clock the windows fade on, never snapping.
    const base = (r: { fills: string[] }) => channels(r.fills[0]);
    const before = base(flip);
    const half = base(mid);
    const after = base(done);
    expect(after).toEqual(channels(NIGHT.paper));
    for (let i = 0; i < 3; i++) {
      const lo = Math.min(before[i], after[i]);
      const hi = Math.max(before[i], after[i]);
      expect(half[i]).toBeGreaterThan(lo);
      expect(half[i]).toBeLessThan(hi);
    }
  });
});
