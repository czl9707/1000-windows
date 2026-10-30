---
title: Astro docs scaffold — MDX chapters hosting the demo
labels: [wayfinder:task]
assignee: zane
state: open
blocked-by: []
---

## Question

Stand up the site shell that every later milestone publishes into: Astro + MDX + CSS modules + Radix, in this repo. Decisions to make while doing it: page structure (home + chapter pages, one chapter per milestone); the pattern for embedding the zero-dependency demo engine in an MDX page (Astro `<script>` mounting `src/demo/` onto a canvas); dev/build commands. Resolved when a chapter page renders with an empty demo canvas mounted from `src/demo/`.
