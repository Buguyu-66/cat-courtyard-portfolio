import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer,directory,prefix} from './serve.mjs';

async function list(dir,base=''){
 const files=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const name=path.posix.join(base,entry.name);
  if(entry.isDirectory())files.push(...await list(path.join(dir,entry.name),name));else files.push(name);
 }
 return files;
}
const files=await list(directory),all=new Set(files);
for(const required of['index.html','style.css','app.js','layout.json','.nojekyll'])assert(all.has(required),`Missing ${required}`);
for(const file of files){
 const data=await fs.readFile(path.join(directory,file));
 assert(data.length<100*1024*1024,`Oversized file: ${file}`);
 if(file.endsWith('.js')){
  for(const m of data.toString().matchAll(/^\s*import\s+(?:[^;]*?\bfrom\s*)?(['"])([^'"]+)\1/gm)){
   assert(m[2].startsWith('.'),`Nonlocal dependency: ${file} → ${m[2]}`);
   assert(all.has(path.posix.normalize(path.posix.join(path.posix.dirname(file),m[2]))),`Missing module: ${m[2]}`);
  }
 }
 if(file.endsWith('.glb')){
  assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
  const g=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)));assert(g.meshes?.length&&g.scenes?.length);
  for(const resource of[...(g.images??[]),...(g.buffers??[])])assert(!resource.uri||resource.uri.startsWith('data:'),`External model resource in ${file}`);
  if(/(?:^|\/)cat\.glb$|(?:orange|tabby|longhair)-cat\.glb$/.test(file)){
   assert(g.skins?.length,`Missing skin: ${file}`);
   for(const action of['Idle','Walk','Paw','Rest'])assert(g.animations.some(a=>a.name===action||a.name.startsWith(action+'.')),`Missing ${action}: ${file}`);
   if(file==='models/cat.glb')for(const clip of['Lounge','Stretch','Shake'])assert(g.animations.some(a=>a.name===clip),`Missing ${clip} animation`);
  }
 }
}
assert.equal(files.filter(f=>f.endsWith('.glb')).length,7);
const html=await fs.readFile(path.join(directory,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g))if(!/^https?:/.test(m[1]))assert(all.has(m[1].split('?')[0]),`Missing HTML dependency ${m[1]}`);
const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
try{
 const base='http://127.0.0.1:'+server.address().port+prefix;
 for(const file of files){const r=await fetch(base+file);assert.equal(r.status,200,`Subpath failure: ${file}`);assert.deepEqual(Buffer.from(await r.arrayBuffer()),await fs.readFile(path.join(directory,file)));}
 console.log(`PASS: ${files.length} assets match under ${prefix}; seven GLB models, cat clips and relative dependencies valid.`);
}finally{await new Promise(resolve=>server.close(resolve));}
