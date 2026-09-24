---
title: "DiffuTown"
summary: "Large-Scale 3D Scene Generation from a Single Image"
year: 2026
startDate: 2026-02-01
endDate: 2026-05-31
status: "completed"
tags: ["Python", "MLLM", "Scene Generation"]
cover: "/images/projects/diffutown/cover.png"
coverAlt: "A point cloud of a town generated with Depth Anything 3"
featured: true
links: []
---

## Project Overview

This 3D generation project is part of my master's thesis, _Towards Usability-Oriented 3D Scene Construction and Evaluation_, completed at Tsinghua University in 2026. It begins with a simple question: can we reconstruct a plausible 3D scene from a single image?

Previous work has demonstrated the feasibility of this task using pretrained video or 3D models. I wanted to explore a training-free approach instead, so I developed a pipeline that combines a 3D reconstruction model with a mesh generation model. The pipeline is designed to build large outdoor scenes, which remain difficult for existing methods to reconstruct.

## Pipeline and Method

![Pipeline of Scene Generation](/images/projects/diffutown/pipeline.png)

![Asset Generation with Context Implication and VLM Check](/images/projects/diffutown/asset-pipeline.png)

## Results

![Results Comparison](/images/projects/diffutown/results.png)
