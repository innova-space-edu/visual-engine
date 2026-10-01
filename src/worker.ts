import type { VisualScene } from "./index.js";

export interface WorkerRenderResult { svg:string; renderMs:number; }
export interface WorkerQualityResult { basic:unknown; advanced:unknown; analyzeMs:number; }

export class VisualWorkerClient {
  private readonly worker:Worker;
  private readonly pending=new Map<string,{resolve:(value:any)=>void;reject:(error:Error)=>void}>();
  private seq=0;

  constructor(worker?:Worker){
    if(typeof Worker==="undefined")throw new Error("Web Workers are unavailable in this runtime");
    this.worker=worker??new Worker(new URL("./worker-entry.js",import.meta.url),{type:"module",name:"visual-engine-worker"});
    this.worker.onmessage=(event)=>{
      const data=event.data||{};
      const item=this.pending.get(String(data.id));
      if(!item)return;
      this.pending.delete(String(data.id));
      if(data.ok)item.resolve(data.result);
      else item.reject(new Error(String(data.error||"Visual worker failed")));
    };
    this.worker.onerror=(event)=>{
      const error=new Error(event.message||"Visual worker error");
      for(const item of this.pending.values())item.reject(error);
      this.pending.clear();
    };
  }

  private request<T>(type:string,payload:Record<string,unknown>={}):Promise<T>{
    const id="vw-"+(++this.seq);
    return new Promise<T>((resolve,reject)=>{
      this.pending.set(id,{resolve,reject});
      this.worker.postMessage({id,type,...payload});
    });
  }

  ping(){return this.request<{status:string}>("ping");}
  renderSvg(scene:VisualScene,pretty=false){return this.request<WorkerRenderResult>("render-svg",{scene,pretty});}
  analyze(scene:VisualScene){return this.request<WorkerQualityResult>("quality",{scene});}

  terminate(){
    this.worker.terminate();
    for(const item of this.pending.values())item.reject(new Error("Visual worker terminated"));
    this.pending.clear();
  }
}

export function offscreenCanvasAvailable(){
  return typeof OffscreenCanvas!=="undefined";
}
