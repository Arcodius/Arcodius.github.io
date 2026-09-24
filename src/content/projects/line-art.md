---
title: "Line Art"
summary: "A string-art installation that reveals two images from different viewpoints."
year: 2024
status: "completed"
tags: ["Python", "Rhino"]
cover: "/images/projects/line-art/einstein.jpg"
coverAlt: "Line art of Einstein"
featured: true
links: []
---

## How String Art Works

String art creates an image with threads stretched between pins on a frame. In essence, the process approximates an image using a finite number of lines, each of which overlays a set of grayscale pixels on the canvas. Mathematically, this can be formulated as a large optimization problem with Boolean variables: for every pair of pins, a line is either present or absent. For a more detailed explanation, see [_The Mathematics of String Art_](https://www.youtube.com/watch?v=WGccIFf6MF8).

![How a piece of string art is made](/images/projects/line-art/principles.png)

## Our Work

Liangyou Lu and I used the 12 edges of a cube as our frame, placing pins along each edge to anchor the threads. Instead of approximating a single picture, we gave the algorithm two target images at once. The result is one set of threads that reveals a different image from each of two viewpoints. Our greedy algorithm repeatedly selects the line that most reduces the difference between the current projections and the target grayscale images.

<video autoplay muted loop playsinline preload="metadata">
  <source src="/videos/line-art/line.mp4" type="video/mp4" />
  Your browser does not support HTML video.
</video>

<video autoplay muted loop playsinline preload="metadata">
  <source src="/videos/line-art/rhino.mp4" type="video/mp4" />
  Your browser does not support HTML video.
</video>
