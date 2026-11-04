import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../docs/vendor/three.module.js';
import {createGardenWildlife} from '../docs/garden-wildlife.js';
import {createCollision} from '../docs/collision.js';
const layout=JSON.parse(fs.readFileSync(new URL('../docs/layout.json',import.meta.url),'utf8'));
function setup(){
 const scene=new T.Scene(),root=new T.Group();scene.add(root);root.scale.setScalar(.76);const player={root},discoveries=[],{blocked}=createCollision(layout);
 const game=createGardenWildlife({scene,layout,actors:()=>({player}),setAnim:(a,s)=>a.state=s,tone:()=>{},toast:()=>{},onDiscover:id=>discoveries.push(id),reactTo:()=>{},dropLeaf:()=>{},blocked});
 const advance=(s,moving=false)=>{for(let t=0;t<s;t+=1/60)game.update(1/60,moving);};
 function enter(id){root.position.set(layout.wildlife[id].access[0],.12,layout.wildlife[id].access[1]);root.rotation.y=.7;game.candidates().find(c=>c.id===id).run();}
 return{scene,root,player,game,advance,enter,discoveries,blocked};
}
test('three koi swim inside the pond with visibly moving tails',()=>{
 const s=setup(),fish=s.scene.children.filter(o=>o.name.startsWith('Pond koi'));assert.equal(fish.length,3);const first=fish[0].position.clone();s.advance(2);assert.ok(fish[0].position.distanceTo(first)>.3);
 for(const f of fish){assert.ok(((f.position.x-layout.pond.center[0])/layout.pond.radius[0])**2+((f.position.z-layout.pond.center[1])/layout.pond.radius[1])**2<1);assert.ok(Math.abs(f.getObjectByName('Koi swishing tail').rotation.y)>.01);}
});
test('catching lifts a fish, returns it to water, shakes the paw, and leaves the cat on dry land',()=>{
 const s=setup(),fish=s.scene.getObjectByName('Pond koi 0');for(let round=0;round<2;round++){
  s.enter('fish');const entry=s.root.position.clone();s.advance(2.2);assert.ok(fish.position.y>.4);assert.equal(s.game.locked,true);assert.equal(s.player.state,'Paw');assert.ok(s.root.position.equals(entry));
  s.advance(1.6);assert.equal(s.player.state,'Shake');s.advance(2);assert.equal(s.game.locked,false);assert.ok(fish.position.y<.2);assert.ok(s.root.position.equals(entry));assert.equal(s.blocked(entry.x,entry.z),false);assert.equal(s.root.rotation.y,.7);
 }assert.deepEqual(s.discoveries,['fish','fish']);assert.equal(s.scene.children.filter(o=>o.name.startsWith('Pond koi')).length,3);
});
test('butterfly pounce has a visible jump, returns to its entry and can be cancelled safely',()=>{
 const s=setup();s.enter('butterfly');const entry=s.root.position.clone();s.advance(1.15);assert.ok(s.root.position.y>.4);assert.equal(s.blocked(s.root.position.x,s.root.position.z),false);s.advance(3);assert.equal(s.game.locked,false);assert.ok(s.root.position.equals(entry));assert.deepEqual(s.discoveries,['butterfly']);
 s.enter('butterfly');s.advance(.8,true);assert.equal(s.game.locked,false);assert.ok(s.root.position.equals(entry));
});
test('interrupting or resetting fishing at each stage restores pose and removes temporary water effects',()=>{
 for(const seconds of[.2,1.6,2.3,3.1,3.8]){const s=setup(),count=s.scene.children.length;s.enter('fish');const entry=s.root.position.clone();s.advance(seconds);s.game.reset();assert.equal(s.scene.children.length,count);assert.equal(s.game.locked,false);assert.ok(s.root.position.equals(entry));assert.equal(s.root.rotation.y,.7);assert.equal(s.root.scale.x,.76);assert.equal(s.player.state,'Idle');}
});
