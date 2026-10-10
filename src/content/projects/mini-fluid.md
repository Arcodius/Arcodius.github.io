---
title: "Mini Fluid"
summary: "An incompressible fluid solver built from scratch, from a 2D CPU prototype to a 3D CUDA implementation."
year: 2026
startDate: 2026-09-01
status: "in-progress"
tags: ["C++", "CUDA", "Fluid Simulation", "Numerical Methods"]
cover: "/images/projects/mini-fluid/first.png"
coverAlt: "A fluid jet in the 2D simulation"
featured: true
links: []
---

## Project Goal

I built this project to understand fluid simulation by implementing advection, boundary conditions, and pressure projection, then extending the solver from 2D to 3D on the GPU.

## Current Results

The solver stores velocity on a staggered MAC grid and advects velocity and dye with a semi-Lagrangian method. It solves a pressure Poisson equation with Jacobi iterations and uses the result to reduce velocity divergence. The 3D CUDA version currently visualizes density through slices.

<video autoplay muted loop playsinline preload="metadata">
  <source src="/videos/mini-fluid/first.mp4" type="video/mp4" />
  Your browser does not support HTML video.
</video>

![Divergence visualization](/images/projects/mini-fluid/divergence.png)

![Slices of 3D fluid density](/images/blogs/fluid_slices.png)

On a 64 × 64 × 32 grid, preliminary measurements put the CUDA simulation step at 2.84 ms versus 126.15 ms for the CPU version—approximately **44× faster**.