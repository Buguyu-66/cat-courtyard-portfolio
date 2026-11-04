import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../docs/vendor/three.module.js';
import {createMischief} from '../docs/mischief.js';
const layout=JSON.parse(fs.readFileSync(new URL('../docs/layout.json',import.meta.url),'utf8'));

function setup() {
  const scene = new THREE.Scene(), discoveries = [], carry = [];
  const actor = (x,y,z) => {const root=new THREE.Group();root.position.set(x,y,z);root.scale.setScalar(.76);scene.add(root);return {root,home:root.position.clone(),reactUntil:0};};
  const actors = {player:actor(-5,.12,2.35),tabby:actor(-1,.12,0),longhair:actor(...layout.swing.cat)};
  const obstacles = [];let allBlocked = false;
  const game = createMischief({scene,layout,actors:()=>actors,blocked:()=>allBlocked,obstacles,toast:()=>{},tone:()=>{},setAnim:(a,s)=>a.state=s,onCarry:v=>carry.push(v),onDiscover:id=>discoveries.push(id)});
  const action = label => game.candidates().filter(c=>c.label.includes(label)).sort((a,b)=>a.d-b.d)[0].run();
  const advance = seconds => {for(let t=0;t<seconds;t+=1/60)game.update(1/60,false);};
  return {scene,actors,game,obstacles,discoveries,carry,action,advance,setBlocked:v=>allBlocked=v};
}

test('carried leaf follows the cat; unsafe release restores a reachable original location',()=>{
  const s=setup(),leaf=s.scene.getObjectByName('Carryable autumn leaf 0'),home=leaf.position.clone();
  s.action('叼起');s.actors.player.root.position.set(1,.12,1);s.advance(.1);
  assert.ok(leaf.position.distanceTo(home)>3);assert.equal(s.carry.at(-1),true);
  s.setBlocked(true);assert.equal(s.game.dropLeaf(),true);assert.ok(leaf.position.equals(home));
  assert.equal(s.carry.at(-1),false);assert.equal(s.game.dropLeaf(),false);
});

test('rug discovery and cat interest persist across repeated pickup and release',()=>{
  const s=setup();s.action('叼起');s.actors.player.root.position.set(-1.4,.12,.3);s.game.dropLeaf();
  assert.deepEqual(s.discoveries,['leaf']);assert.ok(s.game.tabbyTarget());
  s.action('叼起');s.game.dropLeaf();assert.deepEqual(s.discoveries,['leaf']);
  s.advance(7);assert.equal(s.game.tabbyTarget(),null);
});

test('box transitions can be reset halfway and exited with movement without changing cat size or entry',()=>{
  const s=setup(),p=s.actors.player.root;p.position.set(layout.box.access[0],.12,layout.box.access[1]);p.rotation.y=1.2;
  const entry=p.position.clone(),scale=p.scale.clone();s.action('钻进');s.advance(.3);assert.equal(s.game.locked,true);
  s.game.reset();assert.ok(p.position.equals(entry));assert.ok(p.scale.equals(scale));assert.equal(s.game.locked,false);
  for(let i=0;i<3;i++){s.action('钻进');s.advance(1.2);assert.equal(s.game.hiddenMeow(),true);s.game.update(.1,true);s.advance(1.2);assert.equal(s.game.locked,false);assert.ok(p.position.equals(entry));assert.ok(p.scale.equals(scale));assert.ok(Math.abs(p.rotation.y-1.2)<1e-9);}
});

test('swing and cat move together, stay bounded after rapid pushes, then settle and reset',()=>{
  const s=setup(),seat=new THREE.Mesh(new THREE.BoxGeometry(1,.1,.6));seat.position.set(layout.swing.cat[0],.55,layout.swing.cat[2]);s.game.attachSwingMesh(seat);
  const swing=s.scene.getObjectByName('Animated swing'),cat=s.actors.longhair;
  for(let i=0;i<20;i++)s.action('轻推');s.advance(.35);assert.ok(Math.abs(swing.rotation.x)>.02);assert.ok(Math.abs(swing.rotation.x)<=.16);
  assert.ok(cat.root.position.distanceTo(cat.home)>.05);assert.equal(cat.root.rotation.x,swing.rotation.x);
  s.advance(15);assert.equal(swing.rotation.x,0);assert.ok(cat.root.position.distanceTo(cat.home)<1e-9);assert.equal(cat.reactUntil,0);
  s.action('轻推');s.advance(.3);s.game.reset();assert.equal(swing.rotation.x,0);assert.ok(cat.root.position.equals(cat.home));
});
