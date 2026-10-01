export interface ParameterObservation {
  skill:string;
  nodeType?:string;
  path:string;
  before:number;
  after:number;
  qualityBefore?:number;
  qualityAfter?:number;
  accepted?:boolean;
  exported?:boolean;
  timestamp?:number;
}

export interface ParameterRecommendation {
  skill:string;
  nodeType:string;
  path:string;
  samples:number;
  meanBefore:number;
  meanAfter:number;
  meanDelta:number;
  meanQualityDelta:number;
  directionConsistency:number;
  acceptanceRate:number;
  exportRate:number;
  confidence:number;
  recommendedValue:number;
}

export interface OptimizationCandidate {
  schema:"visual-optimization-candidate/1.0";
  id:string;
  skill:string;
  currentVersion?:string;
  candidateVersion?:string;
  samples:number;
  confidence:number;
  changes:Record<string,{value:number;delta:number;samples:number;confidence:number}>;
  evidence:ParameterRecommendation[];
  createdAt:number;
}

function mean(values:number[]){
  return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
}
function clamp(value:number,min=0,max=1){return Math.max(min,Math.min(max,value));}
function round(value:number,digits=6){const p=10**digits;return Math.round(value*p)/p;}
function stableHash(value:string){
  let h=2166136261;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16).padStart(8,"0");
}

export function optimizeParameters(
  observations:ParameterObservation[],
  options:{minSamples?:number;minConfidence?:number;maxRecommendations?:number}={}
):ParameterRecommendation[]{
  const minSamples=Math.max(2,options.minSamples??8);
  const minConfidence=options.minConfidence??.62;
  const groups=new Map<string,ParameterObservation[]>();
  for(const row of observations){
    if(!row||!row.skill||!row.path||!Number.isFinite(row.before)||!Number.isFinite(row.after))continue;
    const key=[row.skill,row.nodeType||"*",row.path].join("::");
    const list=groups.get(key)||[];list.push(row);groups.set(key,list);
  }
  const out:ParameterRecommendation[]=[];
  for(const [key,rows] of groups){
    if(rows.length<minSamples)continue;
    const [skill,nodeType,path]=key.split("::") as [string,string,string];
    const deltas=rows.map(r=>r.after-r.before);
    const nonzero=deltas.filter(d=>Math.abs(d)>1e-9);
    const positive=nonzero.filter(d=>d>0).length;
    const negative=nonzero.filter(d=>d<0).length;
    const directionConsistency=nonzero.length?Math.max(positive,negative)/nonzero.length:0;
    const qualityDeltas=rows.map(r=>(r.qualityAfter??r.qualityBefore??0)-(r.qualityBefore??r.qualityAfter??0));
    const acceptanceRate=rows.filter(r=>r.accepted!==false).length/rows.length;
    const exportRate=rows.filter(r=>r.exported===true).length/rows.length;
    const sampleConfidence=1-Math.exp(-rows.length/18);
    const evidenceScore=.45*directionConsistency+.25*acceptanceRate+.15*exportRate+.15*clamp((mean(qualityDeltas)+5)/10);
    const confidence=clamp(sampleConfidence*evidenceScore);
    if(confidence<minConfidence)continue;
    out.push({
      skill,nodeType,path,samples:rows.length,
      meanBefore:round(mean(rows.map(r=>r.before))),
      meanAfter:round(mean(rows.map(r=>r.after))),
      meanDelta:round(mean(deltas)),
      meanQualityDelta:round(mean(qualityDeltas)),
      directionConsistency:round(directionConsistency),
      acceptanceRate:round(acceptanceRate),
      exportRate:round(exportRate),
      confidence:round(confidence),
      recommendedValue:round(mean(rows.map(r=>r.after)))
    });
  }
  return out.sort((a,b)=>b.confidence-a.confidence||b.samples-a.samples)
    .slice(0,options.maxRecommendations??100);
}

export function createOptimizationCandidate(input:{
  skill:string;
  observations:ParameterObservation[];
  currentVersion?:string;
  candidateVersion?:string;
  minSamples?:number;
  minConfidence?:number;
}):OptimizationCandidate|null{
  const evidence=optimizeParameters(
    input.observations.filter(row=>row.skill===input.skill),
    {minSamples:input.minSamples,minConfidence:input.minConfidence}
  );
  if(!evidence.length)return null;
  const changes:OptimizationCandidate["changes"]={};
  for(const row of evidence){
    const key=(row.nodeType==="*"?"":row.nodeType+".")+row.path;
    changes[key]={value:row.recommendedValue,delta:row.meanDelta,samples:row.samples,confidence:row.confidence};
  }
  const samples=Math.max(...evidence.map(x=>x.samples));
  const confidence=mean(evidence.map(x=>x.confidence));
  const fingerprint=stableHash(JSON.stringify(evidence.map(x=>[x.path,x.recommendedValue,x.samples])));
  return {
    schema:"visual-optimization-candidate/1.0",
    id:"candidate-"+input.skill.replace(/[^a-z0-9]+/gi,"-").toLowerCase()+"-"+fingerprint,
    skill:input.skill,
    currentVersion:input.currentVersion,
    candidateVersion:input.candidateVersion,
    samples,
    confidence:round(confidence),
    changes,
    evidence,
    createdAt:Date.now()
  };
}
