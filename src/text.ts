import type { TextNode, TextStyle } from "./index.js";

export interface TextMeasure {
  width:number;
  ascent:number;
  descent:number;
  lineHeight:number;
}

export type TextMeasurer=(text:string,style:TextStyle)=>TextMeasure;

function defaultMeasure(text:string,style:TextStyle):TextMeasure{
  const size=style.size ?? 16;
  const weight=typeof style.weight==="number" ? style.weight : 400;
  const weightFactor=weight>=700?1.04:weight>=600?1.02:1;
  const average=.54*weightFactor;
  return {
    width:Array.from(text).reduce((sum,ch)=>sum+(ch===" "?size*.33:size*average),0)+(Math.max(0,Array.from(text).length-1)*(style.letterSpacing??0)),
    ascent:size*.8,
    descent:size*.2,
    lineHeight:size*(style.lineHeight??1.2)
  };
}

export function measureText(text:string,style:TextStyle={},measurer:TextMeasurer=defaultMeasure):TextMeasure{
  return measurer(text,style);
}

export function wrapText(text:string,maxWidth:number,style:TextStyle={},measurer:TextMeasurer=defaultMeasure):string[]{
  if(!Number.isFinite(maxWidth)||maxWidth<=0)return [text];
  const paragraphs=String(text).split(/\n/);
  const lines:string[]=[];
  for(const paragraph of paragraphs){
    if(!paragraph){lines.push("");continue;}
    const words=paragraph.split(/\s+/);
    let line="";
    for(const word of words){
      const candidate=line?line+" "+word:word;
      if(measurer(candidate,style).width<=maxWidth){
        line=candidate;
        continue;
      }
      if(line)lines.push(line);
      if(measurer(word,style).width<=maxWidth){
        line=word;
        continue;
      }
      let chunk="";
      for(const ch of Array.from(word)){
        const next=chunk+ch;
        if(chunk && measurer(next,style).width>maxWidth){
          lines.push(chunk);
          chunk=ch;
        }else chunk=next;
      }
      line=chunk;
    }
    if(line)lines.push(line);
  }
  return lines.length?lines:[""];
}

export function fitText(text:string,maxWidth:number,maxHeight:number,style:TextStyle={},options:{minSize?:number;maxSize?:number;measurer?:TextMeasurer}={}){
  const measurer=options.measurer??defaultMeasure;
  const maxSize=options.maxSize??style.size??32;
  const minSize=Math.max(4,options.minSize??10);
  for(let size=maxSize;size>=minSize;size--){
    const next={...style,size};
    const lines=wrapText(text,maxWidth,next,measurer);
    const lineHeight=measurer("Mg",next).lineHeight;
    if(lines.length*lineHeight<=maxHeight){
      return {style:next,lines,width:Math.min(maxWidth,Math.max(...lines.map(line=>measurer(line,next).width),0)),height:lines.length*lineHeight,overflow:false};
    }
  }
  const next={...style,size:minSize};
  const lines=wrapText(text,maxWidth,next,measurer);
  return {style:next,lines,width:maxWidth,height:lines.length*measurer("Mg",next).lineHeight,overflow:true};
}

export function textBlock(id:string,text:string,x:number,y:number,width:number,height:number,style:TextStyle={}):TextNode{
  const fitted=fitText(text,width,height,style);
  return {
    id,
    type:"text",
    x,
    y:y+(fitted.style.size??16),
    text:fitted.lines.join("\n"),
    maxWidth:width,
    style:fitted.style,
    metadata:{layout:{width,height,overflow:fitted.overflow}}
  };
}
