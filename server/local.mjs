import http from 'node:http';
import worker from '../dist/server/index.js';
import {reviewFrame} from './review-frame.mjs';
import {localRequestUrl} from './local-policy.mjs';

const port=Number(process.argv[2]||3000),host=process.argv[3]||'127.0.0.1';
const reviewFrames=process.argv.includes('--review-frames');
http.createServer(async(req,res)=>{
  const controller=new AbortController();
  req.once('aborted',()=>controller.abort());
  res.once('close',()=>{if(!res.writableEnded)controller.abort();});
  try{
    let url;
    try{url=localRequestUrl(req.url,req.headers.host,{port,host,reviewFrames});}
    catch{res.writeHead(400,{'Cache-Control':'no-store'});res.end('Invalid local request host or target.');return;}
    if(reviewFrames&&req.method==='GET'&&new URL(url).pathname==='/__qa/frames'){
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});
      res.end(reviewFrame(req.url));return;
    }
    const chunks=[];let bytes=0;
    for await(const chunk of req){
      bytes+=chunk.length;
      if(bytes>48000){res.writeHead(413);res.end('Too large');return;}
      chunks.push(chunk);
    }
    const headers=new Headers();
    for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
    const request=new Request(url,{method:req.method,headers,signal:controller.signal,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
    const response=await worker.fetch(request,process.env,{});
    if(controller.signal.aborted)return;
    const body=Buffer.from(await response.arrayBuffer());
    if(controller.signal.aborted)return;
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(body);
  }catch{
    if(controller.signal.aborted||res.destroyed)return;
    if(!res.headersSent)res.writeHead(500);
    res.end('Local server error');
  }
}).listen(port,host,()=>console.log(`Rowglass serving on http://${host}:${port}`));
