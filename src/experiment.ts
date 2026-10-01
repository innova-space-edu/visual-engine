export interface ExperimentArmStat {
  id:string;
  samples:number;
  successes:number;
  rewardSum:number;
  meanReward:number;
}

export interface ExperimentSnapshot {
  schema:"visual-experiment/1.0";
  id:string;
  status:"running"|"completed";
  minSamplesPerArm:number;
  arms:Record<string,ExperimentArmStat>;
  winner?:string;
  confidence?:number;
  updatedAt:number;
}

export class VisualExperimentEngine {
  private readonly id:string;
  private readonly minSamplesPerArm:number;
  private readonly stats=new Map<string,ExperimentArmStat>();

  constructor(input:{id:string;arms:string[];minSamplesPerArm?:number}){
    if(!input.id||input.arms.length<2)throw new Error("Experiment requires id and at least two arms");
    this.id=input.id;this.minSamplesPerArm=Math.max(2,input.minSamplesPerArm??20);
    for(const arm of input.arms)this.stats.set(arm,{id:arm,samples:0,successes:0,rewardSum:0,meanReward:0});
  }

  chooseArm(){
    const rows=[...this.stats.values()];
    const untested=rows.filter(x=>x.samples===0).sort((a,b)=>a.id.localeCompare(b.id));
    if(untested.length)return untested[0]!.id;
    const total=rows.reduce((sum,x)=>sum+x.samples,0);
    return rows.map(row=>({
      id:row.id,
      score:row.meanReward+Math.sqrt(2*Math.log(Math.max(2,total))/row.samples)
    })).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))[0]!.id;
  }

  record(armId:string,input:{success?:boolean;reward?:number}){
    const prev=this.stats.get(armId);if(!prev)throw new Error("Unknown experiment arm: "+armId);
    const reward=Number.isFinite(input.reward)?Math.max(0,Math.min(1,Number(input.reward))):(input.success?1:0);
    const samples=prev.samples+1;
    const next={...prev,samples,successes:prev.successes+(input.success?1:0),rewardSum:prev.rewardSum+reward,meanReward:(prev.rewardSum+reward)/samples};
    this.stats.set(armId,next);
    return {...next};
  }

  result(){
    const rows=[...this.stats.values()].sort((a,b)=>b.meanReward-a.meanReward||b.samples-a.samples);
    const ready=rows.every(x=>x.samples>=this.minSamplesPerArm);
    const best=rows[0]!,second=rows[1]!;
    const gap=Math.max(0,best.meanReward-second.meanReward);
    const sampleConfidence=1-Math.exp(-Math.min(best.samples,second.samples)/this.minSamplesPerArm);
    const confidence=Math.max(0,Math.min(1,sampleConfidence*(.5+gap)));
    return {ready,winner:ready&&confidence>=.6?best.id:null,confidence,arms:rows.map(x=>({...x}))};
  }

  snapshot():ExperimentSnapshot{
    const result=this.result();
    return {
      schema:"visual-experiment/1.0",
      id:this.id,
      status:result.winner?"completed":"running",
      minSamplesPerArm:this.minSamplesPerArm,
      arms:Object.fromEntries([...this.stats.entries()].map(([id,row])=>[id,{...row}])),
      winner:result.winner||undefined,
      confidence:result.confidence,
      updatedAt:Date.now()
    };
  }

  restore(snapshot:ExperimentSnapshot){
    if(snapshot.schema!=="visual-experiment/1.0"||snapshot.id!==this.id)throw new Error("Experiment snapshot mismatch");
    for(const [id,row] of Object.entries(snapshot.arms))if(this.stats.has(id))this.stats.set(id,{...row});
  }
}
