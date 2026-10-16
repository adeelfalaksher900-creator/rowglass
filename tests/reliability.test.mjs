import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,link,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import initSqlJs from 'sql.js';
import {readBoundedText,preflightOutputs,writeNewText,REVIEW_MAX_BYTES} from '../cli/file-io.mjs';
import {execute,equalResults,compare} from '../src/engine.mjs';
import {scenarios} from '../src/scenarios.mjs';
import {api} from '../server/api.mjs';

const SQL=await initSqlJs();
async function temporary(run){const root=await mkdtemp(join(tmpdir(),'rowglass-reliability-'));try{return await run(root);}finally{await rm(root,{recursive:true,force:true});}}
const cli=args=>spawnSync(process.execPath,['cli/rowglass.mjs',...args],{encoding:'utf8',timeout:20000,env:{PATH:process.env.PATH}});

test('SQLite non-finite results never compare equal to NULL',()=>{
  const s=scenarios[0];
  assert.throws(()=>execute(SQL,s,s.starter.rows,'SELECT 1e999 AS x'),/Non-finite/);
  assert.throws(()=>execute(SQL,s,s.starter.rows,'SELECT -1e999 AS x'),/Non-finite/);
  assert.throws(()=>equalResults([{columns:['x'],values:[[Infinity]]}],[{columns:['x'],values:[[null]]}]),/Non-finite/);
  const result=compare(SQL,{...s,reference:'SELECT NULL AS x'},s.starter,'SELECT 1e999 AS x');
  assert.equal(result.pass,false);assert.match(result.error,/Non-finite/);
});
test('CLI refuses input and query output collisions before evaluation',async()=>temporary(async root=>{
  const source=await readFile(new URL('../examples/inventory.case.json',import.meta.url),'utf8');
  const input=join(root,'case.json'),query=join(root,'query.md');
  await writeFile(input,source);await writeFile(query,'SELECT 1;');
  for(const args of [
    ['check',input,'--out',join(root,'case')],
    ['repair',input,'--query',query,'--out',join(root,'query')]
  ]){const out=cli(args);assert.equal(out.status,2,out.stderr);assert.match(out.stderr,/overwrite an input/);}
  assert.equal(await readFile(input,'utf8'),source);assert.equal(await readFile(query,'utf8'),'SELECT 1;');
}));
test('output aliases and races cannot replace existing file bytes',async()=>temporary(async root=>{
  const original=join(root,'original.sql');await writeFile(original,'SELECT 1;');
  for(const alias of ['hard','symbolic']){
    const prefix=join(root,alias),path=prefix+'.json';
    if(alias==='hard')await link(original,path);else await symlink(original,path);
    await assert.rejects(preflightOutputs(prefix,[original]),/already exists/);
    await assert.rejects(writeNewText(path,'replacement'),e=>e.code==='EEXIST');
  }
  const prefix=join(root,'race');await preflightOutputs(prefix,[original]);await writeFile(prefix+'.json','new owner');
  await assert.rejects(writeNewText(prefix+'.json','replacement'),e=>e.code==='EEXIST');
  assert.equal(await readFile(original,'utf8'),'SELECT 1;');assert.equal(await readFile(prefix+'.json','utf8'),'new owner');
}));
test('bounded regular-file reads distinguish byte limits and reject directories',async()=>temporary(async root=>{
  const path=join(root,'unicode');await writeFile(path,'é'.repeat(5));
  assert.equal(await readBoundedText(path,10,'Input'),'é'.repeat(5));
  await assert.rejects(readBoundedText(path,9,'Input'),/too large/);
  const directory=join(root,'directory');await mkdir(directory);
  await assert.rejects(readBoundedText(directory,20,'Input'),/regular file/);
}));
test('large valid exported reviews verify beyond the case import limit',async()=>temporary(async root=>{
  const query='SELECT id, label FROM items';
  const pack={format:'rowglass.case.v1',id:'large-review',title:'Large synthetic review',contract:'Return every item id and label without changing its text.',tables:[{name:'items',columns:[{name:'id',type:'integer',primaryKey:true},{name:'label',type:'text'}]}],baselineSQL:query,referenceSQL:query,fixtures:Array.from({length:5},(_,i)=>({id:'f'+i,label:'Synthetic fixture '+i,rows:{items:Array.from({length:100},(_,j)=>[j+1,'x'.repeat(200)])}}))};
  const source=JSON.stringify(pack);assert.ok(source.length<200000);
  const input=join(root,'case.json'),prefix=join(root,'review');await writeFile(input,source);
  const result=cli(['check',input,'--out',prefix]);assert.equal(result.status,0,result.stderr);
  const exported=await readFile(prefix+'.json');assert.ok(exported.length>200000);assert.ok(exported.length<REVIEW_MAX_BYTES);
  const verified=cli(['verify',prefix+'.json']);assert.equal(verified.status,0,verified.stderr);assert.match(verified.stdout,/digest matches/);
}));
test('malformed optional provider metadata cannot enter render fields',async()=>{
  const s=scenarios[0],request=new Request('https://example.test/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:s.id,sql:s.broken,action:'repair'})});
  const response=await api(request,{NEBIUS_API_KEY:'test-only'},async()=>Response.json({model:{bad:true},id:{bad:true},usage:{total_tokens:{bad:true},prompt_tokens:-1,completion_tokens:2},choices:[{message:{content:JSON.stringify({sql:s.reference,explanation:'Test proposal.',cautions:[],fixture:null})}}]}));
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(typeof data.provenance.model,'string');assert.equal(data.provenance.responseId,null);assert.deepEqual(data.provenance.usage,{completion_tokens:2});
});
