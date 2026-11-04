import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../docs/vendor/three.module.js';
import {createCozyInteractions} from '../docs/cozy-interactions.js';
import {createCollision} from '../docs/collision.js';
const layout=JSON.parse(fs.readFileSync(new URL('../docs/layout.json',import.meta.url),'utf8'));
function setup(){
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);root.scale.setScalar(.76);
 const player={root,state:'Idle'},sounds=[],discoveries=[],reactions=[];let night=false;
 const game=createCozyInteractions({scene,layout,actors:()=>({player}),setAnim:(a,s)=>a.state=s,tone:(...n)=>sounds.push(n),toast:()=>{},dropLeaf:()=>{},reactTo:()=>{},onReact:()=>reactions.push(1),onDiscover:id=>discoveries.push(id),isNight:()=>night});
 const props=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.3),new THREE.MeshStandardMaterial());mesh.name='Rocker seat';mesh.position.set(...layout.cozy.rocker.center);props.add(mesh);game.attach(props);
 const advance=(s,moving=false)=>{for(let t=0;t<s;t+=1/60)game.update(1/60,moving);};
 function enter(id){const target=layout.cozy[id];root.position.set(target.access[0],.12,target.access[1]);root.rotation.set(0,.82,0);game.candidates().find(c=>c.id===id).run();}
 return{scene,root,player,game,advance,enter,sounds,discoveries,reactions,setNight:v=>night=v};
}
test('rocker and cat move together; E and movement exit restore a walkable position and original scale',()=>{
 const s=setup(),{blocked}=createCollision(layout);s.enter('rocker');const entry=new THREE.Vector3(layout.cozy.rocker.access[0],.12,layout.cozy.rocker.access[1]);
 s.advance(2);assert.equal(s.player.state,'Lounge');assert.equal(s.game.locked,true);
 const chair=s.scene.getObjectByName('Rocking chair motion');let peak=0;for(let i=0;i<50;i++){s.advance(1/60);peak=Math.max(peak,Math.abs(chair.rotation.x));}assert.ok(peak>.015);
 const expected=new THREE.Vector3(...layout.cozy.rocker.seat).sub(chair.position).applyAxisAngle(new THREE.Vector3(1,0,0),chair.rotation.x).add(chair.position);assert.ok(s.root.position.distanceTo(expected)<1e-8);
 s.game.candidates()[0].run();s.advance(2);assert.equal(s.game.locked,false);assert.ok(s.root.position.equals(entry));assert.equal(blocked(s.root.position.x,s.root.position.z),false);assert.equal(s.root.scale.x,.76);assert.equal(s.root.rotation.x,0);
 s.enter('rocker');s.advance(2);s.advance(2,true);assert.equal(s.game.locked,false);assert.ok(s.root.position.equals(entry));
});
test('bed and climbing steps finish at their actual surfaces, with safe reversible exits',()=>{
 for(const id of['bed','tower']){const s=setup();s.enter(id);s.advance(4);assert.equal(s.player.state,id==='tower'?'Rest':'Lounge');assert.deepEqual(s.discoveries,[id]);const t=layout.cozy[id];assert.ok(s.root.position.distanceTo(new THREE.Vector3(...(t.steps?.at(-1)??t.seat)))<1e-8);s.game.exit();s.advance(4);assert.equal(s.game.locked,false);assert.ok(s.root.position.distanceTo(new THREE.Vector3(t.access[0],.12,t.access[1]))<1e-8);}
});
test('reset safely cancels every transition, and no updates while reading leave animation and position unchanged',()=>{
 for(const id of['rocker','bed','tower'])for(const duration of[.2,1,4]){const s=setup();s.enter(id);s.advance(duration);const before=s.root.position.clone();s.game.candidates();assert.ok(s.root.position.equals(before));s.game.reset();assert.equal(s.game.locked,false);assert.equal(s.root.position.y,.12);assert.equal(s.root.rotation.y,.82);assert.equal(s.root.scale.x,.76);assert.equal(s.scene.getObjectByName('Rocking chair motion').rotation.x,0);}
});
test('plucking vibrates physical strings, plays four notes once, attracts a cat and accepts another pluck after finishing',()=>{
 const s=setup();s.enter('strings');s.advance(.22);const strings=s.scene.getObjectByName('Playable violin strings');const x=strings.children[0].geometry.attributes.position.getX(10);assert.ok(Math.abs(x-(layout.cozy.strings.pin[0]-1.5*.018))>.001);assert.equal(s.reactions.length,1);assert.deepEqual(s.game.candidates(),[]);s.advance(2);assert.equal(s.game.locked,false);assert.equal(s.sounds.length,4);assert.ok(s.sounds.every(a=>a[0]==='pluck'));s.enter('strings');s.advance(2);assert.equal(s.sounds.length,8);s.game.reset();assert.equal(s.game.locked,false);
});
test('night wording updates without restarting a cat resting on the chair',()=>{
 const s=setup();assert.match(s.game.candidates().find(c=>c.id==='rocker').label,/晒太阳/);s.setNight(true);assert.match(s.game.candidates().find(c=>c.id==='rocker').label,/晚风/);s.enter('rocker');s.advance(2);const p=s.root.position.clone();s.setNight(false);assert.ok(s.root.position.equals(p));assert.equal(s.game.locked,true);
});
