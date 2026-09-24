---
title: "2D Fluid Lab"
summary: "A 2D incompressible fluid experiment built from scratch to study advection, pressure projection, and boundary conditions."
year: 2026
startDate: 2026-09-01
status: "in-progress"
tags: ["C++", "Simulation", "Numerical Methods"]
cover: "/images/projects/mini-fluid/first.png"
coverAlt: "A fluid jet with no external forces"
featured: true
links: []
---

## Project Goal

The goal of this experiment is to understand the fundamentals of modern fluid simulation and the key challenges involved in building a fluid solver.

## Current Implementation

- Store velocity and scalar fields on a regular MAC grid.
- Advect velocity and dye with a semi-Lagrangian method.
- Solve the pressure Poisson equation and project onto a divergence-free velocity field.
- Visualize divergence, pressure, and per-frame error.

<video autoplay muted loop playsinline preload="metadata">
  <source src="/videos/mini-fluid/first.mp4" type="video/mp4" />
  Your browser does not support HTML video.
</video>

![Divergence Visualization](/images/projects/mini-fluid/divergence.png)

## Questions and Next Steps

- Semi-Lagrangian advection is very stable, but it introduces visible numerical dissipation. My next step is to compare it with a MacCormack-corrected scheme and document the tradeoff between stability and detail preservation.
- The current Euler integration scheme should be replaced with a higher-order method, such as a Runge–Kutta scheme.
- My current goal is to support free-surface fluids.
