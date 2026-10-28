import {z} from 'zod';
import {readOnlySql,validateRows} from './engine.mjs';

const identifier=z.string().regex(/^[a-z][a-z0-9_]{0,39}$/).refine(s=>!s.startsWith('sqlite_'),'Reserved SQLite name');
const column=z.object({name:identifier,type:z.enum(['integer','real','text']),nullable:z.boolean().default(false),primaryKey:z.boolean().default(false),references:z.object({table:identifier,column:identifier}).strict().optional()}).strict();
export const contextSchema=z.object({id:z.string().regex(/^[a-z][a-z0-9-]{0,49}$/),title:z.string().min(1).max(100),contract:z.string().min(10).max(2400),comparison:z.enum(['unordered','ordered']).optional(),tables:z.array(z.object({name:identifier,columns:z.array(column).min(1).max(16)}).strict()).min(1).max(6)}).strict();
const value=z.union([z.string().max(200),z.number().finite(),z.null()]);
const fixtureSchema=z.object({id:z.string().regex(/^[a-z][a-z0-9-]{0,49}$/),label:z.string().min(1).max(120),rows:z.record(z.string(),z.array(z.array(value)).max(100))}).strict();
const packSchema=contextSchema.extend({format:z.literal('rowglass.case.v1'),baselineSQL:z.string().max(12000),referenceSQL:z.string().max(12000),fixtures:z.array(fixtureSchema).min(1).max(30)}).strict();

export function compileContext(input){
  const context=contextSchema.parse(input),names=new Set();
  const schema=context.tables.map(t=>{
    if(names.has(t.name))throw new Error('Table names must be unique.');
    const cols=new Set();
    if(!t.columns[0].primaryKey||t.columns[0].type!=='integer'||t.columns[0].nullable)throw new Error('First column must be a non-null integer primary key.');
    for(const [i,c] of t.columns.entries()){
      if(cols.has(c.name)||(i>0&&c.primaryKey))throw new Error('Column names must be unique; only the first column is a primary key.');cols.add(c.name);
      if(c.references){const parent=context.tables.find(p=>p.name===c.references.table);if(!names.has(c.references.table)||parent?.columns[0].name!==c.references.column||c.type!=='integer')throw new Error('Foreign keys must reference the primary key of an earlier table.');}
    }
    names.add(t.name);
    const fields=t.columns.map(c=>`"${c.name}" ${c.type.toUpperCase()}${c.primaryKey?' PRIMARY KEY':''}${!c.nullable?' NOT NULL':''}${c.references?` REFERENCES "${c.references.table}"("${c.references.column}")`:''}`);
    return {name:t.name,columns:t.columns.map(c=>c.name),columnDefs:t.columns,ddl:`CREATE TABLE "${t.name}" (${fields.join(', ')})`};
  });
  return {id:context.id,title:context.title,spec:context.contract,schema,context,comparison:context.comparison??'unordered'};
}

export function compileCasePack(input){
  const pack=packSchema.parse(typeof input==='string'?JSON.parse(input):input);
  const context={id:pack.id,title:pack.title,contract:pack.contract,tables:pack.tables,...(pack.comparison?{comparison:pack.comparison}:{})};
  const scenario={...compileContext(context),category:'CUSTOM CASE',short:'Your schema, contract and independent reference.',broken:readOnlySql(pack.baselineSQL),reference:readOnlySql(pack.referenceSQL),starter:pack.fixtures[0],cases:pack.fixtures.slice(1),mutants:[],pack};
  const seen=new Set();for(const f of pack.fixtures){if(seen.has(f.id))throw new Error('Fixture IDs must be unique.');seen.add(f.id);validateRows(scenario,f.rows);}
  return scenario;
}

export function toCasePack(s){
  if(s.pack)return s.pack;
  const tables=s.schema.map(t=>({name:t.name,columns:t.columns.map((name,i)=>{
    const field=t.ddl.split(',').find(x=>new RegExp(`\\b${name}\\s+(INTEGER|TEXT)\\b`,'i').test(x))||'';
    const ref=field.match(/REFERENCES\s+(\w+)\((\w+)\)/i);
    return {name,type:/INTEGER/i.test(field)?'integer':'text',primaryKey:i===0,nullable:i!==0&&!/NOT NULL/i.test(field),...(ref?{references:{table:ref[1],column:ref[2]}}:{})};
  })}));
  return {format:'rowglass.case.v1',id:s.id,title:s.title,contract:s.spec,...(s.comparison==='ordered'?{comparison:'ordered'}:{}),tables,baselineSQL:s.broken,referenceSQL:s.reference,fixtures:[s.starter,...s.cases]};
}

export function modelContext(s){const p=toCasePack(s);return {id:p.id,title:p.title,contract:p.contract,...(p.comparison==='ordered'?{comparison:'ordered'}:{}),tables:p.tables};}
