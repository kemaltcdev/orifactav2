import assert from 'node:assert/strict';
import { readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync,readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createRibbonMesh } from '../lib/ribbon-geometry.mjs';

const root=process.cwd(),out=path.join(root,'.sites-runtime','qa');mkdirSync(out,{recursive:true});
function compile(input,name,replacements={}){
 let source=readFileSync(path.join(root,input),'utf8');
 for(const [before,after] of Object.entries(replacements))source=source.replaceAll(before,after);
 const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},fileName:input});
 writeFileSync(path.join(out,name),result.outputText);
}
compile('db/schema.ts','schema.mjs');compile('lib/inquiry.ts','inquiry.mjs');
compile('app/api/inquiries/route.ts','route.mjs',{'"@/db"':'"./db-test.mjs"','"@/db/schema"':'"./schema.mjs"','"@/lib/inquiry"':'"./inquiry.mjs"'});
writeFileSync(path.join(out,'db-test.mjs'),'import {drizzle} from "drizzle-orm/d1";export function getDb(){if(!globalThis.__ORIFACTA_TEST_DB__)throw new Error("Test outage");return drizzle(globalThis.__ORIFACTA_TEST_DB__)}');
const sqlite=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(path.join('drizzle',file),'utf8'));
class Statement{
 constructor(query){this.query=query;this.params=[];}
 bind(...params){this.params=params;return this;}
 async raw(){const statement=sqlite.prepare(this.query);statement.setReturnArrays(true);return statement.all(...this.params);}
 async all(){return {results:sqlite.prepare(this.query).all(...this.params),success:true};}
 async run(){const info=sqlite.prepare(this.query).run(...this.params);return {results:[],success:true,meta:{changes:Number(info.changes),last_row_id:Number(info.lastInsertRowid)}};}
}
const adapter={prepare:query=>new Statement(query)};globalThis.__ORIFACTA_TEST_DB__=adapter;
const {POST}=await import(pathToFileURL(path.join(out,'route.mjs')).href);
const good={name:"Alex O'Connor",email:'ALEX@example.test',company:"Studio'; DROP TABLE inquiries; --",service:'B2B / custom software',budget:"Let's discuss",message:'We would like a B2B ordering portal linked to our existing stock system.',consent:true,website:''};
function request(body,headers={}){return new Request('https://orifacta.test/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://orifacta.test',...headers},body:typeof body==='string'?body:JSON.stringify(body)});}
const count=()=>sqlite.prepare('SELECT count(*) AS n FROM inquiries').get().n;
let tests=0;async function expectStatus(body,status,headers={}){const response=await POST(request(body,headers));assert.equal(response.status,status);tests++;return response;}
await expectStatus({...good,email:'broken'},400);
await expectStatus({...good,consent:false},400);
await expectStatus({...good,message:'Short'},400);
await expectStatus({...good,service:'Unrecognised service'},400);
await expectStatus({...good,website:'spam.test'},400);
await expectStatus('{invalid-json',400);
await expectStatus(good,403,{Origin:'https://unrelated.test'});
await expectStatus(good,415,{'Content-Type':'text/plain'});
await expectStatus('x'.repeat(17000),413);
assert.equal(count(),0);
const success=await expectStatus(good,201);const result=await success.json();assert.equal(result.ok,true);assert.match(result.reference,/^[0-9A-F]{8}$/);
assert.equal(count(),1);
const row=sqlite.prepare('SELECT * FROM inquiries').get();assert.equal(row.email,'alex@example.test');assert.equal(row.name,good.name);assert.equal(row.company,good.company);assert.equal(row.message,good.message);
await expectStatus({...good,email:'alex@example.test'},429);assert.equal(count(),1);
globalThis.__ORIFACTA_TEST_DB__=null;await expectStatus({...good,email:'new@example.test'},503);globalThis.__ORIFACTA_TEST_DB__=adapter;
console.log(`PASS: ${tests} enquiry API cases, actual SQL writes, normalisation, duplicate protection, safe bound values and database failure behavior.`);

for(const name of ['Icon','Ribbon','Field','Contact','Projects','Studio']){
 const replacements={'"@/lib/inquiry"':'"./inquiry.mjs"'};
 for(const sibling of ['Icon','Ribbon','Field','Contact','Projects','Studio'])replacements[`"./${sibling}"`]=`"./${sibling}.mjs"`;
 compile(`app/components/${name}.tsx`,`${name}.mjs`,replacements);
}
const {default:Studio}=await import(pathToFileURL(path.join(out,'Studio.mjs')).href);
const html=renderToString(React.createElement(Studio));writeFileSync(path.join(out,'rendered.html'),html);
assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<section\b/g)||[]).length,8);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'IDs must be unique');
for(const [,hash] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(hash),`Broken anchor: ${hash}`);
for(const [,controlled] of html.matchAll(/aria-controls="([^"]+)"/g))assert.ok(ids.includes(controlled),`Missing control target: ${controlled}`);
for(const [,file] of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g))assert.ok(existsSync(path.join(root,'public',file)),`Missing asset: ${file}`);
assert.ok(html.includes('Interactive concepts, not client case studies.'));
assert.ok(html.includes('No payment or real order')===false,'Order review opens only after interaction');
assert.ok(html.includes('name="consent"'));assert.ok(!html.includes('Starter Project'));
assert.equal((html.match(/role="tabpanel"/g)||[]).length,3);assert.equal((html.match(/tabindex="-1"/g)||[]).length>=2,true);
console.log('PASS: server rendering, section hierarchy, unique IDs, navigation anchors, tab relationships and all image assets.');
const {vertices,indices}=createRibbonMesh();assert.ok(vertices.every(Number.isFinite));assert.ok(indices.reduce((m,v)=>Math.max(m,v),0)<vertices.length/10);assert.ok(vertices.length/10<65536);
for(let i=0;i<vertices.length;i+=10){const n=Math.hypot(vertices[i+3],vertices[i+4],vertices[i+5]);assert.ok(Math.abs(n-1)<.001);}
console.log(`PASS: ribbon geometry (${vertices.length/10} vertices / ${indices.length/3} triangles), finite positions, unit normals, 16-bit indices.`);
const postcssRequire=createRequire(path.join(realpathSync('node_modules/@tailwindcss/postcss'),'package.json'));
postcssRequire('postcss').parse(readFileSync('app/globals.css','utf8'));
console.log('PASS: stylesheet syntax.');
sqlite.close();delete globalThis.__ORIFACTA_TEST_DB__;
console.log('Verification completed. No browser or production database was used.');
