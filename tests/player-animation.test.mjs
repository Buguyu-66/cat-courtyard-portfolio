import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const bytes=fs.readFileSync(new URL('../docs/models/cat.glb',import.meta.url)),jsonLength=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+jsonLength)),binaryOffset=28+jsonLength;
function values(id){const a=g.accessors[id],b=g.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3,VEC4:4}[a.type];assert.equal(a.componentType,5126);return Array.from({length:a.count},(_,i)=>Array.from({length:n},(_,k)=>bytes.readFloatLE(binaryOffset+(b.byteOffset??0)+(a.byteOffset??0)+i*(b.byteStride??n*4)+k*4)));}
test('new stretch and shake retain joint motion, while walking and pawing remain animated',()=>{
 for(const name of['Idle','Walk','Paw','Rest','Lounge','Stretch','Shake']){
  const clip=g.animations.find(a=>a.name===name);assert.ok(clip,name);
  const rotations=clip.channels.filter(c=>c.target.path==='rotation').map(c=>({node:g.nodes[c.target.node].name,frames:values(clip.samplers[c.sampler].output)}));
  assert.ok(rotations.length>=5,`${name}: joint tracks`);
  if(['Walk','Paw','Stretch','Shake'].includes(name))assert.ok(rotations.some(r=>r.frames.some(frame=>frame.some((v,k)=>Math.abs(v-r.frames[0][k])>.05))),`${name}: actual changing joint rotations`);
  if(name==='Stretch')for(const r of rotations)for(let k=0;k<4;k++)assert.ok(Math.abs(r.frames[0][k]-r.frames.at(-1)[k])<.001,'stretch ends in neutral pose');
 }
});
