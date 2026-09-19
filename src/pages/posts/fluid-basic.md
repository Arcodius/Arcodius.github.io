---
layout: ../../layouts/MarkdownPostLayout.astro
title: "Basic Incompressible Non-Viscous 2D Fluid Simulation"
pubDate: 2026-09-19
author: Aaron Zhang
description: "Math notes and how I implemented it."
---

## Fundamental

The fundamental of all is incompressible Navier-Stokes momentum equation:

$$
\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla) \mathbf{u} = -\frac{1}{\rho} \nabla p + \nu \nabla^2 \mathbf{u} + \mathbf{g}
$$

An incompressible fluid cannot locally expand or contract. The divergence of velocity measures exactly that local rate of volume change, so incompressibility implies

$$
\nabla \cdot \mathbf{u} = 0,
$$

but this does not mean $(\mathbf{u} \cdot \nabla) \mathbf{u} = 0$ ! For simplicity, the fluid can be non-viscous, which gives that

$$
\nu = 0,
$$

though by induction our non-viscous simulation actually has viscous bahavior. If we only focus on the inner dynamics of fluid, i.d. neglecting outer force like gravity $g$, we get a rather simple equation

$$
\frac{\partial \mathbf{u}}{\partial t} = \underbrace{- (\mathbf{u} \cdot \nabla) \mathbf{u}}_{\text{advection}} \overbrace{-\frac{1}{\rho} \nabla p}^{\text{pressure}},
$$

which can be solved by operator splitting.

## Discretization
First, we temporarily ignore pressure and solve 

$$
\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla) \mathbf{u} = 0
$$
Advecting the velocity gives an immediate velocity:

$$
\mathbf{u}^* = \text{Advect}(\mathbf{u}^n, \mathbf{u}^n, \Delta t).
$$

By simple forward-Euler discretization, this would be
$$
\mathbf{u}^* = \mathbf{u}^n - \Delta t (\mathbf{u} \cdot \nabla) \mathbf{u}.
$$

In a semi-Lagranian solver, however, we implement the same conceptual step by backtracing:

$$
\mathbf{x}_{\text{old}} = \mathbf{x} - \Delta t \mathbf{u}^n(\mathbf{x}),
$$

and sample the old velocity there:

$$
\mathbf{u}^*(\mathbf{x}) = \mathbf{u}^n(\mathbf{x}_{\text{old}}).
$$

After advection, the velocity field will no longer be divergence-free:

$$
\nabla \cdot \mathbf{u}^* \neq 0,
$$

thus we use additional pressure to correct it:

$$
\mathbf{u}^{n+1} = \mathbf{u}^*-\frac{\Delta t}{\rho}\nabla p,
$$

hoping the final velocity field would satisfy free divergence (incompressibility), i.d. $\nabla \cdot \mathbf{u}^{n+1} = 0$.

We substitute the pressure correction:

$$
\nabla \cdot(\mathbf{u}^*-\frac{\Delta t}{\rho}\nabla p) = 0, 
$$
$$
\nabla^2p = \frac{\rho}{\Delta t}\nabla \cdot \mathbf{u}^*.
$$

Therefore our implementation would be:
1. Advect velocity to get $\mathbf{u}^*$.
2. Compute the divergence.
3. Solve the pressure Poisson equation to get $p$.
4. Correct velocity with pressure gradient to get next step's $\mathbf{u}^{n+1}$.
5. Advect other attributes, like density, with velocity;
