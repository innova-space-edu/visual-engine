import test from "node:test";
import assert from "node:assert/strict";
import {
  createOptimizationCandidate,optimizeParameters,compareRegressionMetrics,runRegressionSuite,
  VisualExperimentEngine,createScene,summarizeSceneForLearning
} from "../dist/index.js";

test("optimizer emits evidence-backed candidate",()=>{
  const observations=[];
  for(let i=0;i<20;i++)observations.push({
    skill:"chemistry-diagram",nodeType:"math",path:"scale",before:1,after:1.12,
    qualityBefore:80,qualityAfter:92,accepted:true,exported:i%2===0
  });
  const recs=optimizeParameters(observations,{minSamples:8,minConfidence:.5});
  assert.equal(recs[0].recommendedValue,1.12);
  const candidate=createOptimizationCandidate({skill:"chemistry-diagram",observations,minConfidence:.5});
  assert.ok(candidate);
  assert.equal(candidate.skill,"chemistry-diagram");
});

test("regression blocks quality and overflow regressions",async()=>{
  const bad=compareRegressionMetrics({quality:95,semantic:98,overflow:0,renderMs:20},{quality:90,semantic:98,overflow:2,renderMs:22});
  assert.equal(bad.passed,false);
  const suite=await runRegressionSuite([{id:"a",input:1}],()=>({quality:90,semantic:95,overflow:0}),()=>({quality:94,semantic:96,overflow:0}));
  assert.equal(suite.passed,true);
});

test("experiment explores then converges",()=>{
  const exp=new VisualExperimentEngine({id:"layout",arms:["right","bottom"],minSamplesPerArm:5});
  assert.equal(exp.chooseArm(),"bottom");
  for(let i=0;i<12;i++){exp.record("right",{success:true,reward:.95});exp.record("bottom",{success:i<3,reward:.25});}
  const result=exp.result();
  assert.equal(result.ready,true);
  assert.equal(result.winner,"right");
});

test("learning summary contains structure but not raw text",()=>{
  const scene=createScene({id:"s",width:800,height:600,nodes:[
    {id:"t",type:"text",x:20,y:40,text:"Sensitive student name",style:{size:20}},
    {id:"m",type:"math",x:20,y:80,latex:"x^2+y^2=r^2"}
  ]});
  const summary=summarizeSceneForLearning(scene);
  assert.equal(summary.textCharacters,22);
  assert.equal(JSON.stringify(summary).includes("Sensitive"),false);
});
