import type { Box, VisualNode } from "./index.js";
import { boundsOf } from "./index.js";

export interface LayoutItem {
  id:string;
  minWidth?:number;
  minHeight?:number;
  width?:number;
  height?:number;
  grow?:number;
}

export interface GridOptions {
  columns:number;
  gap?:number;
  rowGap?:number;
  padding?:number;
}

export function gridLayout(items:LayoutItem[],frame:Box,options:GridOptions):Record<string,Box>{
  const columns=Math.max(1,Math.floor(options.columns));
  const gap=options.gap??16;
  const rowGap=options.rowGap??gap;
  const padding=options.padding??0;
  const innerWidth=Math.max(0,frame.width-padding*2-gap*(columns-1));
  const cellWidth=innerWidth/columns;
  const rows=Math.max(1,Math.ceil(items.length/columns));
  const innerHeight=Math.max(0,frame.height-padding*2-rowGap*(rows-1));
  const cellHeight=innerHeight/rows;
  const out:Record<string,Box>={};
  items.forEach((item,index)=>{
    const col=index%columns,row=Math.floor(index/columns);
    out[item.id]={
      x:frame.x+padding+col*(cellWidth+gap),
      y:frame.y+padding+row*(cellHeight+rowGap),
      width:item.width??Math.max(item.minWidth??0,cellWidth),
      height:item.height??Math.max(item.minHeight??0,cellHeight)
    };
  });
  return out;
}

export function distribute(items:LayoutItem[],frame:Box,options:{direction?:"row"|"column";gap?:number;padding?:number;align?:"start"|"center"|"end"|"stretch"}={}):Record<string,Box>{
  const direction=options.direction??"row",gap=options.gap??12,padding=options.padding??0,align=options.align??"stretch";
  const primary=direction==="row"?frame.width:frame.height;
  const cross=direction==="row"?frame.height:frame.width;
  const base=items.map(item=>direction==="row"?(item.width??item.minWidth??0):(item.height??item.minHeight??0));
  const grows=items.map(item=>Math.max(0,item.grow??0));
  const available=Math.max(0,primary-padding*2-gap*Math.max(0,items.length-1)-base.reduce((a,b)=>a+b,0));
  const totalGrow=grows.reduce((a,b)=>a+b,0);
  let cursor=(direction==="row"?frame.x:frame.y)+padding;
  const out:Record<string,Box>={};
  items.forEach((item,index)=>{
    const size=base[index]!+(totalGrow?available*(grows[index]!/totalGrow):0);
    const requestedCross=direction==="row"?(item.height??item.minHeight??cross-padding*2):(item.width??item.minWidth??cross-padding*2);
    const crossSize=align==="stretch"?Math.max(0,cross-padding*2):Math.min(Math.max(0,cross-padding*2),requestedCross);
    const crossStart=(direction==="row"?frame.y:frame.x)+padding+(align==="center"?(cross-padding*2-crossSize)/2:align==="end"?(cross-padding*2-crossSize):0);
    out[item.id]=direction==="row"
      ?{x:cursor,y:crossStart,width:size,height:crossSize}
      :{x:crossStart,y:cursor,width:crossSize,height:size};
    cursor+=size+gap;
  });
  return out;
}

export function applyBox(node:VisualNode,target:Box):VisualNode{
  const b=boundsOf(node);
  if(!b)return structuredClone(node);
  const next=structuredClone(node);
  next.transform={...(next.transform||{}),x:(next.transform?.x??0)+(target.x-b.x),y:(next.transform?.y??0)+(target.y-b.y)};
  return next;
}

export function detectCollisions(nodes:VisualNode[]):Array<[string,string]>{
  const pairs:Array<[string,string]>=[];
  for(let i=0;i<nodes.length;i++){
    const a=nodes[i]!,ab=boundsOf(a);
    if(!ab)continue;
    for(let j=i+1;j<nodes.length;j++){
      const b=nodes[j]!,bb=boundsOf(b);
      if(!bb)continue;
      const overlaps=ab.x<bb.x+bb.width&&ab.x+ab.width>bb.x&&ab.y<bb.y+bb.height&&ab.y+ab.height>bb.y;
      if(overlaps)pairs.push([a.id,b.id]);
    }
  }
  return pairs;
}
