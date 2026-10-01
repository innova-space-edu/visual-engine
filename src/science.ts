import type { VisualNode } from "./index.js";

const ELEMENT_COLORS:Record<string,string>={H:"#f8fafc",C:"#334155",N:"#60a5fa",O:"#f87171",F:"#34d399",Cl:"#22c55e",S:"#facc15",P:"#fb923c"};

export function atom2D(id:string,symbol:string,x:number,y:number,options:{radius?:number;color?:string}={}):VisualNode[]{
  const radius=options.radius??28,color=options.color??ELEMENT_COLORS[symbol]??"#cbd5e1";
  return [
    {id:id+"-sphere",type:"circle",cx:x,cy:y,r:radius,paint:{fill:color,stroke:"#334155",strokeWidth:2}},
    {id:id+"-label",type:"text",x,y:y+6,text:symbol,style:{size:18,weight:800,align:"middle"},paint:{fill:symbol==="C"?"#ffffff":"#0f172a"}}
  ];
}

export function molecule(id:string,atoms:Array<{symbol:string;x:number;y:number}>,bonds:Array<{a:number;b:number;order?:1|2|3}>):VisualNode[]{
  const nodes:VisualNode[]=[];
  for(let i=0;i<bonds.length;i++){
    const bond=bonds[i]!,a=atoms[bond.a],b=atoms[bond.b];
    if(!a||!b)continue;
    const order=bond.order??1,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
    for(let line=0;line<order;line++){
      const offset=(line-(order-1)/2)*7;
      nodes.push({id:`${id}-bond-${i}-${line}`,type:"line",x1:a.x+nx*offset,y1:a.y+ny*offset,x2:b.x+nx*offset,y2:b.y+ny*offset,paint:{stroke:"#475569",strokeWidth:5,lineCap:"round"}});
    }
  }
  atoms.forEach((atom,index)=>nodes.push(...atom2D(`${id}-atom-${index}`,atom.symbol,atom.x,atom.y)));
  return nodes;
}

export function forceArrow(id:string,x:number,y:number,dx:number,dy:number,label:string):VisualNode[]{
  return [
    {id:id+"-arrow",type:"line",x1:x,y1:y,x2:x+dx,y2:y+dy,markerEnd:true,paint:{stroke:"#ea580c",strokeWidth:3,lineCap:"round"}},
    {id:id+"-label",type:"text",x:x+dx+8,y:y+dy-8,text:label,style:{size:17,weight:800},paint:{fill:"#c2410c"}}
  ];
}

export function thinLens(id:string,x:number,y:number,height=260,width=48):VisualNode[]{
  const top=y-height/2,bottom=y+height/2;
  return [{
    id,
    type:"path",
    d:`M ${x} ${top} Q ${x+width} ${y} ${x} ${bottom} Q ${x-width} ${y} ${x} ${top} Z`,
    paint:{fill:"#dbeafe",stroke:"#2563eb",strokeWidth:2,opacity:.75}
  }];
}
