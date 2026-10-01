import type { Diagnostic, RenderResult, VisualScene } from "./index.js";
import { analyzeQuality, renderSvg } from "./index.js";

export interface PipelineOptions {
  qualityGate?: number;
  failOnError?: boolean;
  prettySvg?: boolean;
}

export interface PipelineResult {
  scene: VisualScene;
  render: RenderResult;
  quality: ReturnType<typeof analyzeQuality>;
  diagnostics: Diagnostic[];
  accepted: boolean;
}

export function runDeterministicPipeline(scene:VisualScene, options:PipelineOptions={}):PipelineResult {
  const quality=analyzeQuality(scene);
  const svg=renderSvg(scene, options.prettySvg ?? false);
  const diagnostics=[...quality.diagnostics];
  const qualityGate=options.qualityGate ?? 80;
  const accepted=quality.valid && quality.score>=qualityGate;

  if(options.failOnError && !accepted){
    const reason=diagnostics.map((d)=>`${d.code}: ${d.message}`).join("; ");
    throw new Error(`Visual pipeline rejected scene (score=${quality.score}): ${reason}`);
  }

  return {
    scene,
    render:{
      format:"svg",
      mimeType:"image/svg+xml",
      data:svg,
      width:scene.width,
      height:scene.height,
      renderer:"visual-engine/svg",
      diagnostics
    },
    quality,
    diagnostics,
    accepted
  };
}
