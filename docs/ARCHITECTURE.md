# Visual Engine architecture

Visual Engine is a local-first rendering runtime. It does not require an AI provider to produce structured visuals.

Pipeline:

1. VisualBrief / Visual DSL / Scene JSON
2. Scene normalization
3. Layout, with native stack/grid and an optional Yoga adapter
4. Typography and math, with deterministic SVG and a MathJax adapter path
5. Deterministic geometry and procedural modules
6. SVG baseline, resvg PNG, CanvasKit/Skia WebAssembly acceleration, and Three.js WebGPU experimental 3D
7. Quality analysis
8. Editable scene plus export

The canonical interchange format is VisualScene 1.0, not PNG. Raster output is an export artifact.

Runtime features must work from bundled code, WASM, or browser APIs. Network providers are optional upstream planners/assets and are never required by the core renderer.
