// Treat a reference and its executed report as one transaction. An old passing
// result must never become evidence for a newly loaded, unevaluated query.
export async function loadReferenceRepair({run, clear, commit, isCurrent = () => true}) {
  clear();
  const reference = await run('reference');
  if (!isCurrent()) return;
  const report = await run('evaluate', {sql: reference.sql});
  if (!isCurrent()) return;
  commit({...reference, explanation: reference.label,
    cautions: ['Hand-authored reference. Passing finite tests does not prove universal correctness.'],
    provenance: {mode: 'reference'}}, report);
}

// Reset changes the query and fixture options. Old evidence is cleared before
// either change becomes visible, even when the new evaluation fails.
export async function resetLocalReview({clear, evaluate, commit, isCurrent = () => true}) {
  clear();
  const report = await evaluate();
  if (isCurrent()) commit(report);
}
