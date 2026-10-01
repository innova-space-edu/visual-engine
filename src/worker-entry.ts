import { analyzeAdvancedQuality } from "./quality.js";
import { analyzeQuality, renderSvg, type VisualScene } from "./index.js";

type Request =
  | {id:string;type:"render-svg";scene:VisualScene;pretty?:boolean}
  | {id:string;type:"quality";scene:VisualScene}
  | {id:string;type:"ping"};

const scope:any=globalThis;

scope.onmessage=(event:MessageEvent<Request>)=>{
  const req=event.data;
  try{
    if(req.type==="ping"){
      scope.postMessage({id:req.id,ok:true,result:{status:"ready"}});
      return;
    }
    if(req.type==="render-svg"){
      const started=performance.now();
      const svg=renderSvg(req.scene,!!req.pretty);
      scope.postMessage({id:req.id,ok:true,result:{svg,renderMs:performance.now()-started}});
      return;
    }
    if(req.type==="quality"){
      const started=performance.now();
      scope.postMessage({
        id:req.id,ok:true,
        result:{
          basic:analyzeQuality(req.scene),
          advanced:analyzeAdvancedQuality(req.scene),
          analyzeMs:performance.now()-started
        }
      });
    }
  }catch(error){
    scope.postMessage({id:req.id,ok:false,error:String(error)});
  }
};
