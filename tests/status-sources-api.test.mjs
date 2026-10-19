import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../server/api.mjs';
import {scenarios} from '../src/scenarios.mjs';

test('configured status never equates an injected transport with observed live inference',async()=>{
  const env={NEBIUS_API_KEY:'test-only'};
  const before=await(await api(new Request('https://example.test/api/status'),env)).json();
  assert.equal(before.configured,true);assert.equal(before.verification,'not_observed');
  const s=scenarios[0];
  const response=await api(new Request('https://example.test/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:s.id,sql:s.broken,action:'repair'})}),env,async()=>Response.json({id:'mock',choices:[{message:{content:JSON.stringify({sql:s.reference,explanation:'Mock only.',cautions:[],fixture:null})}}]}));
  assert.equal((await response.json()).provenance.mode,'test-only');
  const after=await(await api(new Request('https://example.test/api/status'),env)).json();
  assert.equal(after.liveVerified,false);assert.equal(after.verification,'not_observed');
});
test('documentation route rejects arbitrary topics, query fields, methods and public spend',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw Error('must not call');};
  for(const url of ['?topic=arbitrary','?topic=outer-join&sql=SELECT','?topic=outer-join&topic=null-not-in']){
    assert.equal((await api(new Request('https://example.test/api/sources'+url),{TAVILY_API_KEY:'test-only'},fetcher)).status,400);
  }
  assert.equal((await api(new Request('https://example.test/api/sources?topic=outer-join',{method:'POST'}),{},fetcher)).status,405);
  assert.equal((await api(new Request('https://example.test/api/sources?topic=outer-join'),{TAVILY_API_KEY:'test-only',ROWGLASS_PUBLIC:'true'},fetcher)).status,403);
  const unavailable=await(await api(new Request('https://example.test/api/sources?topic=outer-join'),{},fetcher)).json();
  assert.equal(unavailable.reason,'not_configured');assert.equal(calls,0);
});
test('JSON-like media types do not bypass the agent request contract',async()=>{
  const s=scenarios[0];
  const r=await api(new Request('https://example.test/api/agent',{method:'POST',headers:{'Content-Type':'application/jsonp'},body:JSON.stringify({scenarioId:s.id,sql:s.broken,action:'repair'})}));
  assert.equal(r.status,415);
});
