// The sill catalogue: pure data. Everything here is decided in the wayfinder
// ticket "Sill items — clutter on the inside ledge"; the numbers are constants
// of the drawing, the weights of the street.
//
// Roll order in the sill block (append new rolls at the end, never between):
// side → kind → the item's rolls — width jitter, book count, plant
// vocabulary. The `none` side is the empty ledge — an empty ledge rolls
// nothing further and draws no item.
//
// The sill layer sits between the curtain and the insider layer: its block
// appends to the DNA stream after the curtain's, unconditionally — a mug
// with no curtain is a fine tenant.

export type SillSide = 'left' | 'right';

// One roll decides presence and corner: half of all sills stand empty, and
// a present item anchors into its rolled corner. No free placement.
export const SIDES: readonly { value: SillSide | 'none'; weight: number }[] = [
  { value: 'left', weight: 1 },
  { value: 'right', weight: 1 },
  { value: 'none', weight: 2 },
];

export type SillKind = 'books' | 'mug' | 'jars' | 'plant' | 'clock';

// The everyday things common, the clock the rare one — one item per sill at
// most, every kind one flat side-silhouette construction. The plant carries
// double the jars' weight: the greenest windows should be common.
export const KINDS: readonly { value: SillKind; weight: number }[] = [
  { value: 'books', weight: 3 },
  { value: 'mug', weight: 3 },
  { value: 'jars', weight: 2 },
  { value: 'plant', weight: 4 },
  { value: 'clock', weight: 1 },
];

// The plant vocabulary, picked uniformly once the sill kind lands on plant.
export type PlantKind = 'rubber' | 'snake' | 'split' | 'cactus' | 'palm' | 'herb' | 'flowering';

export const PLANT_KINDS: readonly { value: PlantKind; weight: number }[] = [
  { value: 'rubber', weight: 1 },
  { value: 'snake', weight: 1 },
  { value: 'split', weight: 1 },
  { value: 'cactus', weight: 1 },
  { value: 'palm', weight: 1 },
  { value: 'herb', weight: 1 },
  { value: 'flowering', weight: 1 },
];

// The silhouette's width jitters around its kind constant, so two windows
// of the same kind never match item for item.
export const WIDTH_JITTER = { min: 0.9, max: 1.1 } as const;

// The row's book count, rolled after the width jitter. The plant vocabulary
// is the block's last roll; appended layers come after the block, never
// between its rolls.
export const BOOK_COUNT_RANGE = { min: 3, max: 6 } as const;

// The anchored item's gap from the inner jamb — wide enough that the item
// never reads as stuck to the frame.
export const CORNER_INSET = 0.09;

// The books tuck into the side frame instead: the row's outer end slides
// past the opening's inner edge so the jamb cuts it, the same treatment
// the base gets from the bottom rail. Stays under the thinnest face, so
// the frame always covers the tuck.
export const SIDE_TUCK = 0.02;

// The base sinks this far past the opening's inner edge, behind the frame's
// bottom rail — the outer frame runs at the sill's level, so an item
// standing on the indoor ledge shows its base cut by the rail. The overlap
// stays under the thinnest face, so the rail always covers it.
export const LEDGE_OVERLAP = 0.02;

// The ledge: a unit-measure depth a hair off the wall plane, in front of
// the curtain cloth and behind the pane wash — a fully closed curtain never
// hides the item, the glass wash always covers it. The tenant walk guards
// the between-layers ordering; these values are its middle rung.
export const SILL_ITEM_DEPTH = -0.03;
// Sort bucket only, between the curtain's cloth bucket and the shell's
// glass bucket. A catalogue value must never reach the points.
export const SILL_ITEM_Z = -2;
