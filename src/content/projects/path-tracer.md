---
title: "Path Tracing Studies"
summary: "A series of small scenes for understanding ray intersections, material sampling, and Monte Carlo integration."
year: 2026
status: "in-progress"
tags: ["Rendering", "C++", "Monte Carlo"]
cover: "/images/projects/path-tracer.svg"
coverAlt: "A blue sphere, yellow rays, and red geometry on a black background"
featured: true
links: []
---

## Starting with a single ray

This is a progressive series of path tracing experiments. I began with a basic camera and sphere intersections, then gradually added materials, direct lighting, and multiple bounces.

![Geometric diagram for the path tracing study](/images/projects/path-tracer-detail.svg)

## Learning path

1. Build a testable geometry-intersection layer.
2. Decouple BSDF sampling from scene geometry.
3. Add next-event estimation to reduce variance in direct lighting.
4. Record the relationship between sample count, noise, and render time.

The final goal is not a feature-complete renderer, but a clear account of where each estimator comes from and how it is biased.
