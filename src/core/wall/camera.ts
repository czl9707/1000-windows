// Pan inertia: the release glide. Velocity decays exponentially under
// friction; the camera advances by the decay's exact integral, so the
// physics is deterministic in (camera, velocity, dt) — no hidden state.
import type { Camera } from './grid';

export type Velocity = Camera;

export const FRICTION = 4;

// Below this speed a glide snaps to rest rather than crawling forever.
export const REST_VELOCITY = 0.05;

export function glide(
  camera: Camera,
  velocity: Velocity,
  dt: number,
  friction: number = FRICTION,
): { camera: Camera; velocity: Velocity } {
  if (Math.hypot(velocity.x, velocity.y) < REST_VELOCITY) {
    return { camera, velocity: { x: 0, y: 0 } };
  }
  const decay = Math.exp(-friction * dt);
  const step = (1 - decay) / friction;
  return {
    camera: { x: camera.x + velocity.x * step, y: camera.y + velocity.y * step },
    velocity: { x: velocity.x * decay, y: velocity.y * decay },
  };
}
