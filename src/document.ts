import type { VisualNode, VisualScene } from "./index.js";

function clone<T>(value:T):T {
  if(typeof structuredClone==="function")return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function findNode(scene:VisualScene,id:string):VisualNode|null {
  const visit=(nodes:VisualNode[]):VisualNode|null=>{
    for(const node of nodes){
      if(node.id===id)return node;
      if(node.type==="group"){
        const found=visit(node.children);
        if(found)return found;
      }
    }
    return null;
  };
  return visit(scene.nodes);
}

function mapNodes(nodes:VisualNode[],fn:(node:VisualNode)=>VisualNode|null):VisualNode[] {
  const out:VisualNode[]=[];
  for(const original of nodes){
    let node=original;
    if(node.type==="group")node=Object.assign({},node,{children:mapNodes(node.children,fn)});
    const next=fn(node);
    if(next)out.push(next);
  }
  return out;
}

export function updateNode(scene:VisualScene,id:string,patch:Record<string,unknown>):VisualScene {
  const next=clone(scene);
  next.nodes=mapNodes(next.nodes,function(node){
    return node.id===id ? Object.assign({},node,patch) as VisualNode : node;
  });
  return next;
}

export function removeNode(scene:VisualScene,id:string):VisualScene {
  const next=clone(scene);
  next.nodes=mapNodes(next.nodes,function(node){return node.id===id?null:node;});
  return next;
}

export function addNode(scene:VisualScene,node:VisualNode,parentId?:string):VisualScene {
  const next=clone(scene);
  if(!parentId){
    next.nodes.push(clone(node));
    return next;
  }
  let inserted=false;
  next.nodes=mapNodes(next.nodes,function(current){
    if(current.id===parentId&&current.type==="group"){
      inserted=true;
      return Object.assign({},current,{children:current.children.concat([clone(node)])});
    }
    return current;
  });
  if(!inserted)throw new Error("Parent group not found: "+parentId);
  return next;
}

export function reorderNode(scene:VisualScene,id:string,zIndex:number):VisualScene {
  return updateNode(scene,id,{zIndex:zIndex});
}

export function snapValue(value:number,grid=8,threshold=4):number {
  if(grid<=0)return value;
  const snapped=Math.round(value/grid)*grid;
  return Math.abs(snapped-value)<=threshold?snapped:value;
}

export function snapPoint(point:{x:number;y:number},grid=8,threshold=4){
  return {x:snapValue(point.x,grid,threshold),y:snapValue(point.y,grid,threshold)};
}

export interface HistorySnapshot {
  scene:VisualScene;
  label?:string;
  timestamp:number;
}

export class SceneHistory {
  private past:HistorySnapshot[]=[];
  private future:HistorySnapshot[]=[];
  private currentSnapshot:HistorySnapshot;
  readonly limit:number;

  constructor(scene:VisualScene,limit=100){
    this.currentSnapshot={scene:clone(scene),label:"initial",timestamp:Date.now()};
    this.limit=Math.max(1,limit);
  }

  current():VisualScene {return clone(this.currentSnapshot.scene);}
  canUndo():boolean {return this.past.length>0;}
  canRedo():boolean {return this.future.length>0;}

  commit(scene:VisualScene,label?:string):VisualScene {
    this.past.push(this.currentSnapshot);
    if(this.past.length>this.limit)this.past.shift();
    this.currentSnapshot={scene:clone(scene),label:label,timestamp:Date.now()};
    this.future=[];
    return this.current();
  }

  undo():VisualScene {
    const previous=this.past.pop();
    if(!previous)return this.current();
    this.future.push(this.currentSnapshot);
    this.currentSnapshot=previous;
    return this.current();
  }

  redo():VisualScene {
    const next=this.future.pop();
    if(!next)return this.current();
    this.past.push(this.currentSnapshot);
    this.currentSnapshot=next;
    return this.current();
  }

  reset(scene:VisualScene):void {
    this.past=[];
    this.future=[];
    this.currentSnapshot={scene:clone(scene),label:"reset",timestamp:Date.now()};
  }
}
