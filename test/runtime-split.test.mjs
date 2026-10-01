import test from "node:test";
import assert from "node:assert/strict";

test("runtime entries remain isolated", async function(){
  const core=await import("../dist/index.js");
  const node=await import("../dist/node.js");
  const browser=await import("../dist/browser.js");

  assert.equal(typeof core.visualEngine.renderSvg,"function");
  assert.equal(typeof core.visualEngine.renderPng,"undefined");
  assert.equal(typeof node.nodeVisualEngine.renderPng,"function");
  assert.equal(typeof node.hydrateMath,"function");
  assert.equal(typeof browser.loadCanvasKit,"function");
  assert.equal(typeof browser.loadThreeWebGPU,"function");
});
