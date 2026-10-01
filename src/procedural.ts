import type { CircleNode, LineNode, RectNode, VisualNode } from "./index.js";

export function seededRandom(seed:number|string){
  let h=2166136261 >>> 0;
  const input=String(seed);
  for(let i=0;i<input.length;i++){
    h^=input.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return function(){
    h+=0x6D2B79F5;
    let t=h;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

export function dotField(id:string,width:number,height:number,options:{seed?:number|string;count?:number;radius?:number;fill?:string}={}):CircleNode[]{
  const rnd=seededRandom(options.seed ?? id);
  const count=Math.max(0,Math.floor(options.count ?? 120));
  const radius=Math.max(.25,options.radius ?? 1.6);
  const fill=options.fill ?? "#94a3b8";
  const nodes:CircleNode[]=[];
  for(let i=0;i<count;i++){
    nodes.push({
      id:`${id}-dot-${i}`,
      type:"circle",
      cx:rnd()*width,
      cy:rnd()*height,
      r:radius*(.5+rnd()),
      paint:{fill,opacity:.25+rnd()*.65}
    });
  }
  return nodes;
}

export function stripePattern(id:string,width:number,height:number,options:{gap?:number;angle?:number;stroke?:string;strokeWidth?:number}={}):LineNode[]{
  const gap=Math.max(4,options.gap ?? 24);
  const angle=(options.angle ?? 45)*Math.PI/180;
  const stroke=options.stroke ?? "#cbd5e1";
  const strokeWidth=options.strokeWidth ?? 1;
  const diag=Math.hypot(width,height);
  const dx=Math.cos(angle)*diag;
  const dy=Math.sin(angle)*diag;
  const normalX=-Math.sin(angle);
  const normalY=Math.cos(angle);
  const out:LineNode[]=[];
  for(let offset=-diag;offset<=diag;offset+=gap){
    const cx=width/2+normalX*offset;
    const cy=height/2+normalY*offset;
    out.push({
      id:`${id}-stripe-${out.length}`,
      type:"line",
      x1:cx-dx,
      y1:cy-dy,
      x2:cx+dx,
      y2:cy+dy,
      paint:{stroke,strokeWidth,opacity:.7}
    });
  }
  return out;
}

export function modularGrid(id:string,width:number,height:number,options:{cell?:number;stroke?:string;majorEvery?:number}={}):VisualNode[]{
  const cell=Math.max(4,options.cell ?? 32);
  const majorEvery=Math.max(1,Math.floor(options.majorEvery ?? 4));
  const stroke=options.stroke ?? "#dbe3ef";
  const nodes:VisualNode[]=[];
  let ix=0;
  for(let x=0;x<=width;x+=cell,ix++){
    nodes.push({id:`${id}-v-${ix}`,type:"line",x1:x,y1:0,x2:x,y2:height,paint:{stroke,strokeWidth:ix%majorEvery===0?1.4:.6,opacity:ix%majorEvery===0?.75:.4}});
  }
  let iy=0;
  for(let y=0;y<=height;y+=cell,iy++){
    nodes.push({id:`${id}-h-${iy}`,type:"line",x1:0,y1:y,x2:width,y2:y,paint:{stroke,strokeWidth:iy%majorEvery===0?1.4:.6,opacity:iy%majorEvery===0?.75:.4}});
  }
  return nodes;
}

export function panel(id:string,x:number,y:number,width:number,height:number,fill="#ffffff"):RectNode {
  return {id,type:"rect",x,y,width,height,rx:18,paint:{fill,stroke:"#cbd5e1",strokeWidth:1}};
}
