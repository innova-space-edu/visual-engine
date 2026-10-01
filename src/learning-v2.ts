import type { VisualScene } from "./index.js";
import { diffScenes, type ScenePatch } from "./editor.js";

export type LearningScope="global"|"skill"|"template"|"asset"|"style"|"user";

export interface VisualLearningEvent {
  id:string;
  timestamp:number;
  scope:LearningScope;
  key:string;
  action:"generate"|"edit"|"accept"|"reject"|"export";
  quality?:number;
  durationMs?:number;
  patches?:ScenePatch[];
  context?:Record<string,string|number|boolean>;
}

export interface ParameterStat {
  path:string;
  samples:number;
  mean:number;
  variance:number;
  min:number;
  max:number;
  confidence:number;
}

export interface PreferenceStat {
  key:string;
  samples:number;
  positive:number;
  negative:number;
  score:number;
}

export interface LearningSnapshotV2 {
  version:"2.0";
  events:number;
  parameters:Record<string,ParameterStat>;
  preferences:Record<string,PreferenceStat>;
  updatedAt:number;
}

function updateParameter(prev:ParameterStat|undefined,path:string,value:number):ParameterStat{
  if(!prev)return {path,samples:1,mean:value,variance:0,min:value,max:value,confidence:1-Math.exp(-1/12)};
  const samples=prev.samples+1;
  const delta=value-prev.mean;
  const mean=prev.mean+delta/samples;
  const variance=((prev.variance*(prev.samples-1))+delta*(value-mean))/Math.max(1,samples-1);
  return {path,samples,mean,variance,min:Math.min(prev.min,value),max:Math.max(prev.max,value),confidence:1-Math.exp(-samples/12)};
}

function numericLeaves(value:unknown,prefix="",out:Array<{path:string;value:number}>=[]){
  if(typeof value==="number"&&Number.isFinite(value)){out.push({path:prefix,value});return out;}
  if(!value||typeof value!=="object")return out;
  for(const [key,child] of Object.entries(value as Record<string,unknown>)){
    if(["timestamp","zIndex"].includes(key))continue;
    numericLeaves(child,prefix?prefix+"."+key:key,out);
  }
  return out;
}

export class VisualLearningEngineV2 {
  private eventCount=0;
  private readonly parameters=new Map<string,ParameterStat>();
  private readonly preferences=new Map<string,PreferenceStat>();

  record(event:VisualLearningEvent){
    this.eventCount++;
    if(event.action==="accept"||event.action==="reject"||event.action==="export"){
      const id=event.scope+":"+event.key;
      const prev=this.preferences.get(id)??{key:id,samples:0,positive:0,negative:0,score:.5};
      const positive=event.action==="reject"?prev.positive:prev.positive+1;
      const negative=event.action==="reject"?prev.negative+1:prev.negative;
      const samples=prev.samples+1;
      const prior=2;
      const score=(positive+prior)/(samples+prior*2);
      this.preferences.set(id,{key:id,samples,positive,negative,score});
    }

    if(event.action==="edit"&&event.patches){
      for(const patch of event.patches){
        if(patch.op!=="update"||!patch.before||!patch.after)continue;
        const before=new Map(numericLeaves(patch.before).map(x=>[x.path,x.value]));
        for(const leaf of numericLeaves(patch.after)){
          const old=before.get(leaf.path);
          if(old===undefined||old===leaf.value)continue;
          const path=event.scope+":"+event.key+":"+patch.after.type+":"+leaf.path;
          this.parameters.set(path,updateParameter(this.parameters.get(path),path,leaf.value));
        }
      }
    }
  }

  learnEdit(before:VisualScene,after:VisualScene,options:{scope?:LearningScope;key:string;quality?:number;durationMs?:number;context?:Record<string,string|number|boolean>}){
    const event:VisualLearningEvent={
      id:"evt-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),
      timestamp:Date.now(),scope:options.scope??"skill",key:options.key,action:"edit",
      quality:options.quality,durationMs:options.durationMs,context:options.context,patches:diffScenes(before,after)
    };
    this.record(event);return event;
  }

  recommend(scope:LearningScope,key:string,nodeType:string,path:string,fallback:number){
    const stat=this.parameters.get(scope+":"+key+":"+nodeType+":"+path);
    if(!stat||stat.samples<3)return {value:fallback,learned:false,confidence:0,samples:stat?.samples??0};
    return {value:stat.mean,learned:true,confidence:stat.confidence,samples:stat.samples};
  }

  rank(scope:LearningScope,keys:string[]){
    return keys.map(key=>{
      const id=scope+":"+key;
      return this.preferences.get(id)??{key:id,samples:0,positive:0,negative:0,score:.5};
    }).sort((a,b)=>b.score-a.score||b.samples-a.samples);
  }

  snapshot():LearningSnapshotV2{
    return {
      version:"2.0",events:this.eventCount,updatedAt:Date.now(),
      parameters:Object.fromEntries(this.parameters),
      preferences:Object.fromEntries(this.preferences)
    };
  }

  restore(snapshot:LearningSnapshotV2){
    if(snapshot.version!=="2.0")throw new Error("Unsupported V2 learning snapshot");
    this.eventCount=snapshot.events;
    this.parameters.clear();this.preferences.clear();
    Object.entries(snapshot.parameters).forEach(([key,value])=>this.parameters.set(key,value));
    Object.entries(snapshot.preferences).forEach(([key,value])=>this.preferences.set(key,value));
  }
}
