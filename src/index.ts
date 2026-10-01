export type NodeKind = "group"|"rect"|"circle"|"ellipse"|"line"|"polyline"|"polygon"|"path"|"text"|"math"|"image";

export interface Paint {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  dash?: number[];
  opacity?: number;
  lineCap?: "butt"|"round"|"square";
  lineJoin?: "miter"|"round"|"bevel";
}
export interface Transform { x?:number; y?:number; rotation?:number; scaleX?:number; scaleY?:number; opacity?:number; }
export interface Box { x:number; y:number; width:number; height:number; }
export interface BaseNode {
  id:string;
  type:NodeKind;
  visible?:boolean;
  locked?:boolean;
  zIndex?:number;
  transform?:Transform;
  paint?:Paint;
  metadata?:Record<string,unknown>;
}
export interface GroupNode extends BaseNode { type:"group"; children:VisualNode[]; clip?:Box; }
export interface RectNode extends BaseNode { type:"rect"; x:number;y:number;width:number;height:number;rx?:number;ry?:number; }
export interface CircleNode extends BaseNode { type:"circle"; cx:number;cy:number;r:number; }
export interface EllipseNode extends BaseNode { type:"ellipse"; cx:number;cy:number;rx:number;ry:number; }
export interface LineNode extends BaseNode { type:"line"; x1:number;y1:number;x2:number;y2:number;markerStart?:boolean;markerEnd?:boolean; }
export interface PolyNode extends BaseNode { type:"polyline"|"polygon"; points:Array<[number,number]>; }
export interface PathNode extends BaseNode { type:"path"; d:string; }
export interface TextStyle {
  family?:string; size?:number; weight?:number|string; style?:"normal"|"italic";
  align?:"start"|"middle"|"end"; baseline?:"auto"|"middle"|"hanging"|"alphabetic";
  letterSpacing?:number; lineHeight?:number;
}
export interface TextNode extends BaseNode { type:"text"; x:number;y:number;text:string;maxWidth?:number;style?:TextStyle; }
export interface MathNode extends BaseNode { type:"math"; x:number;y:number;latex:string;svg?:string;scale?:number; }
export interface ImageNode extends BaseNode { type:"image"; x:number;y:number;width:number;height:number;href:string;fit?:"contain"|"cover"|"fill"; }
export type VisualNode = GroupNode|RectNode|CircleNode|EllipseNode|LineNode|PolyNode|PathNode|TextNode|MathNode|ImageNode;

export interface VisualScene {
  version:"1.0";
  id:string;
  width:number;
  height:number;
  background?:string;
  title?:string;
  description?:string;
  nodes:VisualNode[];
  variables?:Record<string,string|number|boolean>;
  metadata?:Record<string,unknown>;
}
export interface Diagnostic { level:"info"|"warning"|"error"; code:string; message:string; nodeId?:string; }
export interface QualityReport {
  valid:boolean;
  score:number;
  diagnostics:Diagnostic[];
  metrics:{nodeCount:number;hiddenCount:number;outOfBounds:number;duplicateIds:number};
}
export interface RenderResult {
  format:"svg"|"png";
  mimeType:string;
  data:string|Uint8Array;
  width:number;
  height:number;
  renderer:string;
  diagnostics:Diagnostic[];
}

function esc(v:unknown):string {
  return String(v == null ? "" : v).replace(/[&<>"']/g,function(c){
    const m:Record<string,string>={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"};
    return m[c] || c;
  });
}
function sorted(nodes:VisualNode[]):VisualNode[] {
  return nodes.slice().sort(function(a,b){return (a.zIndex || 0)-(b.zIndex || 0);});
}
function paintAttrs(p?:Paint):string {
  if(!p) return "";
  const a:string[]=[];
  if(p.fill !== undefined) a.push('fill="'+esc(p.fill)+'"');
  if(p.stroke !== undefined) a.push('stroke="'+esc(p.stroke)+'"');
  if(p.strokeWidth !== undefined) a.push('stroke-width="'+p.strokeWidth+'"');
  if(p.dash && p.dash.length) a.push('stroke-dasharray="'+p.dash.join(" ")+'"');
  if(p.opacity !== undefined) a.push('opacity="'+p.opacity+'"');
  if(p.lineCap) a.push('stroke-linecap="'+p.lineCap+'"');
  if(p.lineJoin) a.push('stroke-linejoin="'+p.lineJoin+'"');
  return a.join(" ");
}
function transformAttrs(t?:Transform):string {
  if(!t) return "";
  const p:string[]=[];
  if(t.x || t.y) p.push("translate("+(t.x || 0)+" "+(t.y || 0)+")");
  if(t.rotation) p.push("rotate("+t.rotation+")");
  if((t.scaleX || 1)!==1 || (t.scaleY || 1)!==1) p.push("scale("+(t.scaleX || 1)+" "+(t.scaleY || t.scaleX || 1)+")");
  return p.length ? 'transform="'+p.join(" ")+'"' : "";
}
function baseAttrs(n:VisualNode):string {
  const a:string[]=['id="'+esc(n.id)+'"',paintAttrs(n.paint),transformAttrs(n.transform)];
  if(n.visible===false) a.push('display="none"');
  if(n.transform && n.transform.opacity !== undefined) a.push('opacity="'+n.transform.opacity+'"');
  return a.filter(Boolean).join(" ");
}

export function createScene(input:Omit<VisualScene,"version">&{version?:"1.0"}):VisualScene {
  return {
    version:"1.0",
    id:input.id,
    width:Math.max(1,Math.round(input.width)),
    height:Math.max(1,Math.round(input.height)),
    background:input.background || "#ffffff",
    title:input.title,
    description:input.description,
    nodes:input.nodes || [],
    variables:input.variables || {},
    metadata:input.metadata || {}
  };
}

export function flattenNodes(nodes:VisualNode[]):VisualNode[] {
  const out:VisualNode[]=[];
  for(const n of nodes){
    out.push(n);
    if(n.type==="group") out.push.apply(out,flattenNodes(n.children));
  }
  return out;
}

export function boundsOf(n:VisualNode):Box|null {
  if(n.type==="rect" || n.type==="image") return {x:n.x,y:n.y,width:n.width,height:n.height};
  if(n.type==="circle") return {x:n.cx-n.r,y:n.cy-n.r,width:n.r*2,height:n.r*2};
  if(n.type==="ellipse") return {x:n.cx-n.rx,y:n.cy-n.ry,width:n.rx*2,height:n.ry*2};
  if(n.type==="line") return {x:Math.min(n.x1,n.x2),y:Math.min(n.y1,n.y2),width:Math.abs(n.x2-n.x1),height:Math.abs(n.y2-n.y1)};
  if(n.type==="text"){
    const fs=n.style && n.style.size ? n.style.size : 16;
    const ls=n.text.split("\n");
    const chars=Math.max.apply(null,[1].concat(ls.map(function(x){return x.length;})));
    return {x:n.x,y:n.y-fs,width:Math.min(n.maxWidth || Infinity,chars*fs*.58),height:ls.length*fs*((n.style && n.style.lineHeight) || 1.2)};
  }
  if(n.type==="group"){
    const bs=n.children.map(boundsOf).filter(function(x):x is Box{return !!x;});
    if(!bs.length) return null;
    const x=Math.min.apply(null,bs.map(function(b){return b.x;}));
    const y=Math.min.apply(null,bs.map(function(b){return b.y;}));
    const r=Math.max.apply(null,bs.map(function(b){return b.x+b.width;}));
    const d=Math.max.apply(null,bs.map(function(b){return b.y+b.height;}));
    return {x:x,y:y,width:r-x,height:d-y};
  }
  return null;
}

export function stack(nodes:VisualNode[],frame:Box,opt:{direction?:"row"|"column";gap?:number;padding?:number}={}):VisualNode[] {
  const dir=opt.direction || "column";
  const gap=opt.gap===undefined?16:opt.gap;
  const pad=opt.padding || 0;
  let cursor=(dir==="row"?frame.x:frame.y)+pad;
  nodes.forEach(function(n){
    const b=boundsOf(n);
    if(!b) return;
    const dx=dir==="row"?cursor-b.x:frame.x+pad-b.x;
    const dy=dir==="column"?cursor-b.y:frame.y+pad-b.y;
    n.transform=Object.assign({},n.transform || {},{x:((n.transform && n.transform.x)||0)+dx,y:((n.transform && n.transform.y)||0)+dy});
    cursor+=(dir==="row"?b.width:b.height)+gap;
  });
  return nodes;
}

export function analyzeQuality(scene:VisualScene):QualityReport {
  const diagnostics:Diagnostic[]=[];
  const nodes=flattenNodes(scene.nodes);
  const ids=new Set<string>();
  let duplicateIds=0,outOfBounds=0,hiddenCount=0;
  nodes.forEach(function(n){
    if(ids.has(n.id)){
      duplicateIds++;
      diagnostics.push({level:"error",code:"duplicate-id",message:"Duplicate id "+n.id,nodeId:n.id});
    }
    ids.add(n.id);
    if(n.visible===false) hiddenCount++;
    const b=boundsOf(n);
    if(b && (b.x<0 || b.y<0 || b.x+b.width>scene.width || b.y+b.height>scene.height)){
      outOfBounds++;
      diagnostics.push({level:"warning",code:"out-of-bounds",message:"Node extends outside canvas",nodeId:n.id});
    }
  });
  return {
    valid:!diagnostics.some(function(d){return d.level==="error";}),
    score:Math.max(0,100-duplicateIds*25-outOfBounds*3),
    diagnostics:diagnostics,
    metrics:{nodeCount:nodes.length,hiddenCount:hiddenCount,outOfBounds:outOfBounds,duplicateIds:duplicateIds}
  };
}

function renderNode(n:VisualNode):string {
  const a=baseAttrs(n);
  if(n.type==="group"){
    let cp="";
    let ca="";
    if(n.clip){
      cp='<clipPath id="clip-'+esc(n.id)+'"><rect x="'+n.clip.x+'" y="'+n.clip.y+'" width="'+n.clip.width+'" height="'+n.clip.height+'"/></clipPath>';
      ca=' clip-path="url(#clip-'+esc(n.id)+')"';
    }
    return cp+"<g "+a+ca+">"+sorted(n.children).map(renderNode).join("")+"</g>";
  }
  if(n.type==="rect") return '<rect '+a+' x="'+n.x+'" y="'+n.y+'" width="'+n.width+'" height="'+n.height+'" rx="'+(n.rx||0)+'" ry="'+(n.ry||n.rx||0)+'"/>';
  if(n.type==="circle") return '<circle '+a+' cx="'+n.cx+'" cy="'+n.cy+'" r="'+n.r+'"/>';
  if(n.type==="ellipse") return '<ellipse '+a+' cx="'+n.cx+'" cy="'+n.cy+'" rx="'+n.rx+'" ry="'+n.ry+'"/>';
  if(n.type==="line") return '<line '+a+' x1="'+n.x1+'" y1="'+n.y1+'" x2="'+n.x2+'" y2="'+n.y2+'"'+(n.markerEnd?' marker-end="url(#ve-arrow)"':"")+'/>';
  if(n.type==="polyline" || n.type==="polygon") return "<"+n.type+" "+a+' points="'+n.points.map(function(p){return p.join(",");}).join(" ")+'"/>';
  if(n.type==="path") return '<path '+a+' d="'+esc(n.d)+'"/>';
  if(n.type==="text"){
    const s=n.style || {};
    const attrs:string[]=[];
    if(s.family) attrs.push('font-family="'+esc(s.family)+'"');
    if(s.size) attrs.push('font-size="'+s.size+'"');
    if(s.weight) attrs.push('font-weight="'+esc(s.weight)+'"');
    if(s.style) attrs.push('font-style="'+s.style+'"');
    if(s.align) attrs.push('text-anchor="'+s.align+'"');
    if(s.baseline) attrs.push('dominant-baseline="'+s.baseline+'"');
    if(s.letterSpacing !== undefined) attrs.push('letter-spacing="'+s.letterSpacing+'"');
    const lines=n.text.split("\n");
    const lh=(s.lineHeight || 1.2)*(s.size || 16);
    const body=lines.map(function(line,i){return '<tspan x="'+n.x+'" dy="'+(i?lh:0)+'">'+esc(line)+'</tspan>';}).join("");
    return '<text '+a+' x="'+n.x+'" y="'+n.y+'" '+attrs.join(" ")+">"+body+"</text>";
  }
  if(n.type==="math"){
    if(n.svg){
      return '<g '+a+' transform="translate('+n.x+" "+n.y+') scale('+(n.scale||1)+')" data-latex="'+esc(n.latex)+'">'+n.svg+"</g>";
    }
    return '<text '+a+' x="'+n.x+'" y="'+n.y+'" font-family="STIX Two Math,Cambria Math,serif" font-size="24" data-latex="'+esc(n.latex)+'">'+esc(n.latex)+"</text>";
  }
  if(n.type==="image") return '<image '+a+' x="'+n.x+'" y="'+n.y+'" width="'+n.width+'" height="'+n.height+'" href="'+esc(n.href)+'" preserveAspectRatio="'+(n.fit==="fill"?"none":n.fit==="cover"?"xMidYMid slice":"xMidYMid meet")+'"/>';
  return "";
}

export function renderSvg(scene:VisualScene,pretty=false):string {
  const sep=pretty?"\n":"";
  const defs='<defs><marker id="ve-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="context-stroke"/></marker></defs>';
  const out:string[]=[];
  out.push('<svg xmlns="http://www.w3.org/2000/svg" width="'+scene.width+'" height="'+scene.height+'" viewBox="0 0 '+scene.width+" "+scene.height+'" role="img"'+(scene.title?' aria-label="'+esc(scene.title)+'"':"")+">");
  if(scene.title) out.push("<title>"+esc(scene.title)+"</title>");
  if(scene.description) out.push("<desc>"+esc(scene.description)+"</desc>");
  out.push(defs);
  if(scene.background) out.push('<rect id="__background" width="100%" height="100%" fill="'+esc(scene.background)+'"/>');
  sorted(scene.nodes).forEach(function(n){out.push(renderNode(n));});
  out.push("</svg>");
  return out.join(sep);
}

export function label(id:string,text:string,x:number,y:number,size=18):TextNode {
  return {id:id,type:"text",x:x,y:y,text:text,style:{family:"Inter,Arial,sans-serif",size:size,weight:500},paint:{fill:"#111827"}};
}
export function arrow(id:string,x1:number,y1:number,x2:number,y2:number,stroke="#111827"):LineNode {
  return {id:id,type:"line",x1:x1,y1:y1,x2:x2,y2:y2,markerEnd:true,paint:{stroke:stroke,strokeWidth:2,lineCap:"round"}};
}
export function cartesianAxes(id:string,x:number,y:number,width:number,height:number,step=40):VisualNode[] {
  const out:VisualNode[]=[];
  for(let gx=x;gx<=x+width;gx+=step) out.push({id:id+"-gx-"+gx,type:"line",x1:gx,y1:y,x2:gx,y2:y+height,paint:{stroke:"#e5e7eb",strokeWidth:1}});
  for(let gy=y;gy<=y+height;gy+=step) out.push({id:id+"-gy-"+gy,type:"line",x1:x,y1:gy,x2:x+width,y2:gy,paint:{stroke:"#e5e7eb",strokeWidth:1}});
  out.push(arrow(id+"-x",x,y+height/2,x+width,y+height/2));
  out.push(arrow(id+"-y",x+width/2,y+height,x+width/2,y));
  return out;
}
export function molecule2D(id:string,atoms:Array<{symbol:string;x:number;y:number;color?:string}>,bonds:Array<[number,number]>):VisualNode[] {
  const out:VisualNode[]=[];
  bonds.forEach(function(pair,i){
    const A=atoms[pair[0]],B=atoms[pair[1]];
    if(A && B) out.push({id:id+"-bond-"+i,type:"line",x1:A.x,y1:A.y,x2:B.x,y2:B.y,paint:{stroke:"#374151",strokeWidth:6,lineCap:"round"}});
  });
  atoms.forEach(function(atom,i){
    out.push({id:id+"-atom-"+i,type:"circle",cx:atom.x,cy:atom.y,r:24,paint:{fill:atom.color||"#dbeafe",stroke:"#1f2937",strokeWidth:2}});
    out.push(label(id+"-label-"+i,atom.symbol,atom.x-8,atom.y+6,18));
  });
  return out;
}

function unquote(s:string):string {return s.trim().replace(/^["']|["']$/g,"");}
export function parseVisualDSL(source:string):VisualScene {
  let width=1200,height=800,background="#ffffff",title="";
  const nodes:VisualNode[]=[];
  let idx=0;
  source.split(/\r?\n/).forEach(function(raw){
    const line=raw.trim();
    if(!line || line.charAt(0)==="#") return;
    const parts=line.split(/\s+/);
    const cmd=(parts.shift()||"").toUpperCase();
    const args=parts.join(" ");
    if(cmd==="CANVAS"){
      const m=args.match(/(\d+)\s*[xX]\s*(\d+)/);
      if(m){width=Number(m[1]);height=Number(m[2]);}
    } else if(cmd==="BACKGROUND") background=unquote(args);
    else if(cmd==="TITLE"){
      title=unquote(args);
      nodes.push({id:"dsl-"+idx++,type:"text",x:64,y:84,text:title,style:{family:"Inter,Arial,sans-serif",size:42,weight:750},paint:{fill:"#0f172a"}});
    } else if(cmd==="TEXT" || cmd==="MATH"){
      const m=args.match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(.+)$/);
      if(m){
        if(cmd==="TEXT") nodes.push({id:"dsl-"+idx++,type:"text",x:Number(m[1]),y:Number(m[2]),text:unquote(m[3] ?? ""),style:{family:"Inter,Arial,sans-serif",size:24},paint:{fill:"#111827"}});
        else nodes.push({id:"dsl-"+idx++,type:"math",x:Number(m[1]),y:Number(m[2]),latex:unquote(m[3] ?? ""),paint:{fill:"#111827"}});
      }
    } else if(cmd==="RECT" || cmd==="CIRCLE" || cmd==="LINE" || cmd==="ARROW"){
      const p=args.split(/\s+/).map(Number);
      if(cmd==="RECT" && p.length>=4) nodes.push({id:"dsl-"+idx++,type:"rect",x:Number(p[0]),y:Number(p[1]),width:Number(p[2]),height:Number(p[3]),rx:12,paint:{fill:"#e0e7ff",stroke:"#4338ca",strokeWidth:2}});
      else if(cmd==="CIRCLE" && p.length>=3) nodes.push({id:"dsl-"+idx++,type:"circle",cx:Number(p[0]),cy:Number(p[1]),r:Number(p[2]),paint:{fill:"#dbeafe",stroke:"#1d4ed8",strokeWidth:2}});
      else if(p.length>=4) nodes.push({id:"dsl-"+idx++,type:"line",x1:Number(p[0]),y1:Number(p[1]),x2:Number(p[2]),y2:Number(p[3]),markerEnd:cmd==="ARROW",paint:{stroke:"#111827",strokeWidth:2}});
    }
  });
  return createScene({id:"dsl-scene",width:width,height:height,background:background,title:title,nodes:nodes});
}

export class VisualEngine {
  readonly version="0.1.0";
  renderSvg(scene:VisualScene,opt:{pretty?:boolean}={}):RenderResult {
    const q=analyzeQuality(scene);
    return {format:"svg",mimeType:"image/svg+xml",data:renderSvg(scene,!!opt.pretty),width:scene.width,height:scene.height,renderer:"visual-engine/svg-v1",diagnostics:q.diagnostics};
  }
}
export const visualEngine=new VisualEngine();

export { findNode, updateNode, removeNode, addNode, reorderNode, snapValue, snapPoint, SceneHistory } from "./document.js";

export * from "./capabilities.js";
export * from "./extensions.js";
export * from "./pipeline.js";

export * from "./backend.js";
export * from "./procedural.js";
