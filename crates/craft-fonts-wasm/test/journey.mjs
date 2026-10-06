import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const origin=process.env.TEST_URL || 'http://127.0.0.1:18876';
const manifest=await readFile(new URL('../../../fonts/manifest.txt',import.meta.url),'utf8');
const response=await fetch(origin+'/api/fonts');assert.equal(response.status,200);
const fonts=await response.json();assert(fonts.length>0);
const parsed=await fetch(origin+'/api/manifest',{method:'POST',body:manifest});assert.equal(parsed.status,200);assert.deepEqual(await parsed.json(),fonts);
const scripts=[...new Set(fonts.flatMap(f=>f.scripts))];
for(const script of scripts){assert.deepEqual(await(await fetch(origin+'/api/fonts?script='+script)).json(),fonts.filter(f=>f.scripts.includes(script)));}
for(const f of fonts){
 const file=await fetch(origin+'/'+f.file);assert.equal(file.status,200,f.file);
 const bytes=Buffer.from(await file.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256,f.file);
 const licence=await fetch(origin+'/'+f.licence_file);assert.equal(licence.status,200);assert((await licence.text()).length>0);
}
const invalid=await fetch(origin+'/api/manifest',{method:'POST',body:'bad | manifest'});assert.equal(invalid.status,400);assert.match((await invalid.json()).error,/expected 8 fields/);
assert.equal((await fetch(origin+'/no-such-font.ttf')).status,404);
console.log(JSON.stringify({ok:true,fonts:fonts.length,scripts:scripts.length,checks:['WASM manifest parse/catalog/filter','all font bytes SHA256','all licence assets','invalid input/404']}));
