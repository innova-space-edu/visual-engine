import type { VisualNode } from "./index.js";

export interface ChartSeries { id:string; values:number[]; label?:string; }
export interface ChartFrame { x:number;y:number;width:number;height:number; }

export function barChart(id:string,values:number[],frame:ChartFrame,options:{labels?:string[];min?:number;max?:number}={}):VisualNode[]{
  const finite=values.map(v=>Number(v)).filter(Number.isFinite);
  const min=options.min??Math.min(0,...finite),max=options.max??Math.max(1,...finite);
  const span=Math.max(1e-9,max-min),gap=Math.min(18,frame.width/Math.max(1,values.length*4));
  const width=(frame.width-gap*(values.length+1))/Math.max(1,values.length);
  const nodes:VisualNode[]=[];
  values.forEach((value,index)=>{
    const ratio=(value-min)/span,height=Math.max(0,ratio*frame.height),x=frame.x+gap+index*(width+gap),y=frame.y+frame.height-height;
    nodes.push({id:`${id}-bar-${index}`,type:"rect",x,y,width,height,rx:Math.min(8,width/4),paint:{fill:"#dbeafe",stroke:"#2563eb",strokeWidth:1.5}});
    nodes.push({id:`${id}-value-${index}`,type:"text",x:x+width/2,y:y-8,text:String(value),style:{size:13,weight:700,align:"middle"},paint:{fill:"#1d4ed8"}});
    if(options.labels?.[index])nodes.push({id:`${id}-label-${index}`,type:"text",x:x+width/2,y:frame.y+frame.height+22,text:String(options.labels[index]),style:{size:12,align:"middle"},paint:{fill:"#64748b"}});
  });
  return nodes;
}

export function lineChart(id:string,values:number[],frame:ChartFrame,options:{min?:number;max?:number}={}):VisualNode[]{
  const finite=values.filter(Number.isFinite),min=options.min??Math.min(...finite,0),max=options.max??Math.max(...finite,1),span=Math.max(1e-9,max-min);
  const points=values.map((value,index)=>[
    frame.x+(values.length<=1?frame.width/2:index*frame.width/(values.length-1)),
    frame.y+frame.height-(value-min)/span*frame.height
  ] as [number,number]);
  return [
    {id:id+"-line",type:"polyline",points,paint:{fill:"none",stroke:"#2563eb",strokeWidth:3,lineJoin:"round",lineCap:"round"}},
    ...points.map((p,index)=>({id:`${id}-dot-${index}`,type:"circle" as const,cx:p[0],cy:p[1],r:4,paint:{fill:"#ffffff",stroke:"#2563eb",strokeWidth:2}}))
  ];
}

export function scatterPlot(id:string,points:Array<{x:number;y:number}>,frame:ChartFrame):VisualNode[]{
  if(!points.length)return [];
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const dx=Math.max(1e-9,maxX-minX),dy=Math.max(1e-9,maxY-minY);
  return points.map((p,index)=>({id:`${id}-point-${index}`,type:"circle",cx:frame.x+(p.x-minX)/dx*frame.width,cy:frame.y+frame.height-(p.y-minY)/dy*frame.height,r:4,paint:{fill:"#7c3aed",opacity:.8}}));
}
