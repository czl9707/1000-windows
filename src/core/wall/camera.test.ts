import { describe, expect, it } from 'vitest';
import { glide, REST_VELOCITY } from './camera';

describe('glide', () => {
  it('decays the velocity exponentially and advances the camera by its exact integral', () => {
    const out = glide({ x: 0, y: 0 }, { x: 10, y: 0 }, 0.1);
    expect(out.velocity.x).toBeCloseTo(10 * Math.exp(-0.4), 10);
    expect(out.camera.x).toBeCloseTo((10 * (1 - Math.exp(-0.4))) / 4, 10);
    expect(out.camera.y).toBe(0);
    expect(out.velocity.y).toBe(0);
  });

  it('carries both axes independently', () => {
    const out = glide({ x: 1, y: -2 }, { x: 4, y: -8 }, 0.25);
    expect(out.camera.x).toBeCloseTo(1 + (4 * (1 - Math.exp(-1))) / 4, 10);
    expect(out.camera.y).toBeCloseTo(-2 + (-8 * (1 - Math.exp(-1))) / 4, 10);
  });

  it('settles: the glide comes to rest and stays there', () => {
    let camera = { x: 0, y: 0 };
    let velocity = { x: 10, y: -6 };
    for (let i = 0; i < 300; i++) {
      ({ camera, velocity } = glide(camera, velocity, 1 / 60));
    }
    expect(velocity).toEqual({ x: 0, y: 0 });
    const atRest = camera;
    for (let i = 0; i < 60; i++) {
      ({ camera, velocity } = glide(camera, velocity, 1 / 60));
    }
    expect(camera).toBe(atRest);
  });

  it('a glide slower than the rest threshold never starts', () => {
    const out = glide({ x: 3, y: 4 }, { x: REST_VELOCITY / 2, y: 0 }, 1 / 60);
    expect(out.velocity).toEqual({ x: 0, y: 0 });
    expect(out.camera).toEqual({ x: 3, y: 4 });
  });
});
