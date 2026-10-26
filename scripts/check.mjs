import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer,directory,prefix} from './serve.mjs';
const relative=new Set(['index.html','style.css','game.js','.nojekyll']);
async function visit(file){
 const full=path.join(directory,file),data=await fs.readFile(full);
 assert(data.length<100*1024*1024,'File exceeds GitHub regular Git limit: '+file);
 if(file.endsWith('.js')){
  for(const match of data.toString().matchAll(/^\s*import\s+[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/gm)){
   assert(match[1].startsWith('.'),'Unresolved bare dependency: '+match[1]);
   const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
   if(!relative.has(target)){relative.add(target);await visit(target);}
  }
 }
 return data;
}
for(const file of ['index.html','style.css','game.js'])await visit(file);
for(const name of ['scene','cat','owner','gardener']){
 const file='models/'+name+'.glb',b=await visit(file);relative.add(file);
 assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);
 const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert(j.meshes.length>0&&j.scenes.length>0);
 for(const item of [...(j.images||[]),...(j.buffers||[])])assert(!item.uri||item.uri.startsWith('data:'),'External GLB dependency in '+name);
 if(name!=='scene')assert(j.animations?.some(a=>a.name==='Walk'),'Missing walk animation in '+name);
}
const html=await fs.readFile(path.join(directory,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g))if(!/^https?:/.test(match[1]))assert(await fs.stat(path.join(directory,match[1])));
const server=createServer();server.listen(0,'127.0.0.1');await once(server,'listening');
try{
 const base='http://127.0.0.1:'+server.address().port+prefix;
 for(const file of relative){const response=await fetch(base+file);assert.equal(response.status,200,'Project subpath fails: '+file);await response.arrayBuffer();}
 console.log('PASS: '+relative.size+' assets available from project subpath; relative imports and embedded GLB resources valid.');
}finally{await new Promise(resolve=>server.close(resolve));}
