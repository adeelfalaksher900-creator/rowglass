import React from 'react';

export function FixtureOverview({report,selected,onSelect}){
 return <section className="fixture-overview panel" aria-label="Executed fixture overview"><div className="fixture-overview-head"><strong>One example is not the whole test.</strong><span>{report.passed} agree · {report.total-report.passed} disagree</span></div><div className="fixture-tiles">{report.results.map((result,index)=><button type="button" key={result.id} aria-label={`${index+1}. ${result.label}: ${result.invalid?'invalid':result.pass?'agrees':'disagrees'}`} aria-pressed={selected===index} className={`fixture-tile ${result.invalid?'invalid':result.pass?'pass':'fail'}`} onClick={()=>onSelect(index)}><span>{String(index+1).padStart(2,'0')}</span><strong>{result.invalid?'Invalid':result.pass?'Pass':'Fail'}</strong></button>)}</div><p className="caption">Each tile is an executed fixture. Select one to inspect its actual rows below.</p></section>;
}

export function RowDifference({delta,expected,actual}){
 const groups=[['Missing rows',delta.missing,expected?.[0]?.columns||[]],['Unexpected rows',delta.unexpected,actual?.[0]?.columns||[]]];
 return <details className="row-difference"><summary>Inspect the missing and unexpected rows</summary>{!delta.schemaMatches&&<p>Expected columns: {JSON.stringify(expected?.[0]?.columns||[])}. Proposed columns: {JSON.stringify(actual?.[0]?.columns||[])}.</p>}<div className="row-difference-grid">{groups.map(([title,rows,columns])=><div key={title}><h3>{title}</h3><div className="table-scroll"><table aria-label={title}><thead><tr>{columns.map((column,i)=><th scope="col" key={i}>{column}</th>)}<th scope="col">occurrences</th></tr></thead><tbody>{rows.length?rows.map((entry,i)=><tr key={i}>{entry.row.map((value,j)=><td key={j}>{value===null?'NULL':String(value)}</td>)}<td>{entry.count}</td></tr>):<tr><td colSpan={columns.length+1}>None</td></tr>}</tbody></table></div></div>)}</div></details>;
}

export function ReviewGuide({busy,hasReport,onCompare,onRegression,onReference,hasWitness}){
 return <details className="review-guide panel"><summary>New here? Follow a 60-second review</summary><div className="guide-steps"><div><strong>1. Reproduce</strong><p>Select a failed fixture and compare its actual rows.</p><button type="button" className="button" disabled={busy||!hasReport} onClick={onCompare}>Compare outputs</button></div><div><strong>2. Preserve</strong><p>Keep the smallest checked failure as a runnable case.</p><button type="button" className="button" disabled={busy||!hasWitness} onClick={onRegression}>Prepare regression case</button></div><div><strong>3. Review</strong><p>Inspect a tested reference and its SQL diff before applying.</p><button type="button" className="button" disabled={busy} onClick={onReference}>Load hand-authored reference</button></div></div></details>;
}

export function revealReviewSection(id){
 const element=document.getElementById(id);
 if(!element)return;
 element.focus({preventScroll:true});
 element.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
