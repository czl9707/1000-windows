---
title: Astro docs scaffold — MDX chapters hosting the demo
labels: [wayfinder:task]
assignee: zane
state: closed
blocked-by: []
---

## Question

Stand up the site shell that every later milestone publishes into: Astro + MDX + CSS modules + Radix, in this repo. Decisions to make while doing it: page structure (home + chapter pages, one chapter per milestone); the pattern for embedding the zero-dependency demo engine in an MDX page (Astro `<script>` mounting `src/demo/` onto a canvas); dev/build commands. Resolved when a chapter page renders with an empty demo canvas mounted from `src/demo/`.

## Resolution

Built on Astro 7 (static output) with `@astrojs/mdx`, `@astrojs/react`, and `radix-ui`; verified with `npm run build`, `npm run check` (0 errors), and `astro preview` probes of all three pages. Styling reuses the portfolio's system wholesale: Geist Variable + Red Hat Mono Variable via fontsource, the token sheet in `src/styles/global.css` (typography/color/spacing/breakpoint custom-media), the postcss pipeline (`postcss.config.cjs` with global-data + custom-properties + custom-media), `Typography.astro` (polymorphic, variant-driven), and the fixed sliding header — simplified to brand + Chapters + Decisions links, no navigation menu. Dark theme is the default, matching the portfolio.

Structure decisions as approved (final state after the post-closure simplification):

- **Routes**: `/` home lists chapters from the collection with a draft/landed badge (full demo lives here later); `/docs/[slug]` renders each chapter, from `src/pages/docs/[...slug].astro`. Chapters are a content collection (`src/content/chapters/*.mdx`, schema `title`/`order`/`status: draft | landed`). The pen chapter exists as a draft already.
- **Shell**: header stays title (logo later) + portfolio theme toggle (`Button` + Radix icons, `data-theme` + localStorage, dark default). Chapter navigation moves to a left sidebar later (map fog item).
- **Demo embed pattern**: a chapter's MDX imports `DemoCanvas.astro`, which renders `<canvas data-demo>` and a `<script>` calling `mountAll()` from `src/demo/mount.ts` — engine stays vanilla TS under `src/demo/`, zero imports from site code. The mount is DPR-aware, runs an animation loop painting the theme-token ground, repaints on theme switch, and returns a destroy handle.
- **Radix island proven**: `DemoHint.tsx` (Tooltip, `client:visible`) hydrates inside the chapter MDX.
- Commands: `npm run dev` / `build` / `preview` / `check`, all Astro defaults; no deploy target chosen.

Two sessions worked this ticket concurrently; the second (this one) layered the approved styling and collection decisions onto the first's scaffold and closed it here.
