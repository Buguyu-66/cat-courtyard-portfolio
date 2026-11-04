import * as T from './vendor/three.module.js';

export function createGardenWildlife({scene,layout,actors,setAnim,tone,toast,onDiscover,reactTo,dropLeaf,blocked}){
 const fish=[],butterflies=[],effects=[],cfg=layout.wildlife;let time=0,state=null,phase=0,entry=null,yaw=0,caughtFrom=null,splashed=false;
 const pond=layout.pond.center,vector=p=>new T.Vector3(...p);
 function ell(parent,name,color,position,scale){const m=new T.Mesh(new T.SphereGeometry(1,20,12),new T.MeshStandardMaterial({color,roughness:.48}));m.name=name;m.position.set(...position);m.scale.set(...scale);parent.add(m);return m;}
 function fin(parent,name,points,color){const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();const m=new T.Mesh(new T.ShapeGeometry(shape,16),new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.65}));m.rotation.x=-Math.PI/2;m.name=name;parent.add(m);return m;}
 for(let i=0;i<3;i++){
  const g=new T.Group();g.name='Pond koi '+i;scene.add(g);const color=['#f3e3c5','#e9ab57','#d4ddd5'][i];
  ell(g,'Koi tapered body',color,[0,0,0],[.105,.065,.28]);ell(g,'Koi rounded head',color,[0,0,.18],[.085,.06,.12]);
  for(const s of[-1,1]){ell(g,'Koi dark eye','#282c28',[s*.071,.029,.225],[.013,.013,.013]);fin(g,'Koi side fin',[[s*.06,.04],[s*.2,-.07],[s*.08,-.13]],'#d8af79');}
  const tail=new T.Group();tail.name='Koi swishing tail';tail.position.z=-.24;g.add(tail);fin(tail,'Koi fan tail',[[0,.02],[-.14,-.19],[0,-.13],[.14,-.19]],'#d48857');
  for(const[x,z,rx,rz]of[[.018,.12,.066,.055],[-.02,-.06,.07,.09]])ell(g,'Koi colored saddle',i===2?'#665f56':'#cb6b3a',[x,.053,z],[rx,.015,rz]);
  g.scale.setScalar(i===0?1.12:.92);fish.push({object:g,tail,seed:i*2.1});
 }
 const wingShape=new T.Shape();wingShape.moveTo(0,0);wingShape.bezierCurveTo(.05,.16,.24,.17,.2,.03);wingShape.bezierCurveTo(.25,-.12,.05,-.17,0,0);
 for(let i=0;i<3;i++){
  const g=new T.Group();g.name='Garden butterfly '+i;const wings=[];scene.add(g);ell(g,'Butterfly body','#796344',[0,0,0],[.014,.014,.07]);
  for(const s of[-1,1]){const hinge=new T.Group();g.add(hinge);const mesh=new T.Mesh(new T.ShapeGeometry(wingShape,16),new T.MeshStandardMaterial({color:['#e5c778','#b9b0d5','#e6aca9'][i],side:T.DoubleSide,roughness:.8}));mesh.rotation.x=-Math.PI/2;mesh.scale.x=s;hinge.add(mesh);wings.push({hinge,s});}
  g.scale.setScalar(i===0?1:.7);butterflies.push({object:g,wings,seed:i*2.1});
 }
 function ripple(at){for(let i=0;i<3;i++){const m=new T.Mesh(new T.RingGeometry(.10,.115,40),new T.MeshBasicMaterial({color:'#cce5db',transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.copy(at);m.position.y=.15;scene.add(m);effects.push({mesh:m,age:-i*.18,kind:'ring'});}for(let i=0;i<7;i++){const m=new T.Mesh(new T.SphereGeometry(.018,8,6),new T.MeshBasicMaterial({color:'#c7e8e2'}));m.position.copy(at);scene.add(m);effects.push({mesh:m,origin:at.clone(),age:0,kind:'drop',angle:i*2.4});}}
 function swimming(f){const a=time*.27+f.seed;return new T.Vector3(pond[0]+Math.cos(a)*1.10,.115+Math.sin(a*3)*.012,pond[1]+Math.sin(a)*1.03);}
 function begin(kind){if(state)return;const a=actors().player,c=cfg[kind];if(!a||Math.hypot(a.root.position.x-c.access[0],a.root.position.z-c.access[1])>.8)return;dropLeaf();entry=a.root.position.clone();yaw=a.root.rotation.y;state=kind;phase=0;splashed=false;caughtFrom=fish[0].object.position.clone();a.root.rotation.y=kind==='fish'?0:Math.atan2(cfg.butterfly.center[0]-entry.x,cfg.butterfly.center[2]-entry.z);setAnim(a,'Idle');reactTo(entry,6);toast(kind==='fish'?'嘘……小鱼游近了，准备伸爪':'花丛里有蝴蝶，小猫蹲下来，准备扑一下');}
 function candidates(){const a=actors().player;if(!a)return[];if(state)return[{id:state,icon:state==='fish'?'≈':'✧',pin:a.root.position.clone().add(vector([0,.8,0])),label:state==='fish'?'正在捞小鱼 · E 收回爪子':'正在扑蝴蝶 · E 停下来',d:0,range:1,run:cancel}];return[
  {id:'fish',icon:'♧',label:'在池边捞一条小鱼',pin:vector(cfg.fish.water).add(vector([0,.25,0])),access:cfg.fish.access,d:Math.hypot(a.root.position.x-cfg.fish.access[0],a.root.position.z-cfg.fish.access[1]),range:.7,run:()=>begin('fish')},
  {id:'butterfly',icon:'✧',label:'蹲下来，扑一扑蝴蝶',pin:vector(cfg.butterfly.center),access:cfg.butterfly.access,d:Math.hypot(a.root.position.x-cfg.butterfly.access[0],a.root.position.z-cfg.butterfly.access[1]),range:.7,run:()=>begin('butterfly')}];}
 function cancel(){if(!state)return false;const a=actors().player;a.root.position.copy(entry);a.root.rotation.y=yaw;setAnim(a,'Idle');state=null;phase=0;fish[0].object.rotation.z=0;return true;}
 function update(dt,moving){time+=dt;const a=actors().player;
  for(const[i,f]of fish.entries()){const p=swimming(f);if(!(state==='fish'&&i===0))f.object.position.copy(p);f.object.rotation.y=-(time*.27+f.seed);f.tail.rotation.y=Math.sin(time*9+i)*.34;}
  for(const[i,b]of butterflies.entries()){const c=cfg.butterfly.center,angle=time*.8+b.seed;b.object.position.set(c[0]+Math.cos(angle)*.28,c[1]+Math.sin(angle*1.7)*.12+i*.13,c[2]+Math.sin(angle)*.22);b.object.rotation.y=-angle;b.wings.forEach(w=>w.hinge.rotation.z=w.s*Math.sin(time*15+i)*.85);}
  if(state&&a){phase+=dt;if(moving&&phase>.5){cancel();}else if(state==='fish'){
   const f=fish[0].object,water=vector(cfg.fish.water),paw=entry.clone().add(vector([.02,.48,.46]));a.root.position.copy(entry);
   if(phase<1.25){f.position.lerpVectors(caughtFrom,water,Math.min(1,phase/1.25));setAnim(a,'Idle');}
   else if(phase<2.0){const t=(phase-1.25)/.75;f.position.lerpVectors(water,paw,t);f.position.y+=Math.sin(t*Math.PI)*.20;setAnim(a,'Paw');if(!splashed){ripple(water);tone('water');splashed=true;}}
   else if(phase<2.75){f.position.copy(paw);f.position.x+=Math.sin(phase*23)*.035;f.rotation.z=Math.sin(phase*25)*.45;setAnim(a,'Paw');}
   else if(phase<3.55){const t=(phase-2.75)/.8;f.position.lerpVectors(paw,water,t);f.position.y+=Math.sin(t*Math.PI)*.35;f.rotation.z*=.85;}
   else if(phase<4.6){if(splashed){ripple(water);tone('water');splashed=false;toast('扑腾！小鱼跳回池塘，小猫甩了甩湿爪子');}f.position.lerp(swimming(fish[0]),Math.min(1,dt*3));setAnim(a,'Shake');}
   else{onDiscover?.('fish');cancel();}
  }else if(state==='butterfly'){
   const b=butterflies[0].object,t=Math.max(0,Math.min(1,(phase-.65)/1.1));a.root.position.copy(entry);
   const dx=Math.sin(a.root.rotation.y)*.25*Math.sin(t*Math.PI),dz=Math.cos(a.root.rotation.y)*.25*Math.sin(t*Math.PI);
   if(!blocked(entry.x+dx,entry.z+dz)){a.root.position.x+=dx;a.root.position.z+=dz;}a.root.position.y+=Math.sin(t*Math.PI)*.34;b.position.y+=Math.sin(Math.min(1,phase/3)*Math.PI)*.65;setAnim(a,phase<.65?'Lounge':'Paw');
   if(phase>3.3){onDiscover?.('butterfly');toast('蝴蝶飞高了一点，又落回花丛，下次再试试');cancel();}
  }}
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.age+=dt;e.mesh.visible=e.age>=0;if(e.kind==='ring'){e.mesh.scale.setScalar(1+Math.max(0,e.age)*2);e.mesh.material.opacity=Math.max(0,.65-e.age*.45);}else{const t=e.age;e.mesh.position.copy(e.origin).add(vector([Math.cos(e.angle)*t*.4,t*.8-t*t*1.8,Math.sin(e.angle)*t*.4]));}if(e.age>(e.kind==='ring'?1.6:.45)){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);}}
 }
 function reset(){cancel();for(const e of effects){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}effects.length=0;fish.forEach(f=>{f.object.rotation.z=0;f.object.position.copy(swimming(f));});}
 update(0);return{candidates,update,reset,exit:cancel,get locked(){return state!==null;},get state(){return state;}};
}
