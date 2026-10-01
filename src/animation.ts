import type { VisualNode, VisualScene } from "./index.js";
import { updateNode } from "./document.js";

export type EasingName="linear"|"ease-in"|"ease-out"|"ease-in-out";

export interface NumericKeyframe { time:number; value:number; easing?:EasingName; }
export interface AnimationTrack {
  nodeId:string;
  property:string;
  keyframes:NumericKeyframe[];
}
export interface VisualTimeline {
  duration:number;
  loop?:boolean;
  tracks:AnimationTrack[];
}

function ease(t:number,name:EasingName="linear"){
  const x=Math.max(0,Math.min(1,t));
  if(name==="ease-in")return x*x;
  if(name==="ease-out")return 1-(1-x)*(1-x);
  if(name==="ease-in-out")return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
  return x;
}

function valueAt(track:AnimationTrack,time:number){
  const frames=track.keyframes.slice().sort((a,b)=>a.time-b.time);
  if(!frames.length)return undefined;
  if(time<=frames[0]!.time)return frames[0]!.value;
  if(time>=frames[frames.length-1]!.time)return frames[frames.length-1]!.value;
  for(let i=0;i<frames.length-1;i++){
    const a=frames[i]!,b=frames[i+1]!;
    if(time>=a.time&&time<=b.time){
      const t=ease((time-a.time)/Math.max(1e-9,b.time-a.time),b.easing??a.easing??"linear");
      return a.value+(b.value-a.value)*t;
    }
  }
  return frames[frames.length-1]!.value;
}

function patchPath(node:VisualNode,path:string,value:number):Record<string,unknown>{
  const parts=path.split(".");
  if(parts.length===1)return {[path]:value};
  if(parts.length===2&&parts[0]==="transform"){
    return {transform:{...(node.transform??{}),[parts[1]!]:value}};
  }
  if(parts.length===2&&parts[0]==="paint"){
    return {paint:{...(node.paint??{}),[parts[1]!]:value}};
  }
  throw new Error("Unsupported animation property: "+path);
}

function findNode(scene:VisualScene,id:string):VisualNode|null{
  const stack=[...scene.nodes];
  while(stack.length){
    const node=stack.shift()!;
    if(node.id===id)return node;
    if(node.type==="group")stack.unshift(...node.children);
  }
  return null;
}

export function sceneAtTime(scene:VisualScene,timeline:VisualTimeline,time:number):VisualScene{
  const duration=Math.max(0,timeline.duration);
  const local=timeline.loop&&duration>0?((time%duration)+duration)%duration:Math.max(0,Math.min(duration,time));
  let next=structuredClone(scene);
  for(const track of timeline.tracks){
    const value=valueAt(track,local);
    if(value===undefined)continue;
    const node=findNode(next,track.nodeId);
    if(!node)continue;
    next=updateNode(next,track.nodeId,patchPath(node,track.property,value));
  }
  return next;
}

export function sampleTimeline(scene:VisualScene,timeline:VisualTimeline,fps=30){
  const rate=Math.max(1,Math.floor(fps));
  const frames=Math.max(1,Math.floor(timeline.duration/1000*rate)+1);
  return Array.from({length:frames},(_,index)=>{
    const time=Math.min(timeline.duration,index*1000/rate);
    return {time,scene:sceneAtTime(scene,timeline,time)};
  });
}
