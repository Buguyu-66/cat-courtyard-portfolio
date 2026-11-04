import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCollision} from '../docs/collision.js';
import {findPath} from '../docs/navigation.js';
const layout=JSON.parse(fs.readFileSync(new URL('../docs/layout.json',import.meta.url),'utf8'));
const {blocked,obstacles}=createCollision(layout);
obstacles.push([layout.box.center[0],layout.box.center[2],.47,.46]);
test('integrated scene matches the moved desk, instrument and retained room anchors',()=>{
 const b=fs.readFileSync(new URL('../docs/models/scene.glb',import.meta.url));const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 for(const[name,x,z]of[['Work desk',...layout.desk.center],['Desk chair',...layout.desk.chair],['Cello',...layout.cello],['Garden model walnut table',...layout.modelTable],['Rear wall',-2.1,-4.03],['Swing seat',layout.swing.cat[0],layout.swing.cat[2]],['Arch post',layout.arch[0]-.75,layout.arch[1]],['Square sofa solid base',...layout.sofa.center]]){
  const n=g.nodes.find(n=>n.name===name);assert.ok(n,name);assert.ok(Math.abs(n.translation[0]-x)<.001&&Math.abs(n.translation[2]-z)<.001,name);
 }
 assert.equal(g.nodes.some(n=>n.name==='Cream sofa'),false);
 assert.ok(g.nodes.some(n=>n.name==='Square sofa olive throw'));
});
test('both tables are fully on timber, while arch and lantern posts are fully on grass',()=>{
 const inside=(r,x,z)=>x>=r.minX&&x<=r.maxX&&z>=r.minZ&&z<=r.maxZ;
 const deck=(x,z)=>inside(layout.deck,x,z);
 assert.equal(layout.deck.maxX,layout.garden.minX);
 assert.ok(layout.garden.maxX-layout.garden.minX>5.5);
 for(const[x,z,w,d]of[[...layout.desk.center,3.52,1.25],[...layout.modelTable,2.1,1.3]])for(const sx of[-1,1])for(const sz of[-1,1])assert.ok(deck(x+sx*w/2,z+sz*d/2));
 const[ax,az]=layout.arch;
 for(const[x,z,r]of[[ax-.75,az,.12],[ax+.75,az,.12],[ax-1.02,az+.15,.16],[ax+1.05,az+.15,.16]])for(const sx of[-1,1])for(const sz of[-1,1]){
  assert.equal(deck(x+sx*r,z+sz*r),false);
  assert.ok(inside(layout.garden,x+sx*r,z+sz*r));
 }
});
test('click-to-walk routes around enlarged furniture to each playful target and back',()=>{
 const targets=[[layout.playerSpawn[0],layout.playerSpawn[2]],layout.box.access,...Object.values(layout.cozy).map(p=>p.access),[layout.ball[0],layout.ball[2]],layout.pencil.access,layout.pond.interaction,layout.swing.access,[-2.4,-1.65],...layout.leaves.map(p=>[p[0],p[2]]),...layout.portfolio.map(p=>p.access)];
 for(const a of targets)for(const b of targets){
  const path=findPath({x:a[0],z:a[1]},{x:b[0],z:b[1]},blocked);
  assert.ok(path.length,`route ${a} to ${b}`);let prev={x:a[0],z:a[1]};
  for(const p of path){for(let i=1;i<=10;i++)assert.equal(blocked(prev.x+(p.x-prev.x)*i/10,prev.z+(p.z-prev.z)*i/10),false,`route ${a} to ${b}`);prev=p;}
  assert.ok(Math.hypot(prev.x-b[0],prev.z-b[1])<.4);
 }
});
test('continuous entrance-to-swing path is walkable with cat clearance',()=>{
 for(let i=1;i<layout.gardenPath.length;i++){
  const a=layout.gardenPath[i-1],b=layout.gardenPath[i];
  for(let k=0;k<=30;k++)assert.equal(blocked(a[0]+(b[0]-a[0])*k/30,a[1]+(b[1]-a[1])*k/30,.27),false,`path segment ${i}, sample ${k}`);
 }
});
test('spawn and all work/pond access locations stay on dry, walkable ground',()=>{
 for(const p of [[layout.playerSpawn[0],layout.playerSpawn[2]],...layout.portfolio.map(p=>p.access),layout.pond.interaction,layout.pencil.access])assert.equal(blocked(...p),false,`${p}`);
 assert.equal(blocked(...layout.pond.center),true);
});
test('all cats retain skin weights and the four usable action clips after re-export',()=>{
 for(const name of ['cat','orange-cat','tabby-cat','longhair-cat']){
  const bytes=fs.readFileSync(new URL(`../docs/models/${name}.glb`,import.meta.url));
  assert.equal(bytes.readUInt32LE(0),0x46546c67);const n=bytes.readUInt32LE(12);const g=JSON.parse(bytes.subarray(20,20+n));
  assert.ok(g.skins?.length);assert.ok(g.meshes.some(m=>m.primitives.some(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined)));
  for(const clip of ['Idle','Walk','Paw','Rest'])assert.ok(g.animations.some(a=>a.name.includes(clip)&&a.channels.length),`${name} ${clip}`);
  assert.equal(g.images.some(im=>im.uri),false,'textures should be embedded');
 }
});
