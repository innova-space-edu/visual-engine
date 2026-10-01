export interface VisualOutcome {
  key:string;
  accepted:boolean;
  quality:number;
  renderMs?:number;
  edits?:number;
  timestamp?:number;
  context?:Record<string,string|number|boolean>;
}

export interface LearnedStat {
  key:string;
  samples:number;
  accepted:number;
  rejected:number;
  meanQuality:number;
  meanRenderMs:number;
  meanEdits:number;
  score:number;
}

export interface LearningSnapshot {
  version:"1.0";
  total:number;
  stats:Record<string,LearnedStat>;
}

function initial(key:string):LearnedStat{
  return {key,samples:0,accepted:0,rejected:0,meanQuality:0,meanRenderMs:0,meanEdits:0,score:.5};
}

function nextMean(previous:number,count:number,value:number){
  return count<=1?value:previous+(value-previous)/count;
}

export class VisualLearningEngine {
  private readonly stats=new Map<string,LearnedStat>();

  record(outcome:VisualOutcome):LearnedStat{
    const prev=this.stats.get(outcome.key)??initial(outcome.key);
    const samples=prev.samples+1;
    const accepted=prev.accepted+(outcome.accepted?1:0);
    const rejected=prev.rejected+(outcome.accepted?0:1);
    const meanQuality=nextMean(prev.meanQuality,samples,Math.max(0,Math.min(100,outcome.quality)));
    const meanRenderMs=nextMean(prev.meanRenderMs,samples,Math.max(0,outcome.renderMs??prev.meanRenderMs));
    const meanEdits=nextMean(prev.meanEdits,samples,Math.max(0,outcome.edits??prev.meanEdits));
    const acceptance=accepted/samples;
    const quality=meanQuality/100;
    const editPenalty=1/(1+meanEdits*.15);
    const speedPenalty=meanRenderMs>0?1/(1+Math.max(0,meanRenderMs-50)/2000):1;
    const confidence=1-Math.exp(-samples/12);
    const raw=.5*acceptance+.35*quality+.1*editPenalty+.05*speedPenalty;
    const score=.5*(1-confidence)+raw*confidence;
    const next={key:outcome.key,samples,accepted,rejected,meanQuality,meanRenderMs,meanEdits,score};
    this.stats.set(outcome.key,next);
    return structuredClone(next);
  }

  get(key:string):LearnedStat{
    return structuredClone(this.stats.get(key)??initial(key));
  }

  rank(keys:string[]):LearnedStat[]{
    return keys.map(key=>this.get(key)).sort((a,b)=>b.score-a.score||b.samples-a.samples||a.key.localeCompare(b.key));
  }

  choose(keys:string[]):string|null{
    return this.rank(keys)[0]?.key??null;
  }

  snapshot():LearningSnapshot{
    const stats:Record<string,LearnedStat>={};
    for(const [key,value] of this.stats)stats[key]=structuredClone(value);
    return {version:"1.0",total:Array.from(this.stats.values()).reduce((sum,x)=>sum+x.samples,0),stats};
  }

  restore(snapshot:LearningSnapshot){
    if(snapshot.version!=="1.0")throw new Error("Unsupported learning snapshot");
    this.stats.clear();
    for(const [key,value] of Object.entries(snapshot.stats))this.stats.set(key,structuredClone(value));
  }
}

export function candidateKey(parts:{
  skill:string;
  skillVersion?:string;
  layout?:string;
  style?:string;
  renderer?:string;
}){
  return [
    parts.skill,
    parts.skillVersion??"latest",
    parts.layout??"default",
    parts.style??"default",
    parts.renderer??"auto"
  ].join("|");
}
