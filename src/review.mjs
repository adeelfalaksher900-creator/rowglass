export function resultDelta(expected,actual,comparison='unordered'){
  const count=result=>{const m=new Map();for(const row of result?.[0]?.values||[]){const key=JSON.stringify(row);m.set(key,(m.get(key)||0)+1);}return m;};
  const a=count(expected),b=count(actual),missing=[],unexpected=[];
  for(const [key,n]of a)if(n>(b.get(key)||0))missing.push({row:JSON.parse(key),count:n-(b.get(key)||0)});
  for(const [key,n]of b)if(n>(a.get(key)||0))unexpected.push({row:JSON.parse(key),count:n-(a.get(key)||0)});
  const schemaMatches=JSON.stringify(expected?.[0]?.columns||[])===JSON.stringify(actual?.[0]?.columns||[]);
  const orderDiffers=comparison==='ordered'&&schemaMatches&&!missing.length&&!unexpected.length&&JSON.stringify(expected?.[0]?.values||[])!==JSON.stringify(actual?.[0]?.values||[]);
  return {schemaMatches,missing,unexpected,orderDiffers};
}
export function unifiedPatch(before,after,file='query.sql'){
  const safe=/^[a-zA-Z0-9_.\/-]+$/.test(file)&&!file.includes('..')?file:'query.sql';
  const a=before.trimEnd().split('\n'),b=after.trimEnd().split('\n');
  return `--- a/${safe}\n+++ b/${safe}\n@@ -1,${a.length} +1,${b.length} @@\n${a.map(s=>'-'+s).join('\n')}\n${b.map(s=>'+'+s).join('\n')}\n`;
}
export function reviewMarkdown(record){
  const r=record.execution?.original||record.report,candidate=record.execution?.candidate||record.candidateReport;
  const reduction=r.witness?JSON.stringify(r.witness.rows,null,2):r.warnings?.length?'Not reduced because a query appears nondeterministic.':'No reducible value mismatch.';
  return `# Rowglass review: ${record.scenario.title}\n\n${r.passed}/${r.total} checks agree with the supplied reference. This is finite test evidence, not an equivalence proof.\n\n${candidate?`## Tested candidate\n${candidate.passed}/${candidate.total} finite checks agree. Applying it is an explicit review action.\n${candidate.warnings?.length?`\nCandidate warnings: ${candidate.warnings.join(' ')}\n`:''}\n`:''}## Contract\n${record.scenario.contract}\n\nRow order: ${record.casePack?.comparison==='ordered'?'significant':'ignored'}. Use deterministic queries; automatic volatility detection is incomplete.\n${r.warnings?.length?`\nWarnings: ${r.warnings.join(' ')}\n`:''}\n## Execution\n${r.results.map(x=>`- ${x.pass?'PASS':x.invalid?'INVALID':'FAIL'}: ${x.label}${x.error?' ('+x.error+')':''}`).join('\n')}\n\n## Reduced mismatch\n${reduction}\n\n## Model evidence\n${record.modelCalls?.length?record.modelCalls.map(c=>`${c.provenance?.model||'unknown'} / response ${c.provenance?.responseId||'not supplied'} / ${c.passed}/${c.total}`).join('\n'):'No live model calls in this review.'}\n\nThe reference is supplied by the case author. Rowglass does not establish its correctness.\n`;
}
