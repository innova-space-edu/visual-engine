export type CapabilityStatus = "stable" | "beta" | "experimental" | "planned";

export interface VisualCapability {
  id: string;
  category:
    | "renderer"
    | "layout"
    | "text"
    | "math"
    | "vector"
    | "raster"
    | "3d"
    | "animation"
    | "export"
    | "quality"
    | "interop";
  status: CapabilityStatus;
  runtime: Array<"core" | "browser" | "node" | "python">;
  deterministic: boolean;
  offline: boolean;
  description: string;
  package?: string;
}

const CAPABILITIES: VisualCapability[] = [
  { id:"editor-v4", category:"layout", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Multi-select alignment, distribution, grouping, smart snapping and scene diffs." },
  { id:"document-pages", category:"layout", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Multi-page VisualDocument contract and page operations." },
  { id:"learning-v2", category:"quality", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Learns numeric edit preferences and acceptance rankings from scene changes." },
  { id:"rich-content", category:"text", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Rich text runs, tables, smart connectors, links and image adjustment metadata." },
  { id:"web-worker-runtime", category:"renderer", status:"beta", runtime:["browser"], deterministic:true, offline:true, description:"Scene rendering and quality analysis in a dedicated Web Worker." },
  { id:"offscreen-canvas", category:"renderer", status:"experimental", runtime:["browser"], deterministic:true, offline:true, description:"Off-main-thread canvas path for compatible browsers." },
  { id:"animation-timeline", category:"animation", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Keyframe interpolation and deterministic scene sampling." },
  { id:"text-layout", category:"text", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Text measurement, wrapping and fit-to-box layout." },
  { id:"layout-v2", category:"layout", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Grid, distribution and collision analysis." },
  { id:"geometry-v2", category:"vector", status:"beta", runtime:["core","browser","node","python"], deterministic:true, offline:true, description:"Analytic geometry and sampled function primitives." },
  { id:"charts-v2", category:"vector", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Deterministic bar, line and scatter chart primitives." },
  { id:"science-v2", category:"vector", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Reusable chemistry, physics and optics primitives." },
  { id:"quality-v2", category:"quality", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Collision, contrast, typography, density and edge-risk diagnostics." },
  { id:"scene-graph", category:"vector", status:"stable", runtime:["core","browser","node","python"], deterministic:true, offline:true, description:"Canonical editable VisualScene representation." },
  { id:"svg-renderer", category:"renderer", status:"stable", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Deterministic SVG renderer." },
  { id:"resvg", category:"raster", status:"stable", runtime:["node"], deterministic:true, offline:true, description:"Server-side SVG to PNG rasterization.", package:"@resvg/resvg-js" },
  { id:"mathjax-svg", category:"math", status:"stable", runtime:["node"], deterministic:true, offline:true, description:"TeX/LaTeX to structured SVG.", package:"mathjax" },
  { id:"canvaskit", category:"renderer", status:"beta", runtime:["browser"], deterministic:true, offline:true, description:"Skia/WebAssembly accelerated browser renderer.", package:"canvaskit-wasm" },
  { id:"yoga-layout", category:"layout", status:"beta", runtime:["browser","node"], deterministic:true, offline:true, description:"Constraint/flexbox layout adapter.", package:"yoga-layout" },
  { id:"three-webgpu", category:"3d", status:"experimental", runtime:["browser"], deterministic:true, offline:true, description:"WebGPU 3D/technical renderer with WebGL2 fallback.", package:"three" },
  { id:"harfbuzz-shaping", category:"text", status:"beta", runtime:["browser","node"], deterministic:true, offline:true, description:"Advanced glyph shaping and multilingual typography." },
  { id:"opentype-paths", category:"text", status:"beta", runtime:["browser","node"], deterministic:true, offline:true, description:"Font glyph outline extraction for editable vector text." },
  { id:"pdf-export", category:"export", status:"planned", runtime:["node"], deterministic:true, offline:true, description:"Vector-first PDF export preserving text and paths where possible." },
  { id:"quality-engine", category:"quality", status:"beta", runtime:["core","browser","node"], deterministic:true, offline:true, description:"Rule-based diagnostics, layout checks and visual metrics." }
];

export function listCapabilities(): VisualCapability[] {
  return CAPABILITIES.map((cap) => ({...cap, runtime:[...cap.runtime]}));
}

export function getCapability(id:string): VisualCapability | undefined {
  const found=CAPABILITIES.find((cap)=>cap.id===id);
  return found ? {...found, runtime:[...found.runtime]} : undefined;
}

export function capabilityMatrix(){
  return CAPABILITIES.reduce<Record<string,VisualCapability>>((acc,cap)=>{
    acc[cap.id]={...cap,runtime:[...cap.runtime]};
    return acc;
  },{});
}
