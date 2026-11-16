// The light's entry — one base shape per layer module: expandLight rolls
// the layer's plan, LampPlan is the plan the roll returns. The light has no
// stream-consuming draw on the entry: the walk in window.ts carries the
// plan itself, because the furniture block reads the lamp's presence, and
// draws it through the child drawer. Anything else (catalogue constants,
// the pinned-plan drawer) lives on the child modules; import it there
// directly.
export { expandLight } from './light';
export type { LampPlan } from './light';
