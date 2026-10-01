import type { VisualScene } from "./index.js";
import { renderSvg } from "./index.js";

export interface ExportManifest {
  contract:"visual-scene/1.0";
  sceneId:string;
  width:number;
  height:number;
  generatedAt:string;
  formats:string[];
  editable:true;
  metadata:Record<string,unknown>;
}

export function serializeScene(scene:VisualScene,pretty=true){
  return JSON.stringify(scene,null,pretty?2:0);
}

export function exportManifest(scene:VisualScene,formats=["scene-json","svg"]):ExportManifest{
  return {
    contract:"visual-scene/1.0",
    sceneId:scene.id,
    width:scene.width,
    height:scene.height,
    generatedAt:new Date().toISOString(),
    formats:[...formats],
    editable:true,
    metadata:{...(scene.metadata??{})}
  };
}

export function svgDataUrl(scene:VisualScene){
  const svg=renderSvg(scene);
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}

export function sceneBundle(scene:VisualScene){
  return {
    scene:serializeScene(scene,true),
    svg:renderSvg(scene,true),
    manifest:exportManifest(scene)
  };
}
