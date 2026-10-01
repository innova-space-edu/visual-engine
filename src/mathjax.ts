import type { MathNode, VisualNode, VisualScene } from "./index.js";

let instancePromise: Promise<any> | null = null;

async function mathjaxInstance(): Promise<any> {
  if (!instancePromise) {
    instancePromise = import("mathjax").then(async (mod:any) => {
      const MathJax = mod.default || mod;
      return MathJax.init({
        loader: { load: ["input/tex", "output/svg"] },
        svg: { fontCache: "local" }
      });
    });
  }
  return instancePromise;
}

export async function latexToSvg(latex:string, display=true):Promise<string> {
  const MathJax = await mathjaxInstance();
  const node = await MathJax.tex2svgPromise(String(latex), { display });
  const serialized = MathJax.startup.adaptor.serializeXML(node);
  const start = serialized.indexOf("<svg");
  const end = serialized.lastIndexOf("</svg>");
  return start >= 0 && end >= start ? serialized.slice(start, end + 6) : serialized;
}

async function hydrateNode(node:VisualNode):Promise<VisualNode> {
  if (node.type === "math") {
    const rendered = await latexToSvg(node.latex, true);
    return Object.assign({}, node, { svg: rendered }) as MathNode;
  }
  if (node.type === "group") {
    const children:VisualNode[] = [];
    for (const child of node.children) children.push(await hydrateNode(child));
    return Object.assign({}, node, { children });
  }
  return node;
}

export async function hydrateMath(scene:VisualScene):Promise<VisualScene> {
  const nodes:VisualNode[] = [];
  for (const node of scene.nodes) nodes.push(await hydrateNode(node));
  return Object.assign({}, scene, { nodes });
}
