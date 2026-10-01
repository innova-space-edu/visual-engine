export * from "./index.js";
export { latexToSvg, hydrateMath } from "./mathjax.js";

import { VisualEngine, type RenderResult, type VisualScene } from "./index.js";

export class NodeVisualEngine extends VisualEngine {
  async renderPng(scene:VisualScene,opt:{pixelRatio?:number}={}):Promise<RenderResult> {
    const svg=this.renderSvg(scene);
    try{
      const mod:any=await import("@resvg/resvg-js");
      const png=new mod.Resvg(svg.data as string,{fitTo:{mode:"zoom",value:opt.pixelRatio||1}}).render().asPng();
      return Object.assign({},svg,{format:"png",mimeType:"image/png",data:png,renderer:"visual-engine/resvg"}) as RenderResult;
    }catch(e){
      return Object.assign({},svg,{diagnostics:svg.diagnostics.concat([{level:"warning",code:"resvg.unavailable",message:String(e)}])}) as RenderResult;
    }
  }
}
export const nodeVisualEngine=new NodeVisualEngine();
