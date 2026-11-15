// The furniture's entry — one base shape per layer module: expandFurniture
// rolls the layer's plan, FurniturePlan is the plan the roll returns. The
// drawing entry lands with the drawer; anything else (catalogue constants,
// the constructions, the room rectangle) lives on the child modules; import
// it there directly.
export { expandFurniture } from './furniture';
export type { FurniturePlan } from './furniture';
