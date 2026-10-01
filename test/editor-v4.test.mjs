import test from "node:test";
import assert from "node:assert/strict";
import {
  createScene,selectionBounds,alignNodes,distributeNodes,groupNodes,ungroupNode,diffScenes,
  createDocument,addPage,VisualLearningEngineV2
} from "../dist/index.js";

const scene=createScene({id:"s",width:500,height:400,nodes:[
  {id:"a",type:"rect",x:20,y:20,width:50,height:50},
  {id:"b",type:"rect",x:140,y:80,width:50,height:50},
  {id:"c",type:"rect",x:280,y:140,width:50,height:50}
]});

test("editor selection alignment grouping and distribution",()=>{
  assert.deepEqual(selectionBounds(scene,["a","b"]),{x:20,y:20,width:170,height:110});
  const aligned=alignNodes(scene,["a","b"],"top");
  assert.equal(aligned.nodes[1].y,20);
  const distributed=distributeNodes(scene,["a","b","c"],"horizontal");
  assert.equal(distributed.nodes.length,3);
  const grouped=groupNodes(scene,["a","b"],"g");
  assert.equal(grouped.nodes.some(n=>n.id==="g"),true);
  const ungrouped=ungroupNode(grouped,"g");
  assert.equal(ungrouped.nodes.some(n=>n.id==="a"),true);
});

test("scene diff and multipage documents",()=>{
  const changed=alignNodes(scene,["a","b"],"left");
  assert.ok(diffScenes(scene,changed).length>=1);
  const doc=addPage(createDocument("d",[scene]),createScene({id:"p2",width:500,height:400,nodes:[]}));
  assert.equal(doc.pages.length,2);
});

test("learning v2 learns edited numeric parameters",()=>{
  const engine=new VisualLearningEngineV2();
  for(let i=0;i<5;i++){
    const after=alignNodes(scene,["a","b"],"left");
    engine.learnEdit(scene,after,{key:"math.diagram"});
  }
  const rec=engine.recommend("skill","math.diagram","rect","x",20);
  assert.equal(rec.learned,true);
  assert.ok(rec.samples>=3);
});
