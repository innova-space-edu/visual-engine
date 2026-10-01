import type { VisualScene } from "./index.js";

export interface VisualSkillInvocation {
  skill: string;
  version?: string;
  params?: Record<string, unknown>;
  data?: unknown;
  style?: string;
}

export interface VisualSkillCompiler {
  id: string;
  version: string;
  compile(input: VisualSkillInvocation): VisualScene | Promise<VisualScene>;
}

export interface VisualAssetResolver {
  id: string;
  resolve(assetId:string, params?:Record<string,unknown>): unknown | Promise<unknown>;
}

export class ExtensionRegistry {
  private readonly skills = new Map<string, VisualSkillCompiler>();
  private readonly assets = new Map<string, VisualAssetResolver>();

  registerSkill(compiler:VisualSkillCompiler){
    const key=`${compiler.id}@${compiler.version}`;
    this.skills.set(key,compiler);
    this.skills.set(compiler.id,compiler);
    return this;
  }

  registerAssetResolver(resolver:VisualAssetResolver){
    this.assets.set(resolver.id,resolver);
    return this;
  }

  getSkill(id:string,version?:string){
    return this.skills.get(version ? `${id}@${version}` : id);
  }

  getAssetResolver(id:string){
    return this.assets.get(id);
  }

  listSkills(){
    return Array.from(new Set(Array.from(this.skills.values()).map((skill)=>`${skill.id}@${skill.version}`))).sort();
  }

  listAssetResolvers(){
    return Array.from(this.assets.keys()).sort();
  }
}

export const extensionRegistry = new ExtensionRegistry();
