import type {VisualNode,VisualScene} from "./index.js";
import {flattenNodes} from "./index.js";

export interface SceneLearningSummary {
  sceneId:string;
  width:number;
  height:number;
  nodeCount:number;
  nodeTypes:Record<string,number>;
  textNodes:number;
  textCharacters:number;
  mathNodes:number;
  mathCharacters:number;
  imageNodes:number;
  assetIds:string[];
  visualType?:string;
  selectedSkills:string[];
}

export function summarizeSceneForLearning(scene:VisualScene):SceneLearningSummary{
  const nodes=flattenNodes(scene.nodes);
  const nodeTypes:Record<string,number>={};
  const assetIds=new Set<string>();
  let textNodes=0,textCharacters=0,mathNodes=0,mathCharacters=0,imageNodes=0;
  for(const node of nodes){
    nodeTypes[node.type]=(nodeTypes[node.type]||0)+1;
    if(node.type==="text"){textNodes++;textCharacters+=node.text.length;}
    if(node.type==="math"){mathNodes++;mathCharacters+=node.latex.length;}
    if(node.type==="image")imageNodes++;
    const assetId=node.metadata?.assetId;
    if(typeof assetId==="string")assetIds.add(assetId);
  }
  const selected=scene.metadata?.selected_skills;
  return {
    sceneId:scene.id,width:scene.width,height:scene.height,nodeCount:nodes.length,nodeTypes,
    textNodes,textCharacters,mathNodes,mathCharacters,imageNodes,assetIds:[...assetIds].sort(),
    visualType:typeof scene.metadata?.visual_type==="string"?scene.metadata.visual_type:undefined,
    selectedSkills:Array.isArray(selected)?selected.map(String):[]
  };
}

export function summarizeNodeForLearning(node:VisualNode){
  const out:Record<string,unknown>={id:node.id,type:node.type,visible:node.visible!==false,locked:!!node.locked,zIndex:node.zIndex||0};
  if(node.paint)out.paint={fill:node.paint.fill,stroke:node.paint.stroke,strokeWidth:node.paint.strokeWidth,opacity:node.paint.opacity};
  if(node.transform)out.transform={...node.transform};
  if(node.type==="text")out.text={characters:node.text.length,lines:node.text.split("\n").length,size:node.style?.size,weight:node.style?.weight,maxWidth:node.maxWidth};
  if(node.type==="math")out.math={characters:node.latex.length,scale:node.scale};
  if(node.type==="image")out.image={width:node.width,height:node.height,fit:node.fit};
  return out;
}
