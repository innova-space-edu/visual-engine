import test from "node:test";
import assert from "node:assert/strict";
import { createScene, parseVisualDSL, renderSvg, analyzeQuality } from "../dist/index.js";

test("renders deterministic SVG", function(){
  const scene=createScene({id:"t",width:400,height:300,nodes:[{id:"r",type:"rect",x:10,y:20,width:100,height:50,paint:{fill:"#fff"}}]});
  const svg=renderSvg(scene);
  assert.match(svg,/id="r"/);
  assert.match(svg,/viewBox="0 0 400 300"/);
});

test("DSL creates editable scene", function(){
  const scene=parseVisualDSL("CANVAS 800x600\nTITLE \"Test\"\nRECT 20 120 300 100\nMATH 40 180 \"x^2+y^2=r^2\"");
  assert.equal(scene.width,800);
  assert.ok(scene.nodes.length>=3);
  assert.equal(analyzeQuality(scene).valid,true);
});
