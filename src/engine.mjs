export function readOnlySql(sql) {
  if(typeof sql!=='string'||sql.trim().length===0||sql.length>12000) throw new Error('Enter one SQL query, up to 12,000 characters.');
  let clean='',i=0;
  while(i<sql.length){
    const c=sql[i],n=sql[i+1];
    if(c==='-'&&n==='-'){while(i<sql.length&&sql[i]!=='\n')i++;clean+=' ';continue;}
    if(c==='/'&&n==='*'){const end=sql.indexOf('*/',i+2);if(end<0)throw new Error('Close the SQL comment.');i=end+2;clean+=' ';continue;}
    if(c==="'"||c==='"'||c==='`'||c==='['){const endc=c==='['?']':c;i++;let closed=false;while(i<sql.length){if(sql[i]===endc){if(sql[i+1]===endc){i+=2;continue;}i++;closed=true;break;}i++;}if(!closed)throw new Error('Close the quoted SQL value.');clean+=' value ';continue;}
    clean+=c;i++;
  }
  const t=clean.trim().replace(/;\s*$/,'');
  if(t.includes(';')||!/^\s*(SELECT|WITH)\b/i.test(t))throw new Error('Only one read-only SELECT or WITH query is allowed.');
  if(/\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|ANALYZE|TRANSACTION|BEGIN|COMMIT|ROLLBACK|LOAD_EXTENSION|WRITEFILE|READFILE|RANDOMBLOB|ZEROBLOB)\b/i.test(t))throw new Error('Database changes, files, extensions and blob allocation are disabled.');
  return sql;
}
export function canonical(result){
  const columns=result[0]?.columns||[];const values=result[0]?.values||[];
  if(values.some(row=>row.some(value=>typeof value==='number'&&!Number.isFinite(value))))throw new Error('Non-finite output numbers are not supported.');
  return {columns,values:values.map(r=>JSON.stringify(r)).sort()};
}
export function equalResults(a,b){const x=canonical(a),y=canonical(b);return JSON.stringify(x)===JSON.stringify(y);}
export function validateRows(scenario, rows){
  if(!rows||typeof rows!=='object'||Array.isArray(rows))throw new Error('A fixture must contain table rows.');
  const known=scenario.schema.map(t=>t.name);if(Object.keys(rows).some(k=>!known.includes(k)))throw new Error('Unknown table in fixture.');
  let count=0;
  for(const table of scenario.schema){const list=rows[table.name];if(!Array.isArray(list))throw new Error('Every fixture table needs an array.');const ids=new Set();for(const row of list){count++;if(!Array.isArray(row)||row.length!==table.columns.length)throw new Error('Fixture row width does not match schema.');if(row.some(x=>!(x===null||typeof x==='string'||(typeof x==='number'&&Number.isFinite(x)))))throw new Error('Fixture values must be finite numbers, strings or NULL.');if(row.some(x=>typeof x==='string'&&x.length>200))throw new Error('Fixture text is too long.');for(let j=0;j<table.columns.length;j++){const name=table.columns[j],v=row[j],def=table.columnDefs?.[j];if(def){if(v===null&&!def.nullable)throw new Error('NULL violates a non-null column.');if(v!==null&&((def.type==='integer'&&!Number.isSafeInteger(v))||(def.type==='real'&&typeof v!=='number')||(def.type==='text'&&typeof v!=='string')))throw new Error('Fixture value does not match the declared column type.');}else{if((name==='id'||name.endsWith('_id')||name==='total_cents'||name==='active')&&v!==null&&!Number.isSafeInteger(v))throw new Error('ID, count and cents values must be safe integers.');if(name==='active'&&![0,1].includes(v))throw new Error('Active must be 0 or 1.');}}if(!Number.isSafeInteger(row[0])||ids.has(row[0]))throw new Error('Primary keys must be distinct safe integers.');ids.add(row[0]);}}
  if(count>100)throw new Error('Use at most 100 synthetic rows.');return rows;
}
export function execute(SQL,scenario,rows,sql){
  readOnlySql(sql);validateRows(scenario,rows);const db=new SQL.Database();
  try{
    // sql.js forwards the thrown value to sqlite3_result_error, which expects text.
    const denyAllocation=function(){throw 'Blob allocation and formatting functions are disabled in this review worker.';};
    Object.defineProperty(denyAllocation,'length',{value:-1});
    for(const name of ['zeroblob','randomblob','printf','format'])db.create_function(name,denyAllocation);
    db.run('PRAGMA foreign_keys=ON');for(const table of scenario.schema)db.run(table.ddl);for(const table of scenario.schema){const stmt=db.prepare(`INSERT INTO "${table.name}" VALUES (${table.columns.map(()=>'?').join(',')})`);try{for(const r of rows[table.name])stmt.run(r);}finally{stmt.free();}}db.run('PRAGMA query_only=ON');const q=db.prepare(sql);try{const columns=q.getColumnNames(),values=[];let resultBytes=0;if(columns.length>32)throw new Error('Use at most 32 output columns.');while(q.step()){if(values.length>=1000)throw new Error('Query returned more than 1,000 rows. Narrow the result.');const row=q.get();if(row.some(v=>typeof v==='number'&&!Number.isFinite(v)))throw new Error('Non-finite output numbers are not supported.');if(row.some(v=>v instanceof Uint8Array||(typeof v==='string'&&v.length>10000)))throw new Error('An output value exceeds the supported text size or is binary.');resultBytes+=JSON.stringify(row).length;if(resultBytes>1000000)throw new Error('Query output exceeds the review size limit.');values.push(row);}return [{columns,values}];}finally{q.free();}}finally{db.close();}
}
export function compare(SQL,scenario,fixture,sql){
  try {const expected=execute(SQL,scenario,fixture.rows,scenario.reference);let actual;try{actual=execute(SQL,scenario,fixture.rows,sql);}catch(e){return {...fixture,pass:false,expected,actual:[],error:e.message};}return {...fixture,pass:equalResults(expected,actual),expected,actual};}catch(e){return {...fixture,invalid:true,pass:false,error:e.message};}
}
export const rowCount = rows => Object.values(rows).reduce((sum,r)=>sum+r.length,0);
export function minimize(SQL,scenario,fixture,sql){
  let rows=structuredClone(fixture.rows),checks=0,changed=true;
  // Greedy row deletion, re-run until no single valid deletion preserves a value mismatch.
  while(changed){changed=false;for(const table of [...scenario.schema].reverse()){for(let i=rows[table.name].length-1;i>=0;i--){const attempt=structuredClone(rows);attempt[table.name].splice(i,1);checks++;const r=compare(SQL,scenario,{id:'reduced',label:'Reduced counterexample',rows:attempt},sql);if(!r.invalid&&!r.pass&&!r.error){rows=attempt;changed=true;}}}}
  return {...compare(SQL,scenario,{id:fixture.id,label:fixture.label,rows},sql),before:rowCount(fixture.rows),after:rowCount(rows),checks,minimality:'No single row can be removed while preserving this mismatch and schema constraints. This is not a global-minimum proof.'};
}
export function evaluate(SQL,scenario,sql,extra=[]){
  const cases=[scenario.starter,...scenario.cases,...extra];const results=cases.map(f=>compare(SQL,scenario,f,sql));
  const mismatch=results.find(r=>!r.pass&&!r.invalid&&!r.error);
  return {passed:results.filter(r=>r.pass).length,total:results.length,results,witness:mismatch?minimize(SQL,scenario,mismatch,sql):null};
}
