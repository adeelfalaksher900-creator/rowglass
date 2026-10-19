import test from 'node:test';
import assert from 'node:assert/strict';
import {localRequestUrl} from '../server/local-policy.mjs';
test('local adapter allows explicit loopback origins and intended ports',()=>{
  for(const host of ['localhost','127.0.0.1','[::1]'])assert.equal(localRequestUrl('/api/status',host+':3000',{port:3000}),'http://'+host+':3000/api/status');
  assert.equal(localRequestUrl('/','localhost',{port:80}),'http://localhost/');
});
test('caller-selected Host cannot define the trusted local origin',()=>{
  for(const authority of ['attacker.example:3000','localhost.attacker.example:3000','localhost:3001','localhost:3000@evil.example','evil.example/localhost:3000','localhost:3000?x'])assert.throws(()=>localRequestUrl('/api/agent',authority,{port:3000}));
  for(const target of ['https://evil.example','//evil.example','/\\evil.example/api/agent','/foo\\bar',''])assert.throws(()=>localRequestUrl(target,'localhost:3000',{port:3000}));
});
test('internal review hostname is explicit and wildcard listener is not a hostname grant',()=>{
  assert.throws(()=>localRequestUrl('/','terminal.local:4173',{port:4173}));
  assert.equal(localRequestUrl('/','terminal.local:4173',{port:4173,reviewFrames:true}),'http://terminal.local:4173/');
  assert.throws(()=>localRequestUrl('/','evil.example:4173',{port:4173,host:'0.0.0.0',reviewFrames:true}));
});
