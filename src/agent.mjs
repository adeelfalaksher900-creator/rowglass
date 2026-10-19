function feedbackFor(report){
  const failures=report?.results.filter(r=>!r.pass).slice(0,2).map(r=>({label:r.label,error:r.error,rows:r.rows,expected:r.expected?.map(o=>({...o,values:o.values.slice(0,8)})),actual:r.actual?.map(o=>({...o,values:o.values.slice(0,8)}))}))||[];
  return JSON.stringify({failures}).slice(0,5800);
}
export async function repairLoop({sql,action,extra=[],initialReport,requestProposal,evaluateSQL,onStep=()=>{},signal,maxRounds=2}){
  if(maxRounds!==1&&maxRounds!==2)throw new TypeError('Use one or two proposal rounds.');
  const check=()=>signal?.throwIfAborted();
  check();
  if(!initialReport){initialReport=await evaluateSQL(sql,[...extra]);check();}
  let current=sql,fixtures=[...extra],report=initialReport,originalReport=initialReport,candidate=null,candidateReport=null;
  const fixtureIds=new Set([...(initialReport.results||[]),...fixtures].map(f=>f.id));
  const calls=[];
  for(let round=0;round<(action==='repair'?maxRounds:1);round++){
    check();onStep({phase:round?'revise':'generate',round:round+1});
    const output=await requestProposal({sql:current,action,feedback:feedbackFor(report)});check();
    if(action==='challenge')output.sql=sql;
    if(output.fixture){
      if(fixtures.length>=8)throw new Error('Eight generated fixtures are enough for one case. Reset the case to start a new review.');
      let ordinal=fixtures.length+1;
      while(fixtureIds.has(`generated-${ordinal}`))ordinal++;
      const f={id:`generated-${ordinal}`,label:output.fixture.label,rows:output.fixture.rows,source:'model-generated'};
      const checked=await evaluateSQL(sql,[...fixtures,f]);check();
      if(checked.results.find(r=>r.id===f.id)?.invalid)throw new Error('Generated fixture violates schema constraints. It was rejected.');
      originalReport=checked;
      fixtures.push(f);
      fixtureIds.add(f.id);
    }
    onStep({phase:'execute',round:round+1});
    candidateReport=await evaluateSQL(output.sql,fixtures);check();candidate=output;
    calls.push({round:round+1,action,sql:output.sql,provenance:output.provenance,passed:candidateReport.passed,total:candidateReport.total});
    onStep({phase:'checked',round:round+1,candidate,candidateReport,originalReport,extra:fixtures,calls:[...calls]});
    report=candidateReport;
    if(action==='challenge'||report.passed===report.total)break;
    current=output.sql;
  }
  return {candidate,candidateReport,originalReport,extra:fixtures,calls};
}
