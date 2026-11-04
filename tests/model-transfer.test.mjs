import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createModelTransfer} from '../docs/model-transfer.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/model-manifest.json',import.meta.url)));
const bytes=name=>fs.readFileSync(new URL('../docs/models/'+name,import.meta.url));
test('all compressed delivery files decode to the exact original editable model',async()=>{
 const progress=[],loader=createModelTransfer(manifest,{onProgress:p=>progress.push(p),fetcher:async url=>new Response(bytes(url.split('/').at(-1).split('?')[0]))});
 for(const file of Object.keys(manifest))assert.deepEqual(Buffer.from(await loader.load(file)),bytes(file));
 assert.equal(progress.at(-1),95);assert.ok(progress.every(p=>p>=0&&p<=95));
});
test('progress advances during a download, and an unsupported browser receives the original model',async()=>{
 const raw=bytes('cat.glb'),progress=[];let usedUrl;
 const loader=createModelTransfer(manifest,{compressed:false,onProgress:p=>progress.push(p),fetcher:async url=>{usedUrl=url;return new Response(new ReadableStream({start(c){for(let i=0;i<raw.length;i+=65536)c.enqueue(raw.subarray(i,i+65536));c.close();}}));}});
 assert.deepEqual(Buffer.from(await loader.load('cat.glb')),raw);assert.ok(!usedUrl.includes('.gz'));assert.ok(new Set(progress).size>4);
});
test('a stalled connection times out, and the failed model can be retried successfully',async()=>{
 let stalled=true;const loader=createModelTransfer(manifest,{idleMs:25,totalMs:80,fetcher:async(url,{signal})=>stalled?new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')))):new Response(bytes('cat.glb.gz'))});
 await assert.rejects(loader.load('cat.glb'),/timed out/);stalled=false;assert.deepEqual(Buffer.from(await loader.load('cat.glb')),bytes('cat.glb'));
});
test('missing and truncated responses fail visibly instead of being parsed as a scene',async()=>{
 const absent=createModelTransfer(manifest,{fetcher:async()=>new Response('not found',{status:404})});await assert.rejects(absent.load('scene.glb'),/HTTP 404/);
 const truncated=createModelTransfer(manifest,{compressed:false,fetcher:async()=>new Response(bytes('cat.glb').subarray(0,100))});await assert.rejects(truncated.load('cat.glb'),/incomplete or invalid/);
});
test('concurrent requests for one model share the same transfer',async()=>{
 let calls=0;const loader=createModelTransfer(manifest,{fetcher:async()=>{calls++;return new Response(bytes('cozy-props.glb.gz'));}});const[a,b]=await Promise.all([loader.load('cozy-props.glb'),loader.load('cozy-props.glb')]);assert.equal(calls,1);assert.equal(a,b);
});
