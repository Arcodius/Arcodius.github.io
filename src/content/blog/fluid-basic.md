---
title: "Building a 2D Incompressible Fluid Solver"
description: "From the Euler equations to semi-Lagrangian advection and a staggered-grid pressure projection."
pubDate: 2026-09-19
tags: ["Fluid", "Math", "C++"]
cover: "/images/projects/fluid-study.svg"
coverAlt: "An abstract fluid simulation composed of blue streamlines and a red circle"
draft: true
---

A moving density image is easy to produce; a velocity field that satisfies incompressibility takes more care. This post develops the two numerical operations at the center of my solver: transport velocity through itself, then project the result onto a nearly divergence-free field. [Part II](./fluid-3d-cuda.md) follows the implementation into 3D and CUDA.

## Model and scope

For constant density $\rho$, the incompressible Navier–Stokes equations are

$$
\frac{\partial\mathbf{u}}{\partial t}+(\mathbf{u}\cdot\nabla)\mathbf{u}
=-\frac{1}{\rho}\nabla p+\nu\nabla^2\mathbf{u}+\mathbf{f},
\qquad \nabla\cdot\mathbf{u}=0.
$$

Here $\mathbf{u}$ is velocity, $p$ is pressure, $\nu$ is kinematic viscosity, and $\mathbf{f}$ is acceleration from external forces. In the basic inviscid model I omit viscosity ($\nu=0$) and simulate transport plus pressure projection. Setting $\nabla\cdot\mathbf{u}=0$ says that the field has no local net outflow; it does **not** remove the nonlinear advection term $(\mathbf{u}\cdot\nabla)\mathbf{u}$. A source may prescribe velocity to keep the flow moving; this is distinct from implementing a general force term.

The solver also transports a scalar density $d$:

$$
\frac{\partial d}{\partial t}+\mathbf{u}\cdot\nabla d=0.
$$

This density makes the flow visible. In this model it is a passive tracer: it does not feed back into momentum. In particular, the current implementation is not a temperature-driven or buoyant smoke solver.

## Where values live: the MAC grid

On a uniform grid with spacing $h$, pressure and density sit at cell centers. Horizontal velocity $u$ sits on vertical cell faces, while vertical velocity $v$ sits on horizontal faces. For a cell $(i,j)$, the discrete divergence is the net face flux divided by $h$:

$$
(D\mathbf{u})_{i,j}=
\frac{u_{i+1,j}-u_{i,j}}{h}
+\frac{v_{i,j+1}-v_{i,j}}{h}.
$$

Pressure differences act on the **same faces**:

$$
u_{i,j}\leftarrow u_{i,j}-\frac{\Delta t}{\rho h}(p_{i,j}-p_{i-1,j}),
\qquad
v_{i,j}\leftarrow v_{i,j}-\frac{\Delta t}{\rho h}(p_{i,j}-p_{i,j-1}).
$$

These two discrete operators fit together: the pressure correction changes precisely the fluxes measured by divergence. The grids therefore have different sizes: for $N_x\times N_y$ cells, $u$ has $(N_x+1)\times N_y$ values, $v$ has $N_x\times(N_y+1)$, and pressure has $N_x\times N_y$.

## Stage 1: trace backward to advect velocity

For each velocity face at position $\mathbf{x}$, sample the **old** velocity field to estimate where the fluid came from:

$$
\mathbf{x}_{\mathrm{dep}}=\mathbf{x}-\Delta t\,\mathbf{u}^n(\mathbf{x}),
\qquad
\mathbf{u}^{*}(\mathbf{x})\approx\mathbf{u}^n(\mathbf{x}_{\mathrm{dep}}).
$$

Because the two components live at different positions, the vector $\mathbf{u}^n(\mathbf{x})$ first needs interpolation from both staggered grids. The transported component is then sampled from **its own** grid at the departure point. Reading from the old grids and writing to separate grids prevents updated values from contaminating other samples.

The implementation uses a single backward Euler trace and linear interpolation. This semi-Lagrangian step tolerates large displacements without the usual explicit-advection instability, but interpolation smooths small features. It is not an accuracy guarantee for an arbitrarily large $\Delta t$. Coordinates falling outside the sampled array are clamped to its edge in the current CUDA implementation; boundary faces are subsequently corrected.

## Stage 2: pressure projection

Advection and source injection generally leave an intermediate velocity $\mathbf{u}^{*}$ with nonzero divergence. Correct it by subtracting a pressure gradient:

$$
\mathbf{u}^{n+1}=\mathbf{u}^{*}-\frac{\Delta t}{\rho}\nabla p.
$$

Taking divergence and requiring $\nabla\cdot\mathbf{u}^{n+1}=0$ yields

$$
\nabla^2p=\frac{\rho}{\Delta t}\nabla\cdot\mathbf{u}^{*}.
$$

The discrete version uses the face-flux divergence $D$ and cell-pressure gradient $G$: $DGp=(\rho/\Delta t)D\mathbf{u}^{*}$. At an interior 2D cell, the standard five-point stencil gives

$$
p_{i,j}^{(k+1)}=
\frac{p_{i-1,j}^{(k)}+p_{i+1,j}^{(k)}+p_{i,j-1}^{(k)}+p_{i,j+1}^{(k)}
-h^2(\rho/\Delta t)(D\mathbf{u}^{*})_{i,j}}{4}.
$$

This is one Jacobi iteration, not a complete pressure solve. A finite iteration count leaves a residual, so the projected velocity is only **approximately** divergence-free. For a closed box, the normal component of velocity at domain walls is zero. The pressure update must use a compatible zero-normal-gradient condition there; conceptually, a missing neighbor copies the boundary cell pressure. Pressure is defined only up to an additive constant. This does not affect its gradient.

In compact form, the central steps are:

```cpp
advectVelocity(dt);               // sample the old velocity into new grids
injectSources();                  // if the experiment uses a source
enforceNormalVelocityBoundary();
computeDivergence();             // div of the intermediate velocity
solvePressure(dt, iterations);   // iterative Poisson solve
applyPressureGradient(dt);       // project velocity
advectDensity(dt);               // passive scalar, using corrected velocity
```

This is explanatory pseudocode; [Part II](./fluid-3d-cuda.md) shows calls and snippets from the current 3D CUDA implementation. In particular, source injection in that code happens after velocity advection and before projection.

## What to check

A density image alone cannot establish that projection worked. A useful diagnostic is the divergence **after** applying the pressure gradient, compared with divergence immediately before it. Record both a maximum absolute value and an RMS value over cells, along with grid size, $h$, $\Delta t$, boundary rule, and iteration count. A pressure residual, $\|DGp-(\rho/\Delta t)D\mathbf{u}^{*}\|$, additionally tells whether the iterative solve has converged. Recompute divergence after projection for this test; a stored pre-projection divergence is not that measurement.

The initial [2D demo](https://arcodius.github.io/demo/mini-fluid/) motivated this implementation. It illustrates the result, while the numerical checks above provide stronger evidence about the solver itself.

## References

- Jos Stam, [*Stable Fluids*](https://www.dgp.toronto.edu/~stam/reality/Research/pub.html), SIGGRAPH 1999.
- Robert Bridson, [*Fluid Simulation for Computer Animation* course notes](https://www.cs.ubc.ca/~rbridson/fluidsimulation/), SIGGRAPH 2007.
