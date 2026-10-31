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
  core/                      The drawing engine, independent of any chapter:
                             randomness/ (hash, generator, seeded wrapper),
                             pen/ (deterministic hand tremor: Pen, tuning),
                             and window-shell/ (the window scene).
  components/                Site UI. DemoCanvas.astro (demo frame +
                             mount script), DemoCanvasControls.tsx (shared
                             sliders island), mount.ts (demo dispatch),
                             layouts/, ui/.
  pages/                     index.astro and docs/[...slug].astro.
  lib/                       Site-level helpers (theme, constants).
```

## Rules that hold the structure together

- **Import direction:** `chapters → core →` (nothing); site UI
  (`components/`) never imports from `core/`. Chapters may import the demo
  runtime in `components/` (`mount.ts`, the controls island's types). No
  component imports a chapter by name: `DemoCanvas.astro` discovers the
  chapters' demo modules with a build-time glob, and each demo module
  registers itself on import — so no central list of demos exists.
- **Adding a demo:** the painter lives beside its chapter and ends in
  `registerDemo('<kind>', <mount fn>)` (from `components/mount.ts`); the
  chapter's MDX places `<DemoCanvas demo="<kind>">`. Nothing else changes.
  A tunable demo implements `TuningHandle` so the shared controls island
  can drive it.
- **New chapter:** create `src/content/chapters/NN-<name>/index.mdx` — the
  `NN-` prefix sets the reading order — with `title` and `status`
  frontmatter; no config change needed.
- **Design tokens:** UI code uses the theme tokens from `src/styles/global.css`
  (`--color-*`, `--typography-*`), never raw fonts or colors.
- **Verification:** `npx tsc --noEmit && npx astro build` after any change.
