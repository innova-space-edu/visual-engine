import test from "node:test";
import assert from "node:assert/strict";
import {
  wrapText, fitText, gridLayout, homothety, lineIntersection,
  barChart, molecule, analyzeAdvancedQuality, createScene
} from "../dist/index.js";

test("text wraps and fits deterministically",()=>{
  const lines=wrapText("uno dos tres cuatro",55,{size:16});
  assert.ok(lines.length>1);
  const fitted=fitText("Texto largo para una caja",120,50,{size:28},{minSize:10});
  assert.ok(fitted.style.size>=10);
});

test("layout and geometry primitives work",()=>{
  const grid=gridLayout([{id:"a"},{id:"b"}],{x:0,y:0,width:200,height:100},{columns:2,gap:10});
  assert.equal(Object.keys(grid).length,2);
  assert.deepEqual(homothety({x:2,y:2},{x:0,y:0},2),{x:4,y:4});
  assert.deepEqual(lineIntersection({x:0,y:0},{x:10,y:10},{x:0,y:10},{x:10,y:0}),{x:5,y:5});
});

test("charts science and advanced quality produce scene nodes",()=>{
  const nodes=[
    ...barChart("bars",[1,2,3],{x:20,y:20,width:300,height:160}),
    ...molecule("water",[{symbol:"H",x:100,y:300},{symbol:"O",x:160,y:300},{symbol:"H",x:220,y:300}],[{a:0,b:1},{a:1,b:2}])
  ];
  assert.ok(nodes.length>5);
  const scene=createScene({id:"v2",width:400,height:400,nodes});
  const quality=analyzeAdvancedQuality(scene);
  assert.ok(quality.score>=0&&quality.score<=100);
});
