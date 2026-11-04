import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../docs/vendor/three.module.js';
import {createDayNight} from '../docs/day-night.js';
function setup(){const scene=new T.Scene();scene.background=new T.Color();const renderer={toneMappingExposure:1},hemisphere=new T.HemisphereLight(),sun=new T.DirectionalLight(),ambient=new T.AmbientLight(),floor=new T.Mesh(new T.PlaneGeometry(),new T.MeshStandardMaterial());const light=createDayNight({scene,renderer,hemisphere,sun,ambient,floor});return{scene,renderer,hemisphere,sun,ambient,floor,light};}
test('manual night transition illuminates real light sources and returns to exact daylight',()=>{
 const s=setup(),color=s.scene.background.clone();assert.equal(s.light.night,false);assert.ok(s.light.lights.every(l=>l.light.intensity===0));
 const material=new T.MeshStandardMaterial();s.light.registerMaterial(material,'lantern');s.light.setNight(true);s.light.update(1.5);assert.equal(s.light.amount,.5);assert.ok(s.light.lights.every(l=>l.light.intensity>0));s.light.update(1.5);assert.equal(s.light.amount,1);assert.equal(material.emissiveIntensity,2.8);assert.ok(s.sun.intensity<.6);assert.ok(s.hemisphere.intensity>.3);
 s.light.setNight(false);s.light.update(3);assert.equal(s.light.amount,0);assert.ok(s.scene.background.equals(color));assert.equal(s.sun.intensity,2.6);assert.ok(s.light.lights.every(l=>l.light.intensity===0));
});
test('repeated toggles reverse smoothly without touching scene positions or game state',()=>{
 const s=setup(),cat=new T.Group();cat.position.set(3.5,.12,3.65);s.scene.add(cat);const original=cat.position.clone();s.light.setNight(true);s.light.update(.8);const level=s.light.amount;s.light.setNight(false);assert.equal(s.light.amount,level);s.light.update(.1);assert.ok(s.light.amount<level);s.light.setNight(true);s.light.update(3);assert.equal(s.light.amount,1);assert.ok(cat.position.equals(original));
});
test('lamps loaded after an early night toggle receive the current light level',()=>{
 const s=setup();s.light.setNight(true);s.light.update(3);const lamp=new T.MeshStandardMaterial();s.light.registerMaterial(lamp,'shade');assert.equal(lamp.emissiveIntensity,.8);
 s.light.setNight(false);s.light.update(1.5);const lantern=new T.MeshStandardMaterial();s.light.registerMaterial(lantern,'lantern');assert.equal(lantern.emissiveIntensity,1.5);s.light.update(1.5);assert.equal(lamp.emissiveIntensity,0);assert.equal(lantern.emissiveIntensity,.2);
});
