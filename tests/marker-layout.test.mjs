import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../docs/vendor/three.module.js';
import {placeMarkers,overlaps} from '../docs/marker-layout.js';
const layout=JSON.parse(fs.readFileSync(new URL('../docs/layout.json',import.meta.url),'utf8'));
function sceneItems(width,height,theta,zoom){
 const h=Math.max(layout.camera.minHeight,layout.camera.minWidth/(width/height)),c=new THREE.OrthographicCamera(-h*width/height/2,h*width/height/2,h/2,-h/2,.1,100);
 const target=new THREE.Vector3(...layout.camera.target),follow=zoom>1.45?Math.min(.8,(zoom-1.45)*.8):0;
 target.x+=(layout.playerSpawn[0]-target.x)*follow;target.z+=(layout.playerSpawn[2]-target.z)*follow;target.y+=(layout.playerSpawn[1]+1-target.y)*follow;
 c.position.copy(target).add(new THREE.Vector3(Math.sin(theta)*22,17,Math.cos(theta)*22));c.lookAt(target);c.zoom=zoom;c.updateProjectionMatrix();c.updateMatrixWorld();
 const anchor=pos=>{const p=new THREE.Vector3(...pos).project(c);return{x:(p.x*.5+.5)*width,y:(-p.y*.5+.5)*height};};
 const works=layout.portfolio.map(p=>({id:'work-'+p.id,anchor:anchor(p.pin),w:92,h:36,priority:100,offset:p.offset}));
 const actions=[layout.wildlife.fish.water.map((v,i)=>v+(i===1?.25:0)),layout.wildlife.butterfly.center,layout.ball,layout.pencil.home,[layout.pond.ripple[0],.32,layout.pond.ripple[1]],[layout.box.center[0],.92,layout.box.center[2]],...Object.values(layout.cozy).map(t=>t.pin??(t.steps?.at(-1)??t.seat).map((v,i)=>v+(i===1?.35:0))),...layout.leaves.map(p=>[p[0],p[1]+.18,p[2]]),[layout.swing.pivot[0],1.15,layout.swing.pivot[2]+.6],[layout.sofa.orangeCat[0],1.71,layout.sofa.orangeCat[2]],[-1.3,.97,.65],[layout.swing.cat[0],1.47,layout.swing.cat[2]]];
 return [...works,...actions.map((p,i)=>({id:'play-'+i,anchor:anchor(p),w:22,h:22,priority:30}))];
}
test('portfolio and action labels remain separate through camera rotation, zoom and smaller screens',()=>{
 for(const[width,height]of[[1060,720],[1220,900],[1700,1080],[590,680],[390,680]])for(const zoom of[.9,1,1.6,2.25]){
  let previous=new Map();
  for(let angle=-6;angle<=6;angle++){
   const items=sceneItems(width,height,.62+angle*Math.PI/18,zoom);items.forEach(i=>i.previous=previous.get(i.id));
   const result=placeMarkers(items,{width,height});previous=new Map([...result].map(([id,r])=>[id,r.offset]));
   const rects=[...result.values()];
   for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)assert.equal(overlaps(rects[i],rects[j],8),false,`${width} ${zoom} ${angle}`);
   for(const item of items.filter(i=>i.priority===100&&i.anchor.x>=0&&i.anchor.x<=width&&i.anchor.y>=0&&i.anchor.y<=height))assert.ok(result.has(item.id),`missing ${item.id} at ${width}, zoom ${zoom}, angle ${angle}`);
   for(const r of rects)assert.ok(r.x>=12&&r.x+r.w<=width-12&&r.y>=70&&r.y+r.h<=height-142);
   if(width>=1000&&angle===0&&zoom===1)assert.equal(result.size,items.length,'all overview entrances remain visible');
  }
 }
});
test('hidden and offscreen targets cannot leave stale interactive labels',()=>{
 const items=sceneItems(1060,720,.62,1);const full=placeMarkers(items,{width:1060,height:720});assert.ok(full.size>6);
 const workOnly=placeMarkers(items.filter(i=>i.id.startsWith('work')),{width:1060,height:720});assert.equal(workOnly.size,6);
 const outside=placeMarkers([{id:'gone',anchor:{x:-10,y:100},w:90,h:32,priority:100}],{width:1060,height:720});assert.equal(outside.size,0);
});
