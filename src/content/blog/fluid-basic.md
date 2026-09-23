---
title: "Basic 2D Inviscid Incompressible Fluid Simulation"
description: "Implementation notes spanning the Navier–Stokes equations, semi-Lagrangian advection, and pressure projection."
pubDate: 2026-09-19
tags: ["Fluid", "Math", "C++"]
cover: "/images/projects/fluid-study.svg"
coverAlt: "An abstract fluid simulation composed of blue streamlines and a red circle"
---

## Governing equations

The incompressible Navier–Stokes momentum equation is the starting point for this simulation:

$$
\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla) \mathbf{u} = -\frac{1}{\rho} \nabla p + \nu \nabla^2 \mathbf{u} + \mathbf{g}
$$

An incompressible fluid cannot locally expand or contract. The divergence of velocity measures this local rate of volume change, so incompressibility requires

$$
\nabla \cdot \mathbf{u} = 0.
$$

This does **not** imply $(\mathbf{u} \cdot \nabla) \mathbf{u} = 0$. To simplify the problem, first ignore viscosity ($\nu = 0$) and external forces such as gravity. The equation becomes

$$
\frac{\partial \mathbf{u}}{\partial t} =
\underbrace{- (\mathbf{u} \cdot \nabla) \mathbf{u}}_{\text{advection}}
\overbrace{-\frac{1}{\rho} \nabla p}^{\text{pressure}}.
$$

It can be solved one stage at a time with operator splitting.

## Discretization

First, temporarily ignore pressure and solve the advection term:

$$
\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla) \mathbf{u} = 0.
$$

Advecting the velocity field produces an intermediate velocity:

$$
\mathbf{u}^* = \operatorname{Advect}(\mathbf{u}^n, \mathbf{u}^n, \Delta t).
$$

In a semi-Lagrangian solver, we trace backward from the current position:

$$
\mathbf{x}_{\text{old}} = \mathbf{x} - \Delta t\, \mathbf{u}^n(\mathbf{x}),
$$

Then sample the velocity at the previous position:

$$
\mathbf{u}^*(\mathbf{x}) = \mathbf{u}^n(\mathbf{x}_{\text{old}}).
$$

After advection, the velocity field is no longer divergence-free, so it must be corrected with pressure:

$$
\mathbf{u}^{n+1} = \mathbf{u}^* - \frac{\Delta t}{\rho}\nabla p.
$$

Substituting the incompressibility condition $\nabla \cdot \mathbf{u}^{n+1} = 0$ gives the pressure Poisson equation:

$$
\nabla^2 p = \frac{\rho}{\Delta t}\nabla \cdot \mathbf{u}^*.
$$

## Implementation sequence

1. Advect velocity to obtain $\mathbf{u}^*$.
2. Compute the divergence of the intermediate velocity field.
3. Solve the pressure Poisson equation to obtain $p$.
4. Correct velocity with the pressure gradient to obtain $\mathbf{u}^{n+1}$.
5. Advect other attributes, such as density, with the new velocity.

> This note will continue to evolve alongside the implementation. The next steps are to document boundary conditions, analyze convergence of the Poisson solver, and visualize numerical dissipation.
