# Technology radar

The engine separates the stable deterministic core from accelerators and experiments.

## Adopt — core

- **VisualScene 1.0 + SVG**: canonical editable interchange and baseline renderer.
- **resvg**: local SVG-to-raster path for reproducible PNG export.
- **MathJax 4**: bundled TeX to SVG; formulas remain authoritative structured content.
- **Semantic/parametric assets**: no runtime network dependency.
- **Python Scene producer**: zero-dependency bridge for scientific/numeric workloads.

## Adopt — acceleration

- **CanvasKit / Skia WASM**: browser GPU-backed drawing with local WASM hosting.
- **Yoga**: optional Flexbox-compatible layout solver for complex components.

## Trial

- **Rough.js**: deterministic hand-drawn appearance for educational sketches.
- **HarfBuzz WASM/native**: advanced shaping path for scripts where browser SVG text is insufficient.
- **Lottie/skottie**: procedural/local animation assets.
- **constraint solver (Cassowary/Kiwi family)**: dense diagram constraints, labels and adaptive layout.
- **Earcut/tessellation**: polygon triangulation for 3D and complex fills.

## Experiment

- **Three.js WebGPURenderer + TSL**: 3D, shader and compute-oriented visuals. WebGPU is preferred with WebGL2 fallback; the Three.js renderer is still documented as experimental.
- **WebGPU compute kernels**: future procedural textures, simulation fields and image filters where browser support is adequate.

## Excluded from the core dependency chain

Remote image-generation APIs, hosted design editors, externally served fonts, CDN-only scripts and any runtime that must stay awake on a third-party service.

Those may exist as optional adapters later, but structured visual rendering must remain functional when every external provider is unavailable.
