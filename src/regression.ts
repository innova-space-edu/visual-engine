export interface RegressionMetrics {
  quality:number;
  semantic?:number;
  overflow?:number;
  edits?:number;
  renderMs?:number;
  failures?:number;
}

export interface RegressionCase<T=unknown> {
  id:string;
  input:T;
  tags?:string[];
  baseline?:Partial<RegressionMetrics>;
}

export interface RegressionCaseResult {
  id:string;
  current:RegressionMetrics;
  candidate:RegressionMetrics;
  delta:RegressionMetrics;
  passed:boolean;
  reasons:string[];
}

export interface RegressionSuiteResult {
  schema:"visual-regression/1.0";
  passed:boolean;
  cases:number;
  passedCases:number;
  failedCases:number;
  currentAverage:RegressionMetrics;
  candidateAverage:RegressionMetrics;
  deltaAverage:RegressionMetrics;
  results:RegressionCaseResult[];
  createdAt:number;
}

const fields:(keyof RegressionMetrics)[]=["quality","semantic","overflow","edits","renderMs","failures"];

function metric(value:number|undefined){return Number.isFinite(value)?Number(value):0;}
function average(rows:RegressionMetrics[]):RegressionMetrics{
  const out:any={};
  for(const field of fields)out[field]=rows.length?rows.reduce((sum,row)=>sum+metric(row[field]),0)/rows.length:0;
  return out;
}
function delta(a:RegressionMetrics,b:RegressionMetrics):RegressionMetrics{
  const out:any={};
  for(const field of fields)out[field]=metric(b[field])-metric(a[field]);
  return out;
}

export function compareRegressionMetrics(
  current:RegressionMetrics,
  candidate:RegressionMetrics,
  thresholds:{qualityDrop?:number;semanticDrop?:number;overflowIncrease?:number;failureIncrease?:number;renderSlowdownPct?:number}={}
){
  const reasons:string[]=[];
  const qualityDrop=thresholds.qualityDrop??.5;
  const semanticDrop=thresholds.semanticDrop??.5;
  const overflowIncrease=thresholds.overflowIncrease??0;
  const failureIncrease=thresholds.failureIncrease??0;
  const renderSlowdownPct=thresholds.renderSlowdownPct??20;
  if(metric(candidate.quality)<metric(current.quality)-qualityDrop)reasons.push("quality regression");
  if(metric(candidate.semantic)<metric(current.semantic)-semanticDrop)reasons.push("semantic regression");
  if(metric(candidate.overflow)>metric(current.overflow)+overflowIncrease)reasons.push("overflow regression");
  if(metric(candidate.failures)>metric(current.failures)+failureIncrease)reasons.push("failure regression");
  if(metric(current.renderMs)>0&&metric(candidate.renderMs)>metric(current.renderMs)*(1+renderSlowdownPct/100))reasons.push("render performance regression");
  return {passed:reasons.length===0,reasons};
}

export async function runRegressionSuite<T>(
  cases:RegressionCase<T>[],
  currentEvaluator:(test:RegressionCase<T>)=>Promise<RegressionMetrics>|RegressionMetrics,
  candidateEvaluator:(test:RegressionCase<T>)=>Promise<RegressionMetrics>|RegressionMetrics,
  thresholds:Parameters<typeof compareRegressionMetrics>[2]={}
):Promise<RegressionSuiteResult>{
  const results:RegressionCaseResult[]=[];
  for(const test of cases){
    const current=await currentEvaluator(test);
    const candidate=await candidateEvaluator(test);
    const comparison=compareRegressionMetrics(current,candidate,thresholds);
    results.push({id:test.id,current,candidate,delta:delta(current,candidate),passed:comparison.passed,reasons:comparison.reasons});
  }
  const currentAverage=average(results.map(x=>x.current));
  const candidateAverage=average(results.map(x=>x.candidate));
  return {
    schema:"visual-regression/1.0",
    passed:results.every(x=>x.passed),
    cases:results.length,
    passedCases:results.filter(x=>x.passed).length,
    failedCases:results.filter(x=>!x.passed).length,
    currentAverage,
    candidateAverage,
    deltaAverage:delta(currentAverage,candidateAverage),
    results,
    createdAt:Date.now()
  };
}
