import type { Diagnostic, VisualScene, VisualNode } from "./index.js";
import { boundsOf, flattenNodes } from "./index.js";
import { detectCollisions } from "./layout.js";

function hexToRgb(value:string){
  const hex=value.trim().replace("#","");
  if(!/^[0-9a-f]{6}$/i.test(hex))return null;
  return {r:parseInt(hex.slice(0,2),16),g:parseInt(hex.slice(2,4),16),b:parseInt(hex.slice(4,6),16)};
}
function luminance(rgb:{r:number;g:number;b:number}){
  const c=[rgb.r,rgb.g,rgb.b].map(v=>{const s=v/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4);});
  return .2126*c[0]!+.7152*c[1]!+.0722*c[2]!;
}
export function contrastRatio(a:string,b:string){
  const A=hexToRgb(a),B=hexToRgb(b);if(!A||!B)return null;
  const l1=luminance(A),l2=luminance(B);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}

export interface AdvancedQualityReport {
  score:number;
  diagnostics:Diagnostic[];
  metrics:{
    collisions:number;
    tinyText:number;
    lowContrast:number;
    density:number;
    edgeRisk:number;
  };
}

export function analyzeAdvancedQuality(scene:VisualScene):AdvancedQualityReport{
  const diagnostics:Diagnostic[]=[];
  const nodes=flattenNodes(scene.nodes).filter(n=>n.visible!==false);
  const collisions=detectCollisions(nodes.filter(n=>n.type!=="line"));
  collisions.slice(0,40).forEach(([a,b])=>diagnostics.push({level:"warning",code:"layout.collision",message:`Possible overlap between ${a} and ${b}`,nodeId:a}));
  let tinyText=0,lowContrast=0,edgeRisk=0,occupied=0;
  const background=scene.background??"#ffffff";
  for(const node of nodes){
    const box=boundsOf(node);
    if(box){
      occupied+=Math.max(0,Math.min(scene.width,box.x+box.width)-Math.max(0,box.x))*Math.max(0,Math.min(scene.height,box.y+box.height)-Math.max(0,box.y));
      if(box.x<8||box.y<8||box.x+box.width>scene.width-8||box.y+box.height>scene.height-8)edgeRisk++;
    }
    if(node.type==="text"){
      const size=node.style?.size??16;
      if(size<11){tinyText++;diagnostics.push({level:"warning",code:"text.too-small",message:"Text is below 11 px",nodeId:node.id});}
      const fill=node.paint?.fill;
      if(fill){
        const ratio=contrastRatio(fill,background);
        if(ratio!==null&&ratio<3){lowContrast++;diagnostics.push({level:"warning",code:"text.low-contrast",message:`Low contrast ratio ${ratio.toFixed(2)}`,nodeId:node.id});}
      }
    }
  }
  const density=Math.min(1,occupied/Math.max(1,scene.width*scene.height));
  const score=Math.max(0,100-collisions.length*1.5-tinyText*3-lowContrast*3-edgeRisk*.5-(density>.86?(density-.86)*100:0));
  return {score:Math.round(score*10)/10,diagnostics,metrics:{collisions:collisions.length,tinyText,lowContrast,density:Math.round(density*1000)/1000,edgeRisk}};
}
