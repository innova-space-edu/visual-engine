"""Minimal zero-dependency Python bridge for VisualScene 1.0.

Python is a producer of scene JSON. Rendering stays in visual-engine so geometry,
scientific calculations and batch generation do not need a duplicate graphics stack.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Any
import json


def _paint(fill=None, stroke=None, stroke_width=None):
    p = {}
    if fill is not None:
        p["fill"] = fill
    if stroke is not None:
        p["stroke"] = stroke
    if stroke_width is not None:
        p["strokeWidth"] = stroke_width
    return p


def rect(node_id, x, y, width, height, fill="#ffffff", stroke="#cbd5e1", rx=0):
    return {"id": node_id, "type": "rect", "x": x, "y": y, "width": width, "height": height,
            "rx": rx, "paint": _paint(fill, stroke, 1.5)}


def circle(node_id, cx, cy, r, fill="#dbeafe", stroke="#1d4ed8"):
    return {"id": node_id, "type": "circle", "cx": cx, "cy": cy, "r": r,
            "paint": _paint(fill, stroke, 2)}


def line(node_id, x1, y1, x2, y2, stroke="#0f172a", width=2, arrow=False):
    return {"id": node_id, "type": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "markerEnd": arrow, "paint": _paint(None, stroke, width)}


def polygon(node_id, points, fill="#dbeafe", stroke="#1d4ed8"):
    return {"id": node_id, "type": "polygon", "points": [list(p) for p in points],
            "paint": _paint(fill, stroke, 2)}


def text(node_id, value, x, y, size=20, weight=400, fill="#0f172a"):
    return {"id": node_id, "type": "text", "x": x, "y": y, "text": str(value),
            "style": {"family": "Inter,Arial,sans-serif", "size": size, "weight": weight},
            "paint": _paint(fill)}


def math_node(node_id, latex, x, y, scale=1):
    return {"id": node_id, "type": "math", "x": x, "y": y, "latex": str(latex),
            "scale": scale, "paint": _paint("#0f172a")}


@dataclass
class Scene:
    scene_id: str
    width: int = 1200
    height: int = 800
    background: str = "#ffffff"
    title: str | None = None
    description: str | None = None
    nodes: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def add(self, *nodes: dict[str, Any]) -> "Scene":
        self.nodes.extend(nodes)
        return self

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": "1.0",
            "id": self.scene_id,
            "width": self.width,
            "height": self.height,
            "background": self.background,
            "title": self.title,
            "description": self.description,
            "nodes": self.nodes,
            "metadata": {"producer": "visual-engine-python", **self.metadata},
        }

    def to_json(self, indent=2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)
