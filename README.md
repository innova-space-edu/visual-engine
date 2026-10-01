# Visual Engine

Local-first deterministic rendering runtime for editable educational, scientific and technical graphics.

## Principles

- The canonical artifact is `VisualScene 1.0`, not a bitmap.
- Rendering must continue working with every external AI/image provider offline.
- Text, formulas, geometry, coordinates and topology remain structured and editable.
- AI may plan a scene later, but it is never required by the renderer.

## Current stack

- Scene Graph + Visual DSL
- deterministic SVG renderer
- MathJax 4 TeX -> SVG
- resvg native SVG -> PNG
- CanvasKit / Skia WebAssembly loader
- Three.js WebGPU experimental loader
- optional Yoga layout adapter
- procedural math/chemistry primitives
- quality diagnostics
- immutable document operations, snapping and undo/redo history
- zero-dependency Python Scene producer

## Example

```ts
import { createScene, visualEngine } from "@innova-space/visual-engine";

const scene=createScene({
  id:"example",
  width:1200,
  height:800,
  nodes:[
    {id:"title",type:"text",x:60,y:80,text:"Visual Engine"},
    {id:"shape",type:"circle",cx:400,cy:330,r:100,paint:{fill:"#dbeafe",stroke:"#2563eb",strokeWidth:3}}
  ]
});

const result=visualEngine.renderSvg(scene);
```

See `docs/ARCHITECTURE.md`, `docs/TECHNOLOGY_RADAR.md` and `python/README.md`.

## Runtime entries

The package intentionally separates environments:

- `@innova-space/visual-engine` — browser-neutral core: Scene Graph, SVG, DSL, quality and document operations.
- `@innova-space/visual-engine/browser` — browser accelerators such as self-hosted CanvasKit/Skia and Three.js WebGPU.
- `@innova-space/visual-engine/node` — server-only MathJax 4 and resvg PNG rendering.

This split prevents Node/native modules from leaking into client bundles and prevents browser/WASM assets from contaminating server-only builds.
