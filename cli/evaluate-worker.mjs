import {parentPort,workerData} from 'node:worker_threads';
import initSqlJs from 'sql.js';
import {compileCasePack} from '../src/case-pack.mjs';
import {getScenario} from '../src/scenarios.mjs';
import {evaluate} from '../src/engine.mjs';
import {stressFixtures} from '../src/stress.mjs';
try{
  const SQL=await initSqlJs();
  const s=workerData.pack?compileCasePack(workerData.pack):getScenario(workerData.scenarioId);
  if(!s)throw new Error('Unknown case.');
  const extra=[...(workerData.extra||[]),...(workerData.stress?stressFixtures(s,workerData.seed):[])];
  parentPort.postMessage({result:evaluate(SQL,s,workerData.sql,extra)});
}catch(e){parentPort.postMessage({error:e.message});}
