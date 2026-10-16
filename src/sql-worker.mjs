import initSqlJs from 'sql.js';
import {scenarios,getScenario} from './scenarios.mjs';
import {evaluate,compare,validateRows} from './engine.mjs';
const SQL=initSqlJs({locateFile:()=>'/sqlite.wasm'});
self.onmessage=async({data})=>{
 try{const sql=await SQL;const scenario=getScenario(data.scenarioId);if(!scenario)throw new Error('Unknown case.');
 if(data.action==='evaluate'){const extra=data.extra||[];for(const f of extra)validateRows(scenario,f.rows);self.postMessage({id:data.id,result:evaluate(sql,scenario,data.sql,extra)});}
 else if(data.action==='suite'){const report=scenarios.map(s=>({id:s.id,title:s.title,reference:evaluate(sql,s,s.reference),broken:evaluate(sql,s,s.broken),mutants:s.mutants.map(m=>evaluate(sql,s,m))}));self.postMessage({id:data.id,result:report});}
 else if(data.action==='reference')self.postMessage({id:data.id,result:{sql:scenario.reference,label:'Hand-authored reference repair. This is not a model response.'}});
 else throw new Error('Unknown operation.');
 }catch(e){self.postMessage({id:data.id,error:e.message});}
};
