---
title: "2D Fluid Lab"
summary: "A 2D incompressible fluid experiment built from scratch to study advection, pressure projection, and boundary conditions."
year: 2026
status: "in-progress"
tags: ["C++", "Simulation", "Numerical Methods"]
cover: "/images/projects/fluid-study.svg"
coverAlt: "An abstract fluid simulation composed of blue streamlines and a red circle"
featured: true
links: []
---

## Project goal

The goal of this experiment is not merely to produce an effect that looks like smoke, but to understand the role of every numerical step in a basic incompressible fluid solver.

![Diagram of the fluid experiment](/images/projects/fluid-detail.svg)

## Current implementation

- Store velocity and scalar fields on a regular MAC grid.
- Advect velocity and dye with a semi-Lagrangian method.
- Solve the pressure Poisson equation and project onto a divergence-free velocity field.
- Visualize divergence, pressure, and per-frame error.

## The question I care about

Semi-Lagrangian advection is very stable, but it introduces visible numerical dissipation. The next step is therefore to compare it with a MacCormack-corrected result and document the tradeoff between stability and detail preservation.

> To display a GIF, place it in `public/images/projects/` and embed it like any other image: `![Description](/images/projects/demo.gif)`.
