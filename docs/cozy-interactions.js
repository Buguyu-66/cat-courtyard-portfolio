import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

// Furniture transforms and cat transitions share one clock, paused with the scene.
export function createCozyInteractions({scene,layout,actors,setAnim,tone,toast,dropLeaf,reactTo,onReact,onDiscover,isNight=()=>false}) {
 const config=layout.cozy,rocker=new THREE.Group(),strings=new THREE.Group();
 rocker.name='Rocking chair motion';rocker.position.set(...config.rocker.center);scene.add(rocker);
 strings.name='Playable violin strings';scene.add(strings);
 let available=false,time=0,state=null,seat=null,phase=0,step=0,route=[],from=null,entry=null,entryRotation=null,entryScale=null,rockAngle=0,pluckTime=99,notes=0;
 const targets={rocker:{...config.rocker,label:'跳上摇椅晒太阳',icon:'☀',yaw:0},bed:{...config.bed,label:'在窗边猫窝打个盹',icon:'☾',yaw:Math.PI/2},tower:{...config.tower,label:'爬上猫爬架看看风景',icon:'⌂',yaw:.5}};
 const v=p=>new THREE.Vector3(...p),distance=(p,a)=>Math.hypot(p.x-a[0],p.z-a[1]);
 const pin=config.strings.pin;
 for(let n=0;n<4;n++){
  const points=[];for(let j=0;j<=20;j++){const t=j/20;points.push(new THREE.Vector3(pin[0]+(n-1.5)*.018,.43+t*.94,pin[2]-.16*t));}
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#ded5b5'}));line.name='Independent violin string '+n;strings.add(line);
 }
 function attach(root){
  root.updateMatrixWorld(true);const batches=new Map();
  root.traverse(o=>{if(!o.isMesh)return;const moving=o.name.startsWith('Rocker'),key=(moving?'rock':'fixed')+o.material.uuid;
   let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);
   if(moving)g.translate(-rocker.position.x,-rocker.position.y,-rocker.position.z);
   for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);
   if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
   g.clearGroups();if(!batches.has(key))batches.set(key,{moving,material:o.material,geometries:[]});batches.get(key).geometries.push(g);
  });
  for(const {moving,material,geometries}of batches.values()){
   const m=new THREE.Mesh(mergeGeometries(geometries),material);m.castShadow=true;m.receiveShadow=true;(moving?rocker:scene).add(m);geometries.forEach(g=>g.dispose());
  }
  available=true;
 }
 function capture(){const a=actors().player;entry=a.root.position.clone();entryRotation=a.root.rotation.clone();entryScale=a.root.scale.clone();dropLeaf();}
 function enter(id){
  if(!available||state)return;const t=targets[id],a=actors().player;if(distance(a.root.position,t.access)>.8)return;
  capture();seat=id;state='enter';route=(t.steps??[t.seat]).map(v);step=0;phase=0;from=a.root.position.clone();setAnim(a,'Paw');
  toast(id==='rocker'?(isNight()?'跳上摇椅，听听夜里的花园':'跳上摇椅，找一个晒太阳的位置'):id==='bed'?'踩一踩软垫，在窗边窝成一团':'一步一步爬高，看看小院的风景');
 }
 function exit(){
  if(state!=='rest')return false;const a=actors().player,t=targets[seat];
  state='exit';route=[...(t.steps??[]).slice(0,-1).reverse().map(v),entry.clone()];step=0;phase=0;from=a.root.position.clone();setAnim(a,'Paw');return true;
 }
 function pluck(){
  if(!available||state||distance(actors().player.root.position,config.strings.access)>.8)return;
  capture();state='pluck';phase=0;notes=0;pluckTime=0;setAnim(actors().player,'Paw');
  actors().player.root.rotation.y=Math.atan2(pin[0]-entry.x,pin[2]-entry.z);
  reactTo(v([pin[0],.12,config.strings.access[1]]),6);onReact?.();onDiscover?.('strings');toast('轻轻拨一下琴弦，秋千上的猫也竖起了耳朵');
 }
 function candidates(){
  const a=actors().player;if(!a||!available)return[];
  if(state==='rest')return[{id:seat,icon:'↓',label:seat==='rocker'?'跳下摇椅，继续逛逛':seat==='bed'?'离开猫窝，伸个懒腰':'从猫爬架跳下来',pin:a.root.position.clone().add(v([0,.65,0])),d:0,range:1,run:exit}];
  if(state)return[];
  return [...Object.entries(targets).map(([id,t])=>({id,icon:t.icon,label:id==='rocker'&&isNight()?'跳上摇椅，享受晚风':t.label,pin:v(t.steps?.at(-1)??t.seat).add(v([0,.35,0])),access:t.access,d:distance(a.root.position,t.access),range:.7,run:()=>enter(id)})),
   {id:'strings',icon:'♫',label:'抬爪拨动小提琴琴弦',pin:v(pin),access:config.strings.access,d:distance(a.root.position,config.strings.access),range:.7,run:pluck}];
 }
 function restore(){const a=actors().player;if(a&&entry){a.root.position.copy(entry);a.root.rotation.copy(entryRotation);a.root.scale.copy(entryScale);setAnim(a,'Idle');}state=null;seat=null;phase=0;}
 function update(dt,moving=false){
  time+=dt;pluckTime+=dt;const a=actors().player;if(!a)return;
  if(state==='rest'&&moving)exit();
  const want=state==='rest'&&seat==='rocker'?Math.sin(time*1.7)*.038:0;rockAngle=THREE.MathUtils.damp(rockAngle,want,5,dt);rocker.rotation.x=rockAngle;
  if(state==='pluck'){
   phase+=dt;a.root.position.copy(entry);a.root.position.y+=Math.sin(Math.min(1,phase/1.2)*Math.PI)*.09;
   if(notes<4&&phase>=.18+notes*.19){tone('pluck',notes++);pluckTime=0;}
   if(phase>=1.35)restore();
  }else if(state==='enter'||state==='exit'){
   const end=route[step],duration=.65+Math.abs(end.y-from.y)*.16;phase=Math.min(1,phase+dt/duration);const e=phase*phase*(3-2*phase);
   a.root.position.lerpVectors(from,end,e);a.root.position.y+=Math.sin(phase*Math.PI)*(state==='enter'?.3:.22);
   a.root.rotation.x=0;a.root.rotation.z=0;const yaw=state==='enter'?targets[seat].yaw:entryRotation.y;
   a.root.rotation.y+=Math.atan2(Math.sin(yaw-a.root.rotation.y),Math.cos(yaw-a.root.rotation.y))*Math.min(1,dt*8);
   if(phase===1){step++;phase=0;from=end.clone();if(step===route.length){if(state==='exit'){restore();toast('轻轻落地，继续探索小院');}else{state='rest';setAnim(a,seat==='tower'?'Rest':'Lounge');onDiscover?.(seat);toast(seat==='rocker'?'摇椅轻轻晃动 · E 或方向键跳下':seat==='bed'?'在软软的猫窝休息 · E 或方向键起身':'爬到最高处啦 · E 或方向键下来');}}}
  }
  if(state==='rest'){
   const t=targets[seat];a.root.position.copy(v(t.steps?.at(-1)??t.seat));a.root.rotation.set(0,t.yaw,0);
   if(seat==='rocker'){a.root.position.sub(rocker.position).applyAxisAngle(v([1,0,0]),rockAngle).add(rocker.position);a.root.rotation.x=rockAngle;}
   setAnim(a,seat==='tower'?'Rest':'Lounge');
  }
  for(const [n,line]of strings.children.entries()){
   const attr=line.geometry.attributes.position,amplitude=pluckTime<1?.022*Math.exp(-pluckTime*4):0;
   for(let j=0;j<=20;j++)attr.setX(j,pin[0]+(n-1.5)*.018+Math.sin(j/20*Math.PI)*Math.sin(pluckTime*(55+n*7))*amplitude);
   attr.needsUpdate=true;
  }
 }
 function reset(){if(state)restore();rockAngle=0;rocker.rotation.x=0;pluckTime=99;notes=0;update(0);}
 return {attach,candidates,update,exit,reset,get locked(){return state!==null;}};
}
