# Python bridge

The Python layer deliberately does not render images. It builds the same `VisualScene 1.0` used by the TypeScript runtime.

This is useful for ScientificBrain, numerical geometry, simulations, batch generation and any workflow where Python computes authoritative coordinates or data.

It uses only the Python standard library. Rendering remains in Visual Engine through SVG, resvg, CanvasKit/Skia or later native targets.

Example:

```bash
PYTHONPATH=python python python/examples/homothety.py > scene.json
```
