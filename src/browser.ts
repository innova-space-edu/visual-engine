export * from "./index.js";

declare global {
  interface Window {
    CanvasKitInit?: (options?:any)=>Promise<any>;
  }
}

let canvasKitPromise:Promise<any>|null=null;

function loadScript(src:string):Promise<void>{
  return new Promise(function(resolve,reject){
    const existing=document.querySelector('script[data-visual-engine-canvaskit="1"]') as HTMLScriptElement|null;
    if(existing){
      if(window.CanvasKitInit){resolve();return;}
      existing.addEventListener("load",function(){resolve();},{once:true});
      existing.addEventListener("error",function(){reject(new Error("CanvasKit script failed to load"));},{once:true});
      return;
    }
    const script=document.createElement("script");
    script.src=src;
    script.async=true;
    script.dataset.visualEngineCanvaskit="1";
    script.onload=function(){resolve();};
    script.onerror=function(){reject(new Error("CanvasKit script failed to load: "+src));};
    document.head.appendChild(script);
  });
}

export async function loadCanvasKit(options:{scriptUrl?:string;wasmUrl?:string}={}):Promise<any>{
  if(typeof window==="undefined")throw new Error("CanvasKit browser loader requires a DOM");
  if(!canvasKitPromise){
    canvasKitPromise=(async function(){
      const scriptUrl=options.scriptUrl||"/wasm/canvaskit.js";
      const wasmUrl=options.wasmUrl||"/wasm/canvaskit.wasm";
      if(!window.CanvasKitInit)await loadScript(scriptUrl);
      if(!window.CanvasKitInit)throw new Error("CanvasKitInit was not exposed by the self-hosted script");
      return window.CanvasKitInit({locateFile:function(file:string){return file.endsWith(".wasm")?wasmUrl:file;}});
    })();
  }
  return canvasKitPromise;
}

export async function loadThreeWebGPU():Promise<any>{
  return import("three/webgpu");
}

export async function yogaLayoutAvailable():Promise<boolean>{
  try{await import("yoga-layout");return true;}catch{return false;}
}
