# AGENTS.md

Astro 7 + MDX docs site for "Paint 1000 windows": an infinite hand-drawn wall
of windows, documented chapter by chapter, each chapter embedding the live
code as a demo canvas. The domain vocabulary lives in `GLOSSARY.md`; the
reference project's mechanisms and their facade equivalents are digested in
`docs/reference-digest.md`.

## Layout

```
src/
  content/chapters/          One folder per chapter, named NN-<name> — the
                             prefix is the chapter's order, the name the
                             route (/docs/<name>). Inside: index.mdx plus the
                             chapter's code (params.ts, demo.ts, …).
  core/                      Scene geometry, independent of any chapter:
                             randomness/ (hash, generator, seeded wrapper),
                             scene/ (marks: emitted drawing instructions in 3D),
                             window.ts (the per-window entry: seed → marks →
                             pen), window-shell/ (the window scene's
                             catalogues and drawers), and wall/ (the wall
                             engine: grid, camera, texture, pens, the Wall
                             entrypoint, the pan gestures).
  pen/                       The deterministic hand tremor: Pen, tuning.
  motion/                    Placement: weak-perspective projection; grows the
                             pointer parallax.
  styling/                   Ink roles, the palette, and wash constants.
  components/                Site UI. DemoCanvas.astro (demo frame +
                             mount script), DemoCanvasControls.tsx (shared
                             sliders island), mount.ts (demo dispatch),
                             layouts/, ui/.
  pages/                     index.astro (the home wall's painter lives in its
                             script, beside its only canvas) and
                             docs/[...slug].astro.
  lib/                       Site-level helpers (theme, constants).
```

## Rules that hold the structure together

- **Import direction:** chapters sit on top of the engine folders
  (`core/`, `pen/`, `motion/`, `styling/`); within the engine, calls only
  go toward leaf modules — core uses `pen/`, `motion/`, `styling/`, and
  `pen/` and `motion/` use core's `randomness/` (motion also takes pen's
  `Pt` type: the projection returns the 2D points the pen draws) — never a
  cycle, never a chapter reached from below. Site UI (`components/`) never
  imports from the engine. Chapters and pages may import the demo runtime
  in `components/` (`mount.ts`, the controls island's types). No component
  imports a chapter by name: `DemoCanvas.astro` discovers the chapters'
  demo modules with a build-time glob, and each demo module registers
  itself on import — so no central list of demos exists.
- **Adding a demo:** the painter lives beside its chapter and ends in
  `registerDemo('<kind>', <mount fn>)` (from `components/mount.ts`); the
  chapter's MDX places `<DemoCanvas demo="<kind>">`. Nothing else changes.
  A tunable demo implements `TuningHandle` so the shared controls island
  can drive it. The home wall is the one demo outside a chapter: its
  painter lives in `pages/index.astro` and the page mounts it through the
  same runtime.
- **New chapter:** create `src/content/chapters/NN-<name>/index.mdx` — the
  `NN-` prefix sets the reading order — with `title` and `status`
  frontmatter; no config change needed.
- **Design tokens:** UI code uses the theme tokens from `src/styles/global.css`
  (`--color-*`, `--typography-*`), never raw fonts or colors.
- **Verification:** `npx tsc --noEmit && npx astro build` after any change.
