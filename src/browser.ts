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

import type { Visual3DNode, Visual3DScene } from "./scene3d.js";

function applyTransform3D(object:any,transform:any={}){
  const p=transform.position||{},r=transform.rotation||{},s=transform.scale||{};
  object.position.set(p.x??0,p.y??0,p.z??0);
  object.rotation.set(r.x??0,r.y??0,r.z??0);
  object.scale.set(s.x??1,s.y??1,s.z??1);
}

export async function renderThreeScene(canvas:HTMLCanvasElement,definition:Visual3DScene,options:{antialias?:boolean;forceWebGL?:boolean}={}){
  const THREE:any=await loadThreeWebGPU();
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(definition.background??"#f8fafc");
  const cameraDef=definition.camera??{};
  const camera=new THREE.PerspectiveCamera(cameraDef.fov??45,Math.max(1,canvas.clientWidth||canvas.width)/Math.max(1,canvas.clientHeight||canvas.height),cameraDef.near??.01,cameraDef.far??1000);
  const cp=cameraDef.position??{x:4,y:3,z:6};
  camera.position.set(cp.x??4,cp.y??3,cp.z??6);
  const target=cameraDef.target??{x:0,y:0,z:0};
  camera.lookAt(target.x??0,target.y??0,target.z??0);

  scene.add(new THREE.HemisphereLight(0xffffff,0x334155,2));
  const directional=new THREE.DirectionalLight(0xffffff,3);
  directional.position.set(4,6,5);
  scene.add(directional);

  const materials:any[]=[];
  const geometries:any[]=[];
  const objects:any[]=[];

  const materialFor=(m:any={})=>{
    const mat=new THREE.MeshStandardMaterial({
      color:m.color??"#94a3b8",
      roughness:m.roughness??.6,
      metalness:m.metalness??.05,
      transparent:(m.opacity??1)<1,
      opacity:m.opacity??1,
      wireframe:!!m.wireframe
    });
    materials.push(mat);return mat;
  };

  const build=(node:Visual3DNode):any=>{
    let object:any;
    if(node.type==="group"){
      object=new THREE.Group();
      node.children.forEach(child=>object.add(build(child)));
    }else if(node.type==="box"){
      const size=node.size??{};
      const g=new THREE.BoxGeometry(size.x??1,size.y??1,size.z??1);geometries.push(g);
      object=new THREE.Mesh(g,materialFor(node.material));
    }else if(node.type==="sphere"){
      const g=new THREE.SphereGeometry(node.radius??.5,node.segments??32,node.segments??32);geometries.push(g);
      object=new THREE.Mesh(g,materialFor(node.material));
    }else if(node.type==="cylinder"){
      const g=new THREE.CylinderGeometry(node.radiusTop??.5,node.radiusBottom??.5,node.height??1,node.segments??32);geometries.push(g);
      object=new THREE.Mesh(g,materialFor(node.material));
    }else{
      const g=new THREE.BufferGeometry().setFromPoints(node.points.map(p=>new THREE.Vector3(p.x,p.y,p.z)));geometries.push(g);
      const mat=new THREE.LineBasicMaterial({color:node.material?.color??"#475569",transparent:(node.material?.opacity??1)<1,opacity:node.material?.opacity??1});materials.push(mat);
      object=new THREE.Line(g,mat);
    }
    object.name=node.id;
    applyTransform3D(object,node.transform);
    objects.push(object);
    return object;
  };
  definition.nodes.forEach(node=>scene.add(build(node)));

  const renderer=new THREE.WebGPURenderer({canvas,antialias:options.antialias??true,forceWebGL:options.forceWebGL??false});
  await renderer.init();
  const resize=()=>{
    const width=Math.max(1,canvas.clientWidth||canvas.width),height=Math.max(1,canvas.clientHeight||canvas.height);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
  };
  resize();
  renderer.render(scene,camera);

  return {
    renderer,scene,camera,
    render(){resize();renderer.render(scene,camera);},
    dispose(){
      geometries.forEach(g=>g.dispose?.());
      materials.forEach(m=>m.dispose?.());
      renderer.dispose?.();
    }
  };
}
