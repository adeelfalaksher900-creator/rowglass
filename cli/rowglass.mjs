#!/usr/bin/env node
import {resolve,relative} from 'node:path';
import {Worker} from 'node:worker_threads';
import {compileCasePack,modelContext} from '../src/case-pack.mjs';
import {api} from '../server/api.mjs';
import {reviewMarkdown,unifiedPatch} from '../src/review.mjs';
import {serializeReview,verifyReview} from '../src/evidence.mjs';
import {repairLoop} from '../src/agent.mjs';
import {readBoundedText,preflightOutputs,writeNewText,REVIEW_MAX_BYTES} from './file-io.mjs';

const help=`Rowglass 0.5\n\n  node cli/rowglass.mjs check <case.json> [--query <query.sql>] [--out <review-prefix>]\n  node cli/rowglass.mjs repair <case.json> [--query <query.sql>] [--out <review-prefix>]\n  node cli/rowglass.mjs verify <review.json>\n  node cli/rowglass.mjs replay <review.json>\n\ncheck exits 0 when all finite checks pass, 1 for mismatches, 2 for invalid input/setup.\nverify checks only the review digest. A matching digest is not replay or a signature.\nreplay independently executes the full recorded suite without a provider call.\nreplay exits 0 when outcomes reproduce, 1 for disagreement, 2 for invalid input/setup.\nrepair requires NEBIUS_API_KEY, ROWGLASS_PROVIDER_MODE=private and ROWGLASS_PUBLIC!=true. It sends the case contract, schema, SQL and failure rows to Nebius.\nOnly use synthetic fixtures. Reference SQL and the full fixture suite stay local.\nOutputs are review artifacts. Your query file is never overwritten.\n`;
export function evaluateIsolated(payload,timeout=8000){return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./evaluate-worker.mjs',import.meta.url),{workerData:payload,resourceLimits:{maxOldGenerationSizeMb:96}});
  const timer=setTimeout(()=>{worker.terminate();reject(new Error('SQL execution reached its eight-second time limit.'));},timeout);
  const done=(error,result)=>{clearTimeout(timer);worker.terminate();error?reject(error):resolve(result);};
  worker.once('message',m=>done(m.error?new Error(m.error):null,m.result));worker.once('error',e=>done(e));worker.once('exit',code=>{if(code!==0)done(new Error('SQL worker stopped before completing.'));});
});}
async function main(){
  const [command,input,...args]=process.argv.slice(2);
  if(!command||command==='--help'){console.log(help);return;}
  if(!input)throw new Error('Provide an input file. Use --help for usage.');
  if(!['check','repair','verify','replay'].includes(command))throw new Error('Unknown command. Use --help.');
  const reviewInput=['verify','replay'].includes(command);
  const source=await readBoundedText(resolve(input),reviewInput?REVIEW_MAX_BYTES:800000,reviewInput?'Review file':'Case file');
  if(!reviewInput&&source.length>200000)throw new Error('Case file is too large.');
  if(reviewInput&&args.length)throw new Error('Review verification and replay do not accept output or query options.');
  if(command==='verify'){const valid=await verifyReview(JSON.parse(source));console.log(valid?'Review digest matches. This is not replay or a signature.':'Review digest does not match.');process.exitCode=valid?0:1;return;}
  if(command==='replay'){
    const replay=await evaluateIsolated({operation:'replay',envelope:JSON.parse(source)});
    console.log(replay.matches?'Review replay reproduced every recorded outcome.':'Review replay outcomes disagree:\n'+replay.differences.join('\n'));
    process.exitCode=replay.matches?0:1;return;
  }
  if(!['check','repair'].includes(command))throw new Error('Unknown command. Use --help.');
  const opts={};for(let i=0;i<args.length;i+=2){if(!['--query','--out'].includes(args[i])||!args[i+1])throw new Error('Unknown or incomplete option.');opts[args[i]]=args[i+1];}
  const prefix=resolve(opts['--out']||'rowglass-review');
  await preflightOutputs(prefix,[input,...(opts['--query']?[opts['--query']]:[])],command==='repair');
  const s=compileCasePack(source),pack=s.pack;
  const sql=opts['--query']?await readBoundedText(resolve(opts['--query']),48000,'Query file'):s.broken;
  let baseline=await evaluateIsolated({pack,sql});
  if(baseline.results.some(r=>r.invalid))throw new Error('Reference SQL or fixture constraints are invalid.');
  let report=baseline,candidate=null,modelCalls=[];
  if(command==='repair'){
    if(!process.env.NEBIUS_API_KEY)throw new Error('NEBIUS_API_KEY is required. No model call was made.');
    if(process.env.ROWGLASS_PROVIDER_MODE!=='private'||process.env.ROWGLASS_PUBLIC==='true')throw new Error('Repair requires ROWGLASS_PROVIDER_MODE=private and ROWGLASS_PUBLIC must not be true. No model call was made.');
    const result=await repairLoop({sql,action:'repair',initialReport:baseline,
      evaluateSQL:(query,extra)=>evaluateIsolated({pack,sql:query,extra}),
      requestProposal:async task=>{const r=await api(new Request('http://localhost/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenarioId:s.id,scenarioContext:modelContext(s),...task})}),process.env);const data=await r.json();if(!r.ok)throw new Error(data.error);return data;},
      onStep:step=>console.error(`Rowglass: ${step.phase} ${step.round||''}`)
    });candidate=result.candidate;report=result.candidateReport;modelCalls=result.calls;
    baseline=await evaluateIsolated({pack,sql,extra:result.extra});
  }
  const fixtures=baseline.results.map(({id,label,rows})=>({id,label,rows}));
  const execution={fixtures,original:baseline,...(candidate?{candidate:report}:{})};
  const record={version:'0.3.0',scenario:{id:s.id,title:s.title,contract:s.spec},casePack:pack,query:sql,candidate,execution,report:baseline,baseline,candidateReport:candidate?report:null,modelCalls,recordedAt:new Date().toISOString(),limitations:['Synthetic SQLite, finite tests, author-supplied reference.','Model response IDs are provider metadata, not independently signed proof.']};
  const reviewText=await serializeReview(record);
  await writeNewText(prefix+'.json',reviewText);await writeNewText(prefix+'.md',reviewMarkdown(record));
  if(candidate){await writeNewText(prefix+'.candidate.sql',candidate.sql+'\n');await writeNewText(prefix+'.patch',unifiedPatch(sql,candidate.sql,opts['--query']?relative(process.cwd(),resolve(opts['--query'])):'query.sql'));}
  console.log(`${report.passed}/${report.total} finite checks passed. Review: ${prefix}.json`);process.exitCode=report.passed===report.total?0:1;
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname)main().catch(e=>{console.error('Rowglass: '+e.message);process.exitCode=2;});
