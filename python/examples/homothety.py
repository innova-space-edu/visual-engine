from visual_engine_py import Scene, polygon, line, circle, text, math_node

origin = (420, 330)
triangle = [(500, 250), (600, 330), (500, 410)]
k = -0.6

image = [
    (origin[0] + k * (x - origin[0]), origin[1] + k * (y - origin[1]))
    for x, y in triangle
]

scene = Scene("homothety-python", 900, 600, "#f8fafc", title="Homotecia k=-0.6")
scene.add(
    polygon("original", triangle, "#dbeafe", "#1d4ed8"),
    polygon("image", image, "#fee2e2", "#dc2626"),
    circle("origin", origin[0], origin[1], 6, "#111827", "#111827"),
    text("origin-label", "O", origin[0] + 10, origin[1] - 10, 18, 700),
    math_node("formula", "P'=O+k(P-O)", 70, 530),
)
for i, (x, y) in enumerate(triangle):
    scene.add(line(f"ray-{i}", origin[0], origin[1], x, y, "#94a3b8", 1))

print(scene.to_json())
