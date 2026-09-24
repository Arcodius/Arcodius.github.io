---
title: "Mini Path Tracing Renderer"
summary: "A series of experiments exploring path tracing and rendering techniques."
year: 2025
status: "in-progress"
tags: ["Rendering", "C++", "Monte Carlo"]
cover: "/images/projects/mini-renderer/reflection.png"
coverAlt: "A scene with surreal reflection effects"
featured: true
links: []
---

## Starting with a Single Ray

This is an evolving series of path-tracing experiments. I began with a basic camera and ray–sphere intersections, then gradually added materials, direct lighting, and multiple bounces. Following [_Ray Tracing in One Weekend_](https://raytracing.github.io/books/RayTracingInOneWeekend.html), I implemented my own CPU-based renderer in C++.

![Ray tracing from scratch](/images/projects/mini-renderer/raytrace.bmp)

## Refactoring the Renderer

I later began refactoring the project to improve performance and turn it into a flexible playground for rendering algorithms. That work is still in progress, but the renderer can already produce compelling images with nuanced lighting and surface detail.

![Cornell Box...without a Ceiling Light](/images/projects/mini-renderer/raytrace.jpg)

Some of the unexpected effects are interesting in their own right.

![Surreal reflections](/images/projects/mini-renderer/reflection.jpg)

## Next Steps

My current goal is to port the renderer to the GPU. Fight on!
