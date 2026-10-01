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
      throw new Error("resvg unavailable: "+String(e));
    }
  }
  async renderWebp(scene:VisualScene,opt:{quality?:number}={}):Promise<RenderResult> {
    const svg=this.renderSvg(scene);
    const mod:any=await import("sharp");
    const sharp:any=mod.default||mod;
    const bytes=new TextEncoder().encode(svg.data as string);
    const data=await sharp(bytes).webp({quality:opt.quality??90}).toBuffer();
    return {format:"webp",mimeType:"image/webp",data:new Uint8Array(data),width:scene.width,height:scene.height,renderer:"visual-engine/sharp-webp",diagnostics:svg.diagnostics};
  }

  async renderAvif(scene:VisualScene,opt:{quality?:number}={}):Promise<RenderResult> {
    const svg=this.renderSvg(scene);
    const mod:any=await import("sharp");
    const sharp:any=mod.default||mod;
    const bytes=new TextEncoder().encode(svg.data as string);
    const data=await sharp(bytes).avif({quality:opt.quality??80}).toBuffer();
    return {format:"avif",mimeType:"image/avif",data:new Uint8Array(data),width:scene.width,height:scene.height,renderer:"visual-engine/sharp-avif",diagnostics:svg.diagnostics};
  }

  async renderPdf(scene:VisualScene,opt:{pixelRatio?:number}={}):Promise<RenderResult> {
    const png=await this.renderPng(scene,{pixelRatio:opt.pixelRatio??2});
    if(!(png.data instanceof Uint8Array))throw new Error("PNG rasterization did not return binary data");
    const pdf:any=await import("pdf-lib");
    const doc=await pdf.PDFDocument.create();
    const image=await doc.embedPng(png.data);
    const page=doc.addPage([scene.width,scene.height]);
    page.drawImage(image,{x:0,y:0,width:scene.width,height:scene.height});
    const data=await doc.save();
    return {format:"pdf",mimeType:"application/pdf",data:new Uint8Array(data),width:scene.width,height:scene.height,renderer:"visual-engine/pdf-lib+raster",diagnostics:png.diagnostics};
  }
}
export const nodeVisualEngine=new NodeVisualEngine();
