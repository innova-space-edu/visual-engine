import test from "node:test";
import assert from "node:assert/strict";
import { createScene, sceneAtTime, sampleTimeline } from "../dist/index.js";

test("animation timeline interpolates deterministic node properties",()=>{
  const scene=createScene({id:"anim",width:100,height:100,nodes:[
    {id:"ball",type:"circle",cx:10,cy:50,r:5,paint:{fill:"#000000"}}
  ]});
  const timeline={duration:1000,tracks:[
    {nodeId:"ball",property:"cx",keyframes:[{time:0,value:10},{time:1000,value:90}]},
    {nodeId:"ball",property:"transform.opacity",keyframes:[{time:0,value:0},{time:1000,value:1}]}
  ]};
  const middle=sceneAtTime(scene,timeline,500);
  assert.equal(middle.nodes[0].cx,50);
  assert.equal(middle.nodes[0].transform.opacity,.5);
  assert.equal(sampleTimeline(scene,timeline,10).length,11);
});
