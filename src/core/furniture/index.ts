// The furniture's entry — one base shape per layer module: expandFurniture
// rolls the layer's plan, furnitureMarks draws it off the live DNA stream,
// FurniturePlan is the plan the roll returns. Anything else (catalogue
// constants, the constructions, the room rectangle) lives on the child
// modules; import it there directly.
import type { Mark } from '@/core/scene';
import type { Rng } from '@/core/randomness/rng';
import type { PaneRect } from '@/core/window-shell/shell';
import { expandFurniture } from './furniture';
import { drawFurniture } from './drawFurniture';
import type { FurniturePlan } from './furniture';

export { expandFurniture } from './furniture';
export type { FurniturePlan } from './furniture';

export function furnitureMarks(rng: Rng, lampOwned: boolean, opening: PaneRect): Mark[] {
  return drawFurniture(expandFurniture(rng, lampOwned), opening);
}
