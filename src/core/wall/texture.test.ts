import { describe, expect, it } from 'vitest';
import { windowPalette } from '@/styling/colourway';
import { recordingCtx, recordingSlotPens, stubWallImage } from './test-support';
import { drawWallSurface } from './texture';

stubWallImage();

describe('drawWallSurface', () => {
  it('fills the paper base with the palette and strokes every patch in the palette ink', () => {
    const theme = { ink: 'rgb(33 37 41)', paper: 'rgb(229 222 214)', night: 0, transitionMs: 0 };
    const palette = windowPalette(424242, theme);
    const { pens, colors } = recordingSlotPens((key) =>
      3100 + [...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0),
    );

    const { ctx, fills } = recordingCtx();
    drawWallSurface(ctx, { x: 0, y: 0 }, 4, 3, 424242, pens, 0, palette, 0);

    expect(fills[0]).toBe(theme.paper);
    expect(colors.length).toBeGreaterThan(0);
    for (const color of colors) expect(color).toBe(palette('ink').color);
  });
});
