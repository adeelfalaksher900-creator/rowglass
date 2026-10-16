import {open,lstat,mkdir,writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,resolve} from 'node:path';

export const REVIEW_MAX_BYTES=16*1024*1024;
export async function readBoundedText(path,maxBytes,label){
  const handle=await open(path,constants.O_RDONLY|constants.O_NONBLOCK);
  try{
    const info=await handle.stat();
    if(!info.isFile())throw new Error(label+' must be a regular file.');
    if(info.size>maxBytes)throw new Error(label+' is too large.');
    const chunks=[];let total=0;
    while(true){
      const buffer=Buffer.alloc(Math.min(65536,maxBytes-total+1));
      const {bytesRead}=await handle.read(buffer,0,buffer.length,null);
      if(!bytesRead)break;
      total+=bytesRead;if(total>maxBytes)throw new Error(label+' is too large.');
      chunks.push(buffer.subarray(0,bytesRead));
    }
    return Buffer.concat(chunks,total).toString('utf8');
  }finally{await handle.close();}
}
export async function preflightOutputs(prefix,inputPaths,repair=false){
  const paths=(repair?['.json','.md','.candidate.sql','.patch']:['.json','.md']).map(s=>resolve(prefix+s));
  const inputs=new Set(inputPaths.map(p=>resolve(p)));
  for(const path of paths){
    if(inputs.has(path))throw new Error('Output would overwrite an input file. Choose a different --out prefix.');
    try{await lstat(path);}catch(error){if(error.code==='ENOENT')continue;throw error;}
    throw new Error('Output already exists. Choose a different --out prefix.');
  }
  return paths;
}
export async function writeNewText(path,text){
  await mkdir(dirname(path),{recursive:true});
  await writeFile(path,text,{flag:'wx'});
}
