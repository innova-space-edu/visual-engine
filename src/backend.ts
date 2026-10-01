import type { VisualScene } from "./index.js";

export type BackendId = "svg" | "resvg" | "canvaskit" | "webgpu";

export interface RuntimeFeatures {
  browser?: boolean;
  node?: boolean;
  wasm?: boolean;
  webgpu?: boolean;
  webgl2?: boolean;
  preferGpu?: boolean;
  output?: "editable" | "raster" | "interactive" | "3d";
}

export interface BackendDecision {
  backend: BackendId;
  reason: string;
  fallbacks: BackendId[];
}

export function sceneNeeds3D(scene:VisualScene):boolean {
  return scene.nodes.some((node)=>{
    const meta=node.metadata || {};
    return meta.dimension===3 || meta.renderer==="3d" || meta.backend==="webgpu";
  });
}

export function chooseBackend(scene:VisualScene, features:RuntimeFeatures={}):BackendDecision {
  if((features.output==="3d" || sceneNeeds3D(scene)) && features.browser && (features.webgpu || features.webgl2)){
    return {
      backend:"webgpu",
      reason:features.webgpu ? "3D scene with WebGPU support" : "3D scene using WebGL2 fallback",
      fallbacks:["canvaskit","svg"]
    };
  }

  if(features.output==="raster" && features.node){
    return {backend:"resvg",reason:"Deterministic server raster export requested",fallbacks:["svg"]};
  }

  if(features.browser && features.wasm && (features.preferGpu || features.output==="interactive")){
    return {backend:"canvaskit",reason:"Interactive browser render with local Skia/WASM",fallbacks:["svg"]};
  }

  return {backend:"svg",reason:"Portable editable vector output is the universal deterministic backend",fallbacks:[]};
}
