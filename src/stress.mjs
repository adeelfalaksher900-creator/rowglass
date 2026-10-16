export function stressFixtures(scenario,seed=2026,count=24){
  if(!['missing-customers','join-fanout','null-exclusion'].includes(scenario.id)||scenario.pack)return [];
  let state=Number(seed)>>>0;const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const integer=n=>Math.floor(next()*n),pick=xs=>xs[integer(xs.length)];
  const fixtures=[];
  for(let n=0;n<Math.min(48,Math.max(0,count));n++){
    let rows;
    if(scenario.id==='missing-customers'){
      rows={customers:[],orders:[]};let order=0;
      for(let i=0;i<integer(5)+1;i++){rows.customers.push([i,pick(['Ari','Sam','Sam','Noor'])]);for(let j=0;j<integer(4);j++)rows.orders.push([order++,i,pick(['paid','pending',null])]);}
    }else if(scenario.id==='join-fanout'){
      rows={orders:[],items:[]};let item=0;
      for(let i=0;i<integer(7)+1;i++){rows.orders.push([i,integer(3),pick([0,100,100,250,-50]),pick(['paid','paid','pending',null])]);for(let j=0;j<integer(5);j++)rows.items.push([item++,i,pick(['A','B',null])]);}
    }else{
      rows={subscribers:[],suppressions:[]};const total=integer(6)+1;
      for(let i=0;i<total;i++)rows.subscribers.push([i,`s${i}@example.test`,integer(2)]);
      for(let j=0;j<integer(8)+1;j++)rows.suppressions.push([j,next()<0.35?null:integer(total)]);
    }
    fixtures.push({id:`stress-${seed}-${n}`,label:`Seed ${seed} / generated fixture ${n+1}`,rows,source:'deterministic generator'});
  }
  return fixtures;
}
