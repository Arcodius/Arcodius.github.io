---
title: "From a 3D MAC Grid to a CUDA Fluid Solver"
description: "Staggered-grid sampling, Jacobi pressure projection, GPU data flow, and an initial profile."
pubDate: 2026-10-09
tags: ["Fluid", "CUDA", "C++", "Performance"]
cover: "/images/projects/fluid-study.svg"
coverAlt: "An abstract fluid simulation composed of blue streamlines and a red circle"
draft: true
---

[Part I](./fluid-2d-principles.md) derived advection and pressure projection in 2D. Extending the equations to 3D is straightforward; implementing the extra velocity component, staggered coordinates, boundary faces, and repeated GPU pressure iterations is the interesting part. This post describes the current **inviscid, constant-density** CUDA solver, rather than features planned for later.

## 3D storage and coordinates

For $N_x\times N_y\times N_z$ cells of width $h$, pressure, divergence, and tracer density occupy cell centers. The three velocity arrays occupy faces:

| Field | Array dimensions | Physical position at index $(i,j,k)$ |
| --- | --- | --- |
| $u$ | $(N_x+1)\times N_y\times N_z$ | $(ih,(j+\tfrac12)h,(k+\tfrac12)h)$ |
| $v$ | $N_x\times(N_y+1)\times N_z$ | $((i+\tfrac12)h,jh,(k+\tfrac12)h)$ |
| $w$ | $N_x\times N_y\times(N_z+1)$ | $((i+\tfrac12)h,(j+\tfrac12)h,kh)$ |
| $p,d$ | $N_x\times N_y\times N_z$ | $((i+\tfrac12)h,(j+\tfrac12)h,(k+\tfrac12)h)$ |

Sampling a velocity vector at an arbitrary physical point requires **three different coordinate transforms**. This device helper encodes them:

```cpp
velocity_x = sampleTrilinear(u, x * inv_h,
                               y * inv_h - 0.5f, z * inv_h - 0.5f);
velocity_y = sampleTrilinear(v, x * inv_h - 0.5f,
                               y * inv_h, z * inv_h - 0.5f);
velocity_z = sampleTrilinear(w, x * inv_h - 0.5f,
                               y * inv_h - 0.5f, z * inv_h);
```

The offsets are not optional corrections: they map physical coordinates into each array's index space. `sampleTrilinear` clamps coordinates to the valid array range and interpolates eight values. Velocity advection launches the same templated kernel with `Component` equal to 0, 1, and 2; the template selects both the face position and the component to sample at the backtraced point. For example, a $u$ face starts at $(ih,(j+\tfrac12)h,(k+\tfrac12)h)$, traces back by $\Delta t\,\mathbf{u}$, then samples the old $u$ field using indices $(x/h,y/h-\tfrac12,z/h-\tfrac12)$. The three outputs go to separate arrays, which are swapped with the old arrays after all three launches.

Density uses the same idea at cell centers, but samples the corrected velocity and then the old density array at the departure point. Density is a passive visualization field, not the constant fluid mass density $\rho$ used in the pressure equation.

## One simulation step

The source sequence in `CudaFluidSolver::step` is:

```cpp
advectVelocity(dt);
addVelocitySource(1.0f);
addDensitySource(1.0f);
addForces(dt);                    // currently empty
enforceBoundaryVelocity();
computeDivergence();
solvePressure(dt, 100);
applyPressureGradient(dt);
advectDensity(dt);
```

The current source **sets** upward $v$ velocity in a Gaussian patch near the bottom and **sets** tracer density in a small bottom patch; it does not integrate a buoyancy force. Boundary kernels set the normal velocity on the six outer faces to zero. There are no internal obstacles in these files. A slice of density or stored divergence is copied from device to host for visualization; the current output is not volume rendering.

![Slices of 3D Fluid Densities](/images/blogs/fluid_slices.png)

## Discrete projection on the GPU

For each cell, the divergence kernel reads the two faces of every component:

$$
(D\mathbf{u})_{i,j,k}=\frac{u_{i+1,j,k}-u_{i,j,k}
+v_{i,j+1,k}-v_{i,j,k}+w_{i,j,k+1}-w_{i,j,k}}{h}.
$$

Pressure is reset to zero at the start of each step. Each Jacobi iteration reads the current pressure array and writes a different array; the arrays are then swapped. At an interior cell, the update is

$$
p_{i,j,k}^{(m+1)}=\frac{p_{i-1,j,k}^{(m)}+p_{i+1,j,k}^{(m)}
+p_{i,j-1,k}^{(m)}+p_{i,j+1,k}^{(m)}
+p_{i,j,k-1}^{(m)}+p_{i,j,k+1}^{(m)}
-h^2\frac{\rho}{\Delta t}(D\mathbf{u})_{i,j,k}}{6}.
$$

At an outer boundary the code clamps a neighbor index back onto the boundary cell. That duplicates the cell pressure in the six-term sum, implementing a zero-normal-gradient pressure condition consistent with a closed wall. The resulting pressure is used only through its differences across **interior** faces:

```cpp
// u face; v and w use the corresponding coordinate.
if (i == 0 || i >= pressure.nx) return;
velocity(i, j, k) -= dt * inv_rho * inv_h
                   * (pressure(i, j, k) - pressure(i - 1, j, k));
```

The wall faces are skipped, retaining their zero normal velocity. With only 100 fixed iterations and no convergence criterion, this is an approximate projection. A post-projection divergence reduction should be measured before calling it numerically accurate.

## What moved to CUDA

Each 3D advection, divergence, and pressure-gradient launch maps threads to grid indices, checks array bounds, and reads or writes device grids through `GridView3D`. The main volume kernels use blocks of `dim3(8, 8, 4)` (256 threads); the bottom source patches and boundary faces use 2D blocks of `dim3(16, 16)`. `DeviceGrid3D` arrays remain on the GPU through simulation steps. Swapping grid owners on the host avoids copying the entire 3D field between iterations. `cudaGetLastError()` checks launch errors after kernels; it is not, by itself, a GPU completion or elapsed-time measurement.

There is a performance tradeoff in the simple pressure solver: every iteration is a separate kernel launch, so 100 iterations mean 100 pressure launches per step, plus a pressure reset. This is a clear optimization target, but changing the solver should follow a convergence test; reducing iteration count can also increase residual divergence.

## Initial timing and what it means

The simulation uses a $64 \times 64 \times 32$ grid (131,072 cells). The application window is $512 \times 512$ pixels, and the displayed slice initially uses depth index 16. Window resolution is separate from simulation resolution.

The following results are reported **per-call means** from runs with vertical synchronization disabled. The ratio is CPU time divided by CUDA time; a value below $1\times$ means the CUDA stage was slower.

| Scope | CPU mean | CUDA mean | CPU / CUDA |
| --- | ---: | ---: | ---: |
| `step` | 126,154.32 µs | 2,840.27 µs | **44.42×** |
| `advectVelocity(dt)` | 66,742.79 µs | 318.24 µs | 209.72× |
| `enforceBoundaryVelocity()` | 42.42 µs | 110.48 µs | 0.38× |
| `computeDivergence()` | 674.99 µs | 63.00 µs | 10.71× |
| `solvePressure(dt, 100)` | 32,393.03 µs | 1,144.87 µs | 28.29× |
| `applyPressureGradient(dt)` | 683.54 µs | 51.32 µs | 13.32× |

The CPU run recorded 160 `step` calls, while the CUDA run recorded 456 calls for each listed scope. Pressure accounted for approximately 40.3% of the reported CUDA `step` time, making it the largest listed CUDA stage. Boundary enforcement was slower in the CUDA run; its small amount of work may make launch and synchronization overhead relatively important, though this profile does not isolate that overhead.

These ratios are **preliminary comparisons of the current implementations** (Forgive my coarse experiment). The runs have different sample counts, and the CUDA timer boundaries and synchronization behavior still need verification. A CPU timer around asynchronous kernel launches may record submission time rather than completed GPU work. Though I added `cudaStreamSynchronize` at the end of each timing macro-function, there may still be some inaccuracies.

<!-- For a reproducible comparison, I need to record both processors, build settings, grid spacing, time step, pressure iteration counts, warm-up procedure, and timer implementation. I would then run the same fixed number of simulation steps from the same initial state, exclude rendering, synchronize at the boundary of each measured CUDA step, and report variation across repeated runs. Timing individual stages with additional synchronization is useful for diagnosis, but a separate whole-step measurement is needed for throughput.

Numerical validation should accompany timing. In particular, I need to compare divergence before and after projection, pressure residuals, and representative density slices on the same grid and time step. The current `copyDivergenceSlice` reads divergence computed **before** pressure correction; measuring the projected field requires recomputing divergence after `applyPressureGradient()` in a diagnostic run. -->

## Next experiments

The current slice renderer is enough to inspect scalar fields but hides much of the 3D flow. My next implementation goals are volume rendering and a temperature field with buoyancy, followed by a pressure solver comparison with a stopping criterion. Until implemented and measured, these are goals rather than properties of the present solver.

## References

- Jos Stam, [*Stable Fluids*](https://www.dgp.toronto.edu/~stam/reality/Research/pub.html), SIGGRAPH 1999.
- Robert Bridson, [*Fluid Simulation for Computer Animation* course notes](https://www.cs.ubc.ca/~rbridson/fluidsimulation/), SIGGRAPH 2007.
