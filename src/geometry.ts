export interface Point { x:number; y:number; }

export function distance(a:Point,b:Point){ return Math.hypot(b.x-a.x,b.y-a.y); }
export function midpoint(a:Point,b:Point):Point{ return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}; }

export function homothety(point:Point,center:Point,k:number):Point{
  return {x:center.x+k*(point.x-center.x),y:center.y+k*(point.y-center.y)};
}

export function rotate(point:Point,center:Point,degrees:number):Point{
  const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r),dx=point.x-center.x,dy=point.y-center.y;
  return {x:center.x+dx*c-dy*s,y:center.y+dx*s+dy*c};
}

export function lineIntersection(a1:Point,a2:Point,b1:Point,b2:Point):Point|null{
  const dax=a2.x-a1.x,day=a2.y-a1.y,dbx=b2.x-b1.x,dby=b2.y-b1.y;
  const den=dax*dby-day*dbx;
  if(Math.abs(den)<1e-12)return null;
  const t=((b1.x-a1.x)*dby-(b1.y-a1.y)*dbx)/den;
  return {x:a1.x+t*dax,y:a1.y+t*day};
}

export function polygonArea(points:Point[]):number{
  let sum=0;
  for(let i=0;i<points.length;i++){
    const a=points[i]!,b=points[(i+1)%points.length]!;
    sum+=a.x*b.y-b.x*a.y;
  }
  return sum/2;
}

export function boundingBox(points:Point[]){
  if(!points.length)return {x:0,y:0,width:0,height:0};
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  return {x:minX,y:minY,width:maxX-minX,height:maxY-minY};
}

export function sampleFunction(fn:(x:number)=>number,from:number,to:number,steps=256):Point[]{
  const count=Math.max(2,Math.floor(steps)),out:Point[]=[];
  for(let i=0;i<count;i++){
    const x=from+(to-from)*(i/(count-1)),y=fn(x);
    if(Number.isFinite(y))out.push({x,y});
  }
  return out;
}

export function toSvgPath(points:Point[],closed=false){
  if(!points.length)return "";
  return "M "+points.map((p,i)=>(i?"L ":"")+p.x+" "+p.y).join(" ")+(closed?" Z":"");
}
