---
title: Pointer attention — tenants notice the gaze
labels: [wayfinder:prototype]
assignee:
state: closed
blocked-by: [005, 006]
---

## Question

What does a tenant do when the pointer rests on their window? Decide and prototype the reaction vocabulary: which reactions exist (curtain twitch, lamp dims — a shy tenant, silhouette steps closer to the glass — a curious one, a cat appears on the sill), how a tenant's personality gene picks their reaction, how attention decays when the pointer leaves, and what it costs per frame with dozens of windows live. Deliverable: a pannable wall strip where hovering windows reacts per tenant personality. Run the prototype skill; the human judges whether the wall feels watched or alive.

## Resolution

Closed 2026-11-02 by user decision. The wall chapter ([Build the home wall](012-build-home-wall.md), landed as `06-the-wall`) is where the pointer's role ends for now: the pointer enters only as the eye offset that drives the parallax, on the demo through the injectable resolver and on the home wall as the canvas's real position. No separate per-tenant reaction layer exists in the engine. The reaction vocabulary the question named — curtain twitch, lamp dims, silhouette stepping to the glass, a personality gene picking between them — waits with the idle-motion vocabulary in the map's "Not yet specified", to be specified once tenants have idle lives to interrupt.
