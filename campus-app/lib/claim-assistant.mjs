import path from 'node:path';
import os from 'node:os';
import * as ort from 'onnxruntime-node';
import {localDir} from './db.mjs';
import {normalizeId} from './security.mjs';

// The embedding model runs on this server. Only public model weights are downloaded.
// Private report and claim text never goes to a hosted inference API.
const MODEL='Xenova/all-MiniLM-L6-v2';
const REVISION='08a308f628bc9d6774b7922f319eb1b65afa1a82';
async function encoder(){
 if(!ort.InferenceSession)throw new Error('The neural inference runtime is unavailable.');
 if(!globalThis.__claimEncoder)globalThis.__claimEncoder=(async()=>{
  const {pipeline,env}=await import('@huggingface/transformers');
  env.allowLocalModels=false;
  env.cacheDir=path.join(process.env.VERCEL?os.tmpdir():localDir(),'claim-assistant-model');
  return pipeline('feature-extraction',MODEL,{dtype:'q8',revision:REVISION,device:'cpu'});
 })().catch(e=>{globalThis.__claimEncoder=undefined;throw e;});
 return globalThis.__claimEncoder;
}
const sentences=text=>String(text||'').split(/[\n.!?;]+/).map(v=>v.trim()).filter(v=>v.length>=8).slice(0,15);
const usable=v=>v&&v.length>=8&&!/^(no distinguishing|not available|unknown|none|no identifying)/i.test(v.trim());
const hasNegation=t=>/\b(no|not|without|never|doesn.t|isn.t)\b/i.test(t);
export async function compareClaim(privateDetails,claim){
 const details=[privateDetails.answer1,privateDetails.answer2].filter(usable);
 const lines=sentences([claim.answer1,claim.answer2,claim.explanation].join('\n'));
 const serialConflict=!!(privateDetails.serial&&claim.serial&&normalizeId(privateDetails.serial)!==normalizeId(claim.serial));
 if(!details.length||!lines.length)return {model:MODEL,mode:'insufficient_text',matches:[],serialConflict,summary:'There are not enough distinguishing details for a text comparison. Arrange another appropriate check.'};
 const encode=await encoder();const vectors=(await encode([...details,...lines],{pooling:'mean',normalize:true,truncation:true})).tolist();
 const matches=details.map((detail,index)=>{
  let best=-1,lineIndex=0;
  for(let j=0;j<lines.length;j++){
   const similarity=vectors[index].reduce((total,v,k)=>total+v*vectors[details.length+j][k],0);
   if(similarity>best){best=similarity;lineIndex=j;}
  }
  const negationConflict=hasNegation(detail)!==hasNegation(lines[lineIndex]);
  return {detail,claim_line:lines[lineIndex],related:best>=0.55,possible_contradiction:negationConflict&&best>=0.45,label:negationConflict&&best>=0.45?'Check a possible contradiction':best>=0.55?'Potentially related detail':'No clear text agreement'};
 });
 return {model:MODEL,mode:'local_model',matches,serialConflict,summary:serialConflict?'Serial numbers conflict. Staff must resolve that discrepancy before collection.':matches.some(m=>m.related)?'At least one description may refer to the same feature. Continue with identity and physical ownership checks.':'Text alone does not provide a clear agreement. Request an alternative supervised check.',limitation:'Text similarity cannot establish ownership, detect forged evidence or reliably understand every contradiction. Review the original details.'};
}
