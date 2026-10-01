import type { GroupNode, ImageNode, LineNode, RectNode, TextNode, VisualNode, VisualScene } from "./index.js";
import { boundsOf, findNode } from "./index.js";

export interface RichTextRun {
  text:string;
  bold?:boolean;
  italic?:boolean;
  underline?:boolean;
  color?:string;
  href?:string;
}
export interface ParagraphSpec {
  runs:RichTextRun[];
  align?:"start"|"middle"|"end";
  size?:number;
  lineHeight?:number;
}

export function richTextBlock(id:string,paragraphs:ParagraphSpec[],x:number,y:number,width:number,options:{family?:string;size?:number;color?:string;paragraphGap?:number}={}):GroupNode{
  const family=options.family??"Inter,Arial,sans-serif";
  const defaultSize=options.size??18;
  const color=options.color??"#0f172a";
  const paragraphGap=options.paragraphGap??10;
  const children:VisualNode[]=[];
  let cursorY=y;
  paragraphs.forEach((paragraph,pIndex)=>{
    let cursorX=x;
    const size=paragraph.size??defaultSize;
    paragraph.runs.forEach((run,rIndex)=>{
      const estimated=Math.max(8,run.text.length*size*.56);
      const node:TextNode={
        id:`${id}-p${pIndex}-r${rIndex}`,
        type:"text",x:cursorX,y:cursorY+size,text:run.text,maxWidth:Math.max(20,width-(cursorX-x)),
        style:{family,size,weight:run.bold?700:400,style:run.italic?"italic":"normal",align:paragraph.align??"start",lineHeight:paragraph.lineHeight??1.25},
        paint:{fill:run.color??color},
        metadata:{href:run.href,underline:!!run.underline,richText:true}
      };
      children.push(node);cursorX+=estimated;
    });
    cursorY+=size*(paragraph.lineHeight??1.25)+paragraphGap;
  });
  return {id,type:"group",children,metadata:{kind:"rich-text",width}};
}

export interface TableOptions {
  headerRows?:number;
  columnWidths?:number[];
  rowHeight?:number;
  headerFill?:string;
  cellFill?:string;
  stroke?:string;
  fontSize?:number;
}

export function tableNodes(id:string,cells:string[][],x:number,y:number,width:number,options:TableOptions={}):VisualNode[]{
  if(!cells.length)return [];
  const columns=Math.max(...cells.map(row=>row.length));
  const rowHeight=options.rowHeight??42;
  const widths=options.columnWidths&&options.columnWidths.length===columns
    ?options.columnWidths
    :Array.from({length:columns},()=>width/columns);
  const nodes:VisualNode[]=[];
  let cy=y;
  cells.forEach((row,r)=>{
    let cx=x;
    for(let c=0;c<columns;c++){
      const w=widths[c]??width/columns;
      const header=r<(options.headerRows??1);
      const rect:RectNode={id:`${id}-cell-${r}-${c}`,type:"rect",x:cx,y:cy,width:w,height:rowHeight,paint:{fill:header?(options.headerFill??"#e0e7ff"):(options.cellFill??"#ffffff"),stroke:options.stroke??"#cbd5e1",strokeWidth:1}};
      const text:TextNode={id:`${id}-text-${r}-${c}`,type:"text",x:cx+10,y:cy+rowHeight/2+6,text:String(row[c]??""),maxWidth:w-20,style:{size:options.fontSize??14,weight:header?700:400},paint:{fill:"#0f172a"}};
      nodes.push(rect,text);cx+=w;
    }
    cy+=rowHeight;
  });
  return nodes;
}

export interface ConnectorOptions {
  routing?:"straight"|"orthogonal";
  stroke?:string;
  strokeWidth?:number;
  markerEnd?:boolean;
  padding?:number;
}

export function connectorBetween(scene:VisualScene,id:string,fromId:string,toId:string,options:ConnectorOptions={}):VisualNode[]{
  const from=findNode(scene,fromId),to=findNode(scene,toId);
  if(!from||!to)return [];
  const a=boundsOf(from),b=boundsOf(to);if(!a||!b)return [];
  const start={x:a.x+a.width/2,y:a.y+a.height/2};
  const end={x:b.x+b.width/2,y:b.y+b.height/2};
  const paint={stroke:options.stroke??"#475569",strokeWidth:options.strokeWidth??2,lineCap:"round" as const,lineJoin:"round" as const};
  if((options.routing??"orthogonal")==="straight"){
    const line:LineNode={id,type:"line",x1:start.x,y1:start.y,x2:end.x,y2:end.y,markerEnd:options.markerEnd!==false,paint,metadata:{kind:"connector",fromId,toId}};
    return [line];
  }
  const midX=(start.x+end.x)/2;
  return [{
    id,type:"polyline",
    points:[[start.x,start.y],[midX,start.y],[midX,end.y],[end.x,end.y]],
    paint,metadata:{kind:"connector",fromId,toId,route:"orthogonal"}
  }];
}

export interface ImageAdjustments {
  brightness?:number;
  contrast?:number;
  saturation?:number;
  blur?:number;
  grayscale?:number;
  opacity?:number;
  crop?:{x:number;y:number;width:number;height:number};
  flipX?:boolean;
  flipY?:boolean;
}

export function withImageAdjustments(node:ImageNode,adjustments:ImageAdjustments):ImageNode{
  return {
    ...node,
    metadata:{...(node.metadata||{}),imageAdjustments:{...(node.metadata?.imageAdjustments as object||{}),...adjustments}}
  };
}

export function withLink<T extends VisualNode>(node:T,href:string,target="_blank"):T{
  return {...node,metadata:{...(node.metadata||{}),href,target}} as T;
}
