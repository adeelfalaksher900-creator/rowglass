import test from 'node:test';
import assert from 'node:assert/strict';
import {modelCompletion,ModelTransportError,MODEL_RESPONSE_MAX_BYTES,MODEL_DEADLINE_MS} from '../server/model-transport.mjs';

const apiKey='test-only-not-a-real-key';
const payload={model:'nvidia/test-model',messages:[{role:'user',content:'Synthetic test.'}]};
const isError=code=>error=>{
 assert.ok(error instanceof ModelTransportError);assert.equal(error.code,code);
 assert.doesNotMatch(error.message,/secret|test-only-not-a-real-key/);return true;
};

test('transport fixes destination, rejects redirects and decodes split UTF-8',async()=>{
 const bytes=new TextEncoder().encode(JSON.stringify({value:'é😀'}));
 const result=await modelCompletion(payload,{apiKey,fetcher:async(url,options)=>{
  assert.equal(url,'https://api.tokenfactory.nebius.com/v1/chat/completions');
  assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,'Bearer '+apiKey);assert.deepEqual(JSON.parse(options.body),payload);
  return new Response(new ReadableStream({start(controller){for(const byte of bytes)controller.enqueue(Uint8Array.of(byte));controller.close();}}));
 }});
 assert.deepEqual(result,{value:'é😀'});
});
test('valid JSON at the byte ceiling is accepted',async()=>{
 const prefix='{"value":"',suffix='"}',value='x'.repeat(MODEL_RESPONSE_MAX_BYTES-prefix.length-suffix.length);
 const result=await modelCompletion(payload,{apiKey,fetcher:async()=>new Response(prefix+value+suffix)});
 assert.equal(result.value,value);
});
test('streaming oversize counts bytes and cancels the upstream body',async()=>{
 let cancelled=false;
 const text='{"value":"'+'é'.repeat(Math.floor(MODEL_RESPONSE_MAX_BYTES/2))+'"}';
 assert.ok(text.length<MODEL_RESPONSE_MAX_BYTES);
 const response=new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(text));},cancel(){cancelled=true;}}));
 await assert.rejects(modelCompletion(payload,{apiKey,fetcher:async()=>response}),isError('invalid_response'));
 assert.equal(cancelled,true);
});
test('declared oversize cancels without reading the body',async()=>{
 let cancelled=false,reads=0;
 const response=new Response(new ReadableStream({pull(){reads++;},cancel(){cancelled=true;}},{highWaterMark:0}),{headers:{'Content-Length':String(MODEL_RESPONSE_MAX_BYTES+1)}});
 await assert.rejects(modelCompletion(payload,{apiKey,fetcher:async()=>response}),isError('invalid_response'));
 assert.equal(cancelled,true);assert.equal(reads,0);
});
test('HTTP errors cancel unread bodies and expose only status',async()=>{
 let cancelled=false;
 const response=new Response(new ReadableStream({cancel(){cancelled=true;}},{highWaterMark:0}),{status:402});
 await assert.rejects(modelCompletion(payload,{apiKey,fetcher:async()=>response}),error=>{
  assert.equal(isError('provider_error')(error),true);assert.equal(error.status,402);return true;
 });
 assert.equal(cancelled,true);
});
test('malformed, invalid UTF-8, missing and broken bodies return generic errors',async()=>{
 for(const response of [new Response('secret invalid JSON'),new Response(Uint8Array.of(0xff)),new Response(null),new Response(new ReadableStream({start(controller){controller.error(Error('secret body error'));}}))]){
  await assert.rejects(modelCompletion(payload,{apiKey,fetcher:async()=>response}),isError('invalid_response'));
 }
});
test('decoder failure cancels an unfinished upstream stream',async()=>{
 let cancelled=false;
 const response=new Response(new ReadableStream({start(controller){controller.enqueue(Uint8Array.of(0xff));},cancel(){cancelled=true;}}));
 await assert.rejects(modelCompletion(payload,{apiKey,fetcher:async()=>response}),isError('invalid_response'));
 assert.equal(cancelled,true);
});
test('transport exceptions never leak messages or keys',async()=>{
 await assert.rejects(modelCompletion(payload,{apiKey,fetcher:async()=>{throw Error('secret '+apiKey);}}),isError('invalid_response'));
});
test('pre-aborted calls make zero requests',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(modelCompletion(payload,{apiKey,signal:controller.signal,fetcher:()=>assert.fail('Must not call')}),isError('aborted'));
});
test('active cancellation settles even if a transport ignores its signal',async()=>{
 const controller=new AbortController();let transportSignal;
 const pending=modelCompletion(payload,{apiKey,signal:controller.signal,fetcher:async(url,options)=>{transportSignal=options.signal;return new Promise(()=>{});}});
 const rejected=assert.rejects(pending,isError('aborted'));controller.abort();await rejected;
 assert.equal(transportSignal.aborted,true);
});
test('the deadline bounds waiting for response headers',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let transportSignal;
 const pending=modelCompletion(payload,{apiKey,fetcher:async(url,options)=>{transportSignal=options.signal;return new Promise(()=>{});}});
 const rejected=assert.rejects(pending,isError('timeout'));
 t.mock.timers.tick(MODEL_DEADLINE_MS-1);assert.equal(transportSignal.aborted,false);
 t.mock.timers.tick(1);await rejected;assert.equal(transportSignal.aborted,true);
});
test('the same deadline bounds a stalled body and cancels it',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let cancelled=false;
 const response=new Response(new ReadableStream({cancel(){cancelled=true;}}));
 const pending=modelCompletion(payload,{apiKey,fetcher:async()=>response});
 const rejected=assert.rejects(pending,isError('timeout'));
 await Promise.resolve();t.mock.timers.tick(MODEL_DEADLINE_MS);await rejected;
 assert.equal(cancelled,true);
});
test('a response arriving after cancellation is discarded and cancelled',async()=>{
 const controller=new AbortController();let respond,cancelled=false;
 const pending=modelCompletion(payload,{apiKey,signal:controller.signal,fetcher:()=>new Promise(resolve=>{respond=resolve;})});
 const rejected=assert.rejects(pending,isError('aborted'));controller.abort();await rejected;
 respond(new Response(new ReadableStream({cancel(){cancelled=true;}})));
 await Promise.resolve();assert.equal(cancelled,true);
});
