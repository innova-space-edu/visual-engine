# Visual Platform Contract

The four repositories are intentionally independent but share one stable boundary.

## Canonical flow

```
VisualBrief / Visual DSL / direct code
              |
              v
        Visual Skills
              |
              v
        VisualScene 1.x
              |
              v
        Visual Engine
        /     |      \
      SVG  CanvasKit  WebGPU
       |       |        |
     resvg   browser   Three
              |
              v
        Visual Studio
```

## Repository responsibilities

- **visual-engine**: deterministic scene model, renderers, layout, typography, geometry, quality and export.
- **visual-design-skills**: specialist compilers that transform structured briefs into VisualScene.
- **visual-assets**: semantic/versioned assets and parametric components.
- **visual-studio**: test bench, editor, profiler, inspector and integration laboratory.

No repository may require an external AI provider for core rendering.

## Compatibility

All cross-repository data must use versioned JSON-compatible contracts. The first stable contract is `visual-scene/1.0`.

Skills and assets must declare:
- stable semantic ID;
- semantic version;
- minimum engine version;
- deterministic/offline capability;
- inputs and outputs;
- license/provenance metadata for imported resources.

## AI boundary

AI is optional and sits above the deterministic stack. It may produce a VisualBrief, DSL, scene parameters or missing assets. Rendering, layout validation and export must remain operational with all AI providers disabled.
