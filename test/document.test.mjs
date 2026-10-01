import test from "node:test";
import assert from "node:assert/strict";
import { createScene, updateNode, findNode, SceneHistory, snapPoint } from "../dist/index.js";

test("document edits are immutable and addressable",function(){
  const base=createScene({id:"doc",width:400,height:300,nodes:[{id:"r",type:"rect",x:10,y:20,width:100,height:50}]});
  const next=updateNode(base,"r",{x:80});
  assert.equal(findNode(base,"r").x,10);
  assert.equal(findNode(next,"r").x,80);
});

test("history supports undo and redo",function(){
  const base=createScene({id:"doc",width:400,height:300,nodes:[{id:"r",type:"rect",x:10,y:20,width:100,height:50}]});
  const history=new SceneHistory(base);
  history.commit(updateNode(base,"r",{x:90}),"move");
  assert.equal(findNode(history.undo(),"r").x,10);
  assert.equal(findNode(history.redo(),"r").x,90);
});

test("grid snapping is threshold aware",function(){
  assert.deepEqual(snapPoint({x:15,y:33},8,3),{x:16,y:32});
});
