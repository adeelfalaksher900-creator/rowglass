import {toCasePack} from './case-pack.mjs';

// Execution-record compatibility is independent of the app release number.
export function createReviewRecord({scenario, query, report, candidate, candidateReport, modelCalls = [], stress = false, seed = 2026}) {
  return {
    version:'0.3.0',
    scenario:{id:scenario.id,title:scenario.title,contract:scenario.spec},
    casePack:toCasePack(scenario),query,report,candidate,candidateReport,
    execution:report?{
      fixtures:report.results.map(({id,label,rows})=>({id,label,rows})),original:report,
      ...(candidateReport?{candidate:candidateReport}:{})
    }:null,
    modelCalls,stress:{enabled:stress,seed,count:stress?24:0},
    recordedAt:new Date().toISOString(),
    limitations:['Synthetic SQLite; developer-owned reference assumption.','Finite passing tests do not prove semantic equivalence.','Queries must be deterministic; volatility detection is incomplete.','Provider metadata is not independently signed proof.']
  };
}
