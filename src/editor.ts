import type { Box, VisualNode, VisualScene } from "./index.js";
import { boundsOf, createScene, findNode, flattenNodes } from "./index.js";
import { addNode, removeNode, updateNode } from "./document.js";

export type AlignMode="left"|"center-x"|"right"|"top"|"center-y"|"bottom";
export type DistributeMode="horizontal"|"vertical";

function clone<T>(value:T):T{
  return typeof structuredClone==="function"?structuredClone(value):JSON.parse(JSON.stringify(value)) as T;
}

function translated(node:VisualNode,dx:number,dy:number):VisualNode{
  const next=clone(node);
  if(next.type==="rect"||next.type==="image"||next.type==="text"||next.type==="math"){
    next.x+=dx;next.y+=dy;return next;
  }
  if(next.type==="circle"||next.type==="ellipse"){
    next.cx+=dx;next.cy+=dy;return next;
  }
  if(next.type==="line"){
    next.x1+=dx;next.x2+=dx;next.y1+=dy;next.y2+=dy;return next;
  }
  if(next.type==="polygon"||next.type==="polyline"){
    next.points=next.points.map(([x,y])=>[x+dx,y+dy]);return next;
  }
  next.transform={...(next.transform||{}),x:(next.transform?.x||0)+dx,y:(next.transform?.y||0)+dy};
  return next;
}

export function selectionBounds(scene:VisualScene,ids:string[]):Box|null{
  const boxes=ids.map(id=>findNode(scene,id)).filter(Boolean).map(node=>boundsOf(node!)).filter((box):box is Box=>!!box);
  if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
  const right=Math.max(...boxes.map(b=>b.x+b.width)),bottom=Math.max(...boxes.map(b=>b.y+b.height));
  return {x,y,width:right-x,height:bottom-y};
}

export function translateNodes(scene:VisualScene,ids:string[],dx:number,dy:number):VisualScene{
  let next=clone(scene);
  for(const id of ids){
    const node=findNode(next,id);
    if(!node||node.locked)continue;
    next=updateNode(next,id,translated(node,dx,dy) as unknown as Record<string,unknown>);
  }
  return next;
}

export function duplicateNodes(scene:VisualScene,ids:string[],offset={x:24,y:24}):{scene:VisualScene;ids:string[]}{
  let next=clone(scene);
  const created:string[]=[];
  for(const id of ids){
    const node=findNode(next,id);
    if(!node)continue;
    const copy=translated(node,offset.x,offset.y) as VisualNode;
    copy.id=id+"-copy-"+Math.random().toString(36).slice(2,7);
    copy.zIndex=(node.zIndex||0)+1;
    next=addNode(next,copy);
    created.push(copy.id);
  }
  return {scene:next,ids:created};
}

export function groupNodes(scene:VisualScene,ids:string[],groupId="group-"+Date.now().toString(36)):VisualScene{
  const selected=ids.map(id=>findNode(scene,id)).filter((node):node is VisualNode=>!!node);
  if(selected.length<2)return clone(scene);
  let next=clone(scene);
  selected.forEach(node=>{next=removeNode(next,node.id);});
  const zIndex=Math.max(...selected.map(node=>node.zIndex||0));
  return addNode(next,{id:groupId,type:"group",zIndex,children:selected});
}

export function ungroupNode(scene:VisualScene,groupId:string):VisualScene{
  const group=findNode(scene,groupId);
  if(!group||group.type!=="group")return clone(scene);
  let next=removeNode(scene,groupId);
  for(const child of group.children)next=addNode(next,child);
  return next;
}

export function alignNodes(scene:VisualScene,ids:string[],mode:AlignMode):VisualScene{
  const bounds=selectionBounds(scene,ids);
  if(!bounds)return clone(scene);
  let next=clone(scene);
  for(const id of ids){
    const node=findNode(next,id);if(!node||node.locked)continue;
    const box=boundsOf(node);if(!box)continue;
    let dx=0,dy=0;
    if(mode==="left")dx=bounds.x-box.x;
    if(mode==="center-x")dx=bounds.x+bounds.width/2-(box.x+box.width/2);
    if(mode==="right")dx=bounds.x+bounds.width-(box.x+box.width);
    if(mode==="top")dy=bounds.y-box.y;
    if(mode==="center-y")dy=bounds.y+bounds.height/2-(box.y+box.height/2);
    if(mode==="bottom")dy=bounds.y+bounds.height-(box.y+box.height);
    next=updateNode(next,id,translated(node,dx,dy) as unknown as Record<string,unknown>);
  }
  return next;
}

export function distributeNodes(scene:VisualScene,ids:string[],mode:DistributeMode):VisualScene{
  const nodes=ids.map(id=>findNode(scene,id)).filter((node):node is VisualNode=>!!node&&!node.locked)
    .map(node=>({node,box:boundsOf(node)})).filter((item):item is {node:VisualNode;box:Box}=>!!item.box);
  if(nodes.length<3)return clone(scene);
  nodes.sort((a,b)=>mode==="horizontal"?a.box.x-b.box.x:a.box.y-b.box.y);
  const first=nodes[0]!,last=nodes[nodes.length-1]!;
  const span=mode==="horizontal"?(last.box.x+last.box.width-first.box.x):(last.box.y+last.box.height-first.box.y);
  const total=nodes.reduce((sum,item)=>sum+(mode==="horizontal"?item.box.width:item.box.height),0);
  const gap=(span-total)/(nodes.length-1);
  let cursor=mode==="horizontal"?first.box.x:first.box.y;
  let next=clone(scene);
  for(const item of nodes){
    const delta=cursor-(mode==="horizontal"?item.box.x:item.box.y);
    next=updateNode(next,item.node.id,translated(item.node,mode==="horizontal"?delta:0,mode==="vertical"?delta:0) as unknown as Record<string,unknown>);
    cursor+=(mode==="horizontal"?item.box.width:item.box.height)+gap;
  }
  return next;
}

export interface Guide {axis:"x"|"y";value:number;source:"canvas"|"node"|"custom";nodeId?:string;}
export interface SnapResult {x:number;y:number;guides:Guide[];}

export function smartSnap(scene:VisualScene,point:{x:number;y:number},options:{grid?:number;threshold?:number;customGuides?:Guide[]}={}):SnapResult{
  const grid=options.grid??8,threshold=options.threshold??6;
  const guides:Guide[]=[
    {axis:"x",value:0,source:"canvas"},{axis:"x",value:scene.width/2,source:"canvas"},{axis:"x",value:scene.width,source:"canvas"},
    {axis:"y",value:0,source:"canvas"},{axis:"y",value:scene.height/2,source:"canvas"},{axis:"y",value:scene.height,source:"canvas"},
    ...(options.customGuides||[])
  ];
  for(const node of flattenNodes(scene.nodes)){
    const b=boundsOf(node);if(!b)continue;
    guides.push(
      {axis:"x",value:b.x,source:"node",nodeId:node.id},{axis:"x",value:b.x+b.width/2,source:"node",nodeId:node.id},{axis:"x",value:b.x+b.width,source:"node",nodeId:node.id},
      {axis:"y",value:b.y,source:"node",nodeId:node.id},{axis:"y",value:b.y+b.height/2,source:"node",nodeId:node.id},{axis:"y",value:b.y+b.height,source:"node",nodeId:node.id}
    );
  }
  let x=Math.round(point.x/grid)*grid,y=Math.round(point.y/grid)*grid;
  const used:Guide[]=[];
  let bestX=threshold+1,bestY=threshold+1;
  for(const guide of guides){
    const delta=Math.abs((guide.axis==="x"?point.x:point.y)-guide.value);
    if(guide.axis==="x"&&delta<bestX&&delta<=threshold){x=guide.value;bestX=delta;used.push(guide);}
    if(guide.axis==="y"&&delta<bestY&&delta<=threshold){y=guide.value;bestY=delta;used.push(guide);}
  }
  return {x,y,guides:used.filter(g=>(g.axis==="x"?g.value===x:g.value===y))};
}

export interface ScenePatch {op:"add"|"remove"|"update";id:string;before?:VisualNode;after?:VisualNode;}

export function diffScenes(before:VisualScene,after:VisualScene):ScenePatch[]{
  const a=new Map(flattenNodes(before.nodes).map(node=>[node.id,node] as const));
  const b=new Map(flattenNodes(after.nodes).map(node=>[node.id,node] as const));
  const out:ScenePatch[]=[];
  for(const [id,node] of a){
    const next=b.get(id);
    if(!next)out.push({op:"remove",id,before:clone(node)});
    else if(JSON.stringify(node)!==JSON.stringify(next))out.push({op:"update",id,before:clone(node),after:clone(next)});
  }
  for(const [id,node] of b)if(!a.has(id))out.push({op:"add",id,after:clone(node)});
  return out;
}

export interface VisualDocument {
  version:"1.0";
  id:string;
  title?:string;
  pages:VisualScene[];
  metadata?:Record<string,unknown>;
}

export function createDocument(id:string,pages:VisualScene[]=[createScene({id:id+"-page-1",width:1200,height:800,nodes:[]})]):VisualDocument{
  return {version:"1.0",id,pages:pages.map(clone),metadata:{}};
}

export function addPage(document:VisualDocument,page:VisualScene,index=document.pages.length):VisualDocument{
  const next=clone(document);next.pages.splice(Math.max(0,Math.min(index,next.pages.length)),0,clone(page));return next;
}
export function removePage(document:VisualDocument,pageId:string):VisualDocument{
  const next=clone(document);next.pages=next.pages.filter(page=>page.id!==pageId);return next;
}
export function reorderPage(document:VisualDocument,pageId:string,index:number):VisualDocument{
  const next=clone(document);const current=next.pages.findIndex(page=>page.id===pageId);if(current<0)return next;
  const [page]=next.pages.splice(current,1);next.pages.splice(Math.max(0,Math.min(index,next.pages.length)),0,page!);return next;
}
