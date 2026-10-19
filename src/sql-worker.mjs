import initSqlJs from 'sql.js';
import {scenarios,getScenario} from './scenarios.mjs';
import {evaluate,compare,validateRows} from './engine.mjs';
import {compileCasePack} from './case-pack.mjs';
import {stressFixtures} from './stress.mjs';
import {validateBenchmark} from '../benchmark/corpus.mjs';
const SQL=initSqlJs({locateFile:()=>__ROWGLASS_WASM_URL__});
self.onmessage=async({data})=>{
 try{const sql=await SQL;const scenario=data.pack?compileCasePack(data.pack):getScenario(data.scenarioId);if(!scenario)throw new Error('Unknown case.');
 if(data.action==='evaluate'){const extra=[...(data.extra||[]),...(data.stress?stressFixtures(scenario,data.seed):[])];if(extra.length>60)throw new Error('Too many generated fixtures.');for(const f of extra)validateRows(scenario,f.rows);self.postMessage({id:data.id,result:evaluate(sql,scenario,data.sql,extra)});}
 else if(data.action==='validate-pack'){const reference=evaluate(sql,scenario,scenario.reference);if(reference.passed!==reference.total)throw new Error('The reference or fixture constraints failed. Check the case pack.');self.postMessage({id:data.id,result:{id:scenario.id,fixtures:reference.total}});}
 else if(data.action==='suite'){const report=scenarios.map(s=>({id:s.id,title:s.title,seed:data.seed,reference:evaluate(sql,s,s.reference,stressFixtures(s,data.seed)),broken:evaluate(sql,s,s.broken,stressFixtures(s,data.seed)),mutants:s.mutants.map(m=>evaluate(sql,s,m,stressFixtures(s,data.seed)))}));self.postMessage({id:data.id,result:report});}
 else if(data.action==='corpus')self.postMessage({id:data.id,result:validateBenchmark(sql)});
 else if(data.action==='reference')self.postMessage({id:data.id,result:{sql:scenario.reference,label:'Hand-authored reference repair. This is not a model response.'}});
 else throw new Error('Unknown operation.');
 }catch(e){self.postMessage({id:data.id,error:e.message});}
};
