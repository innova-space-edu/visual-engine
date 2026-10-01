export interface ShapedGlyph {
  glyphId:number;
  cluster:number;
  xAdvance:number;
  yAdvance:number;
  xOffset:number;
  yOffset:number;
}

export interface ShapeOptions {
  direction?:string;
  language?:string;
  script?:string;
}

export async function shapeTextWithHarfBuzz(fontData:ArrayBuffer,text:string,options:ShapeOptions={}):Promise<ShapedGlyph[]>{
  const hb:any=await import("harfbuzzjs");
  const blob=new hb.Blob(fontData);
  const face=new hb.Face(blob);
  const font=new hb.Font(face);
  const buffer=new hb.Buffer();
  try{
    buffer.addText(text);
    if(options.direction&&typeof buffer.setDirection==="function")buffer.setDirection(options.direction);
    if(options.language&&typeof buffer.setLanguage==="function")buffer.setLanguage(options.language);
    if(options.script&&typeof buffer.setScript==="function")buffer.setScript(options.script);
    if(!options.direction&&!options.language&&!options.script)buffer.guessSegmentProperties();
    hb.shape(font,buffer);
    const glyphs=buffer.getGlyphInfosAndPositions();
    return glyphs.map((glyph:any)=>({
      glyphId:Number(glyph.codepoint??glyph.glyphId??0),
      cluster:Number(glyph.cluster??0),
      xAdvance:Number(glyph.x_advance??glyph.xAdvance??0),
      yAdvance:Number(glyph.y_advance??glyph.yAdvance??0),
      xOffset:Number(glyph.x_offset??glyph.xOffset??0),
      yOffset:Number(glyph.y_offset??glyph.yOffset??0)
    }));
  }finally{
    if(typeof buffer.destroy==="function")buffer.destroy();
    if(typeof font.destroy==="function")font.destroy();
    if(typeof face.destroy==="function")face.destroy();
    if(typeof blob.destroy==="function")blob.destroy();
  }
}

export async function textToSvgPath(fontData:ArrayBuffer,text:string,options:{x?:number;y?:number;fontSize?:number;decimals?:number}={}):Promise<string>{
  const mod:any=await import("opentype.js");
  const parse=mod.parse??mod.default?.parse;
  if(typeof parse!=="function")throw new Error("opentype.js parse() is unavailable");
  const font=parse(fontData);
  const path=font.getPath(text,options.x??0,options.y??0,options.fontSize??72);
  if(typeof path.toPathData==="function")return path.toPathData(options.decimals??2);
  if(typeof path.toSVG==="function"){
    const svg=path.toSVG(options.decimals??2);
    const match=String(svg).match(/d="([^"]+)"/);
    if(match)return match[1]!;
  }
  throw new Error("Unable to serialize OpenType path");
}

export async function fontRuntimeAvailable(){
  const result={harfbuzz:false,opentype:false};
  try{await import("harfbuzzjs");result.harfbuzz=true;}catch{}
  try{await import("opentype.js");result.opentype=true;}catch{}
  return result;
}
