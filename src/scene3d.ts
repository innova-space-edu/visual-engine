export interface Vec3 { x:number;y:number;z:number; }
export interface Transform3D { position?:Partial<Vec3>; rotation?:Partial<Vec3>; scale?:Partial<Vec3>; }
export interface Material3D { color?:string; roughness?:number; metalness?:number; opacity?:number; wireframe?:boolean; }

export type Visual3DNode =
  | {id:string;type:"group";transform?:Transform3D;children:Visual3DNode[]}
  | {id:string;type:"box";transform?:Transform3D;size?:Partial<Vec3>;material?:Material3D}
  | {id:string;type:"sphere";transform?:Transform3D;radius?:number;segments?:number;material?:Material3D}
  | {id:string;type:"cylinder";transform?:Transform3D;radiusTop?:number;radiusBottom?:number;height?:number;segments?:number;material?:Material3D}
  | {id:string;type:"line3d";transform?:Transform3D;points:Vec3[];material?:Material3D};

export interface Visual3DScene {
  version:"1.0";
  id:string;
  background?:string;
  camera?:{position?:Partial<Vec3>;target?:Partial<Vec3>;fov?:number;near?:number;far?:number};
  nodes:Visual3DNode[];
  metadata?:Record<string,unknown>;
}

export function create3DScene(input:Omit<Visual3DScene,"version">&{version?:"1.0"}):Visual3DScene{
  return {version:"1.0",id:input.id,background:input.background??"#f8fafc",camera:input.camera??{},nodes:input.nodes??[],metadata:input.metadata??{}};
}

export function molecule3D(id:string,atoms:Array<{symbol:string;position:Vec3;color?:string;radius?:number}>,bonds:Array<{a:number;b:number}>):Visual3DNode[]{
  const colors:Record<string,string>={H:"#f8fafc",C:"#334155",N:"#60a5fa",O:"#ef4444",F:"#22c55e",Cl:"#16a34a",S:"#eab308",P:"#f97316"};
  const nodes:Visual3DNode[]=[];
  atoms.forEach((atom,index)=>nodes.push({
    id:`${id}-atom-${index}`,type:"sphere",radius:atom.radius??(atom.symbol==="H"?.28:.42),
    transform:{position:atom.position},material:{color:atom.color??colors[atom.symbol]??"#94a3b8",roughness:.5,metalness:.05}
  }));
  bonds.forEach((bond,index)=>{
    const a=atoms[bond.a],b=atoms[bond.b];if(!a||!b)return;
    nodes.push({id:`${id}-bond-${index}`,type:"line3d",points:[a.position,b.position],material:{color:"#64748b"}});
  });
  return nodes;
}

export function axes3D(id:string,length=3):Visual3DNode[]{
  return [
    {id:id+"-x",type:"line3d",points:[{x:0,y:0,z:0},{x:length,y:0,z:0}],material:{color:"#ef4444"}},
    {id:id+"-y",type:"line3d",points:[{x:0,y:0,z:0},{x:0,y:length,z:0}],material:{color:"#22c55e"}},
    {id:id+"-z",type:"line3d",points:[{x:0,y:0,z:0},{x:0,y:0,z:length}],material:{color:"#3b82f6"}}
  ];
}
