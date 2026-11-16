---
title: Land the furniture layer
labels: [wayfinder:task]
assignee: zane
state: closed
blocked-by: [018]
---

## Question

Build the furniture layer to the resolution on [Furniture — the room behind the glass](018-furniture.md): the room rectangle with its floor, the six depth planes with the lamp pinned to plane 1, the five-kind catalogue, the uniform gray silhouette construction with its two roles, and the draw order from the planes back to the sill. TDD with both reviews per step, merged to `main` as the milestone lands. No chapter (user decision on ticket 018) — a prototype page as the eyeball bench, human eyeball on the wall before merge.

## Progress

Built on `furniture-build` through five reviewed TDD steps (2026-11-15): the gray role in styling, the plan roll in `src/core/furniture/`, the drawer with the room rectangle and the twelve constructions, the `windowSceneMarks` assembly appending after the light, and the eyeball bench. Bench rounds then flattened the layer to the one gray silhouette, moved the floor onto the lamps' standing line, pushed the interior clip into the draw stage's aperture so the drift never bares a cut at any eye offset, and raised the desk so its slab reads under its screen. Human eyeball passed on the bench; the layer lands on `main`. The bench itself — the judging sheet with the `?kind=` and `?theme=` pins — lives on as the primary source on the throwaway branch `prototype/furniture-bench`, out of `main`.
