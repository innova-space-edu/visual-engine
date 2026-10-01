# Technology Radar — 2026 foundation

## Adopt

- SVG as canonical portable vector interchange.
- MathJax 4 for TeX/LaTeX to SVG.
- resvg / resvg-js for robust deterministic SVG rasterization.
- CanvasKit/Skia WASM for accelerated browser rendering.
- Yoga Layout for deterministic constraint/flex-style layout.
- Three.js WebGPURenderer for optional 3D/technical scenes with WebGL2 fallback.
- Native browser Canvas/SVG as universal fallbacks.

## Trial

- HarfBuzz WASM for advanced multilingual shaping.
- OpenType outline extraction for text-to-vector workflows.
- Konva in Visual Studio as an interaction/editor layer only; it must not become the canonical scene model.
- Web Workers + OffscreenCanvas for large renders.
- WebCodecs for future deterministic video/frame encoding workflows.
- WASM SIMD and threads where cross-origin isolation is available.

## Assess

- PixiJS/WebGPU for large sprite/particle workloads.
- Rust/WASM geometry kernels for path boolean operations, tessellation and image filters.
- GPU compute pipelines for procedural textures and scientific visualization.
- Native Skia bindings for high-volume server render farms.

## Avoid as core dependencies

- cloud-only image generation APIs;
- proprietary editor SDKs that require runtime licenses or remote services;
- formats that discard editability as the primary artifact;
- runtime CDN dependencies for required WASM/fonts/assets.

The engine may integrate these as optional adapters, never as a hard dependency.
