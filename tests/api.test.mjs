import test from 'node:test';import assert from 'node:assert/strict';import {api,parseModelReply} from '../server/api.mjs';import {scenarios} from '../src/scenarios.mjs';
import {MODEL_RESPONSE_MAX_BYTES} from '../server/model-transport.mjs';
const privateEnv={NEBIUS_API_KEY:'test-only',ROWGLASS_PROVIDER_MODE:'private'};
const request=(body,headers={})=>new Request('https://example.test/api/agent',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const body={scenarioId:scenarios[0].id,sql:scenarios[0].broken,action:'repair'};
test('no key returns honest 503 and never fabricates generation',async()=>{const r=await api(request(body),{});assert.equal(r.status,503);assert.equal((await r.json()).code,'not_configured');});
test('rejects cross-origin model calls',async()=>assert.equal((await api(request(body,{Origin:'https://evil.test'}),{})).status,403));
test('rejects client system prompt and unknown fields',async()=>assert.equal((await api(request({...body,messages:[]}))).status,400));
test('validates model output before returning it',()=>{assert.throws(()=>parseModelReply(JSON.stringify({sql:'DROP TABLE orders',explanation:'x',cautions:[],fixture:null}),scenarios[0]));});
test('mocked transport verifies Nebius NVIDIA request and provenance parsing',async()=>{let called=false;const r=await api(request(body),privateEnv,async(url,options)=>{called=true;assert.equal(url,'https://api.tokenfactory.nebius.com/v1/chat/completions');assert.equal(options.redirect,'error');const prompt=JSON.parse(options.body);assert.match(prompt.model,/^nvidia\//);const task=JSON.parse(prompt.messages[1].content);assert.equal('reference' in task.scenario,false);assert.equal('cases' in task.scenario,false);return Response.json({id:'mock-response',model:prompt.model,usage:{total_tokens:10},choices:[{message:{content:JSON.stringify({sql:scenarios[0].reference,explanation:'Move filter into the join.',cautions:['Finite tests.'],fixture:null})}}]});});assert.equal(r.status,200);const out=await r.json();assert.equal(out.provenance.responseId,'mock-response');assert.equal(out.provenance.mode,'test-only');assert.equal(called,true);});
test('provider error does not expose its body or return a canned patch',async()=>{const r=await api(request(body),privateEnv,async()=>new Response('secret upstream body',{status:402}));assert.equal(r.status,502);const result=await r.json();assert.equal(result.providerStatus,402);assert.equal('sql' in result,false);assert.doesNotMatch(JSON.stringify(result),/secret upstream body/);});
test('public inference overrides explicit private mode and rejects forged identity',async()=>{let called=false;const r=await api(request(body,{'oai-authenticated-user-id':'spoofed'}),{...privateEnv,ROWGLASS_PUBLIC:'true'},async()=>{called=true;});assert.equal(r.status,403);assert.equal(called,false);});
test('oversized request is rejected before model execution',async()=>{const r=await api(request({...body,sql:'x'.repeat(50000)}),{NEBIUS_API_KEY:'test-only'});assert.equal(r.status,413);});
test('custom context cannot smuggle the reference oracle into the model input',async()=>{const r=await api(request({...body,scenarioContext:{id:'custom',title:'test',contract:'A test contract',tables:[],referenceSQL:'SELECT 1'}}),{});assert.equal(r.status,400);});

const statusRequest=()=>new Request('https://example.test/api/status');
test('keys and forged identity cannot enable either provider without exact private opt-in',async()=>{
 let calls=0;const fetcher=()=>{calls++;assert.fail('Disabled provider must not be called');};
 for(const mode of [undefined,'','false','true','PRIVATE','local-only',true]){
  const env={NEBIUS_API_KEY:'test-only-model',TAVILY_API_KEY:'test-only-search',ROWGLASS_PUBLIC:'false',ROWGLASS_PROVIDER_MODE:mode};
  assert.equal((await api(request(body,{'oai-authenticated-user-id':'spoofed'}),env,fetcher)).status,403);
  assert.equal((await api(new Request('https://example.test/api/sources?topic=outer-join'),env,fetcher)).status,403);
  const status=await(await api(statusRequest(),env,fetcher)).json();
  assert.equal(status.keyConfigured,true);assert.equal(status.sourcesKeyConfigured,true);
  assert.equal(status.providerAccess,'local-only');assert.equal(status.configured,false);assert.equal(status.sourcesConfigured,false);
  assert.equal(status.liveVerified,false);assert.equal(status.observation,null);
  assert.doesNotMatch(JSON.stringify(status),/test-only-model|test-only-search/);
 }
 assert.equal(calls,0);
});
test('status separates configured keys, private access and observed responses',async()=>{
 const status=await(await api(statusRequest(),{...privateEnv,TAVILY_API_KEY:'test-only-search'})).json();
 assert.equal(status.keyConfigured,true);assert.equal(status.providerAccess,'private');assert.equal(status.configured,true);
 assert.equal(status.sourcesConfigured,true);assert.equal(status.liveVerified,false);assert.equal(status.observation,null);
 for(const key of [undefined,'','  ',true]){
  const env={ROWGLASS_PROVIDER_MODE:'private',NEBIUS_API_KEY:key};const result=await(await api(statusRequest(),env)).json();
  assert.equal(result.keyConfigured,false);assert.equal(result.configured,false);
  assert.equal((await api(request(body),env,()=>assert.fail('Invalid key must not call'))).status,503);
 }
});
test('oversized upstream content returns a generic error without a proposal',async()=>{
 const r=await api(request(body),privateEnv,async()=>new Response('secret '.repeat(MODEL_RESPONSE_MAX_BYTES)));
 assert.equal(r.status,502);const result=await r.json();assert.equal(result.code,'invalid_or_failed_response');
 assert.equal('sql' in result,false);assert.doesNotMatch(JSON.stringify(result),/secret|test-only/);
});
test('simulated default-transport observation is bound to current model, key and access',async()=>{
 // This unit-test substitution exercises state transitions, not live inference.
 const original=globalThis.fetch;let calls=0;
 const proposal=()=>Response.json({id:'mock-observation',choices:[{message:{content:JSON.stringify({sql:scenarios[0].reference,explanation:'Mock only.',cautions:[],fixture:null})}}]});
 globalThis.fetch=async()=>{calls++;return proposal();};
 try{
  const {api:isolated}=await import('../server/api.mjs?configuration-observation-test');
  const env={NEBIUS_API_KEY:'test-only-key-a',ROWGLASS_PROVIDER_MODE:'private'};
  assert.equal((await(await isolated(statusRequest(),env)).json()).liveVerified,false);
  assert.equal((await isolated(request(body),env)).status,200);
  const observed=await(await isolated(statusRequest(),env)).json();
  assert.equal(observed.liveVerified,true);assert.equal(observed.observation.responseId,'mock-observation');
  assert.doesNotMatch(JSON.stringify(observed),/test-only-key-a/);
  assert.equal('configuration' in observed.observation,false);
  for(const changed of [{...env,NEBIUS_API_KEY:'test-only-key-b'},{...env,NEBIUS_MODEL:'nvidia/different-model'},{...env,NEBIUS_API_KEY:''},{...env,ROWGLASS_PROVIDER_MODE:'local-only'},{...env,ROWGLASS_PUBLIC:'true'}]){
   const status=await(await isolated(statusRequest(),changed)).json();
   assert.equal(status.liveVerified,false);assert.equal(status.verification,'not_observed');assert.equal(status.observation,null);
  }
  const changedKey={...env,NEBIUS_API_KEY:'test-only-key-b'};
  assert.equal((await(await isolated(request(body),changedKey,async()=>proposal())).json()).provenance.mode,'test-only');
  assert.equal((await(await isolated(statusRequest(),changedKey)).json()).liveVerified,false);assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
});
