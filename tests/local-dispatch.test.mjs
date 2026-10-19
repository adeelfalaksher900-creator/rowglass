import test from 'node:test';
import assert from 'node:assert/strict';
import {localDispatch} from '../server/local-dispatch.mjs';

test('local Node API preserves explicit private opt-in while public assets use the compiled worker',async()=>{
  let assetCalls=0;
  const worker={fetch:async()=>{assetCalls++;return new Response('asset');}};
  const local=await localDispatch(new Request('http://localhost/api/status'),{NEBIUS_API_KEY:'test-only',ROWGLASS_PROVIDER_MODE:'private',ROWGLASS_PUBLIC:'false'},worker,{host:'127.0.0.1'});
  const status=await local.json();
  assert.equal(status.providerAccess,'private');assert.equal(status.configured,true);assert.equal(status.liveVerified,false);
  const closed=await localDispatch(new Request('http://localhost/api/status'),{NEBIUS_API_KEY:'test-only'},worker);
  assert.equal((await closed.json()).configured,false);
  assert.equal(assetCalls,0);
  assert.equal(await(await localDispatch(new Request('http://localhost/'),{},worker)).text(),'asset');
  assert.equal(assetCalls,1);
});

test('network-facing and review-frame previews cannot inherit private provider access',async()=>{
  const env={NEBIUS_API_KEY:'test-only',TAVILY_API_KEY:'test-only',ROWGLASS_PROVIDER_MODE:'private',ROWGLASS_PUBLIC:'false'};
  for(const options of [{},{host:'0.0.0.0'},{host:'::'},{host:'192.0.2.1'},{host:'127.0.0.1',reviewFrames:true}]){
    const response=await localDispatch(new Request('http://localhost/api/status',{headers:{'X-User-Id':'owner'}}),env,{},options);
    const status=await response.json();
    assert.equal(status.providerAccess,'local-only');assert.equal(status.configured,false);assert.equal(status.sourcesConfigured,false);
  }
});
