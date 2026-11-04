import * as T from './vendor/three.module.js';

export function createBoxStory({scene,layout,actors,obstacles,setAnim,tone,toast,dropLeaf,reactTo,onDiscover}){
 const center=new T.Vector3(...layout.box.center),box=new T.Group(),flaps=[];
 box.name='Cat cardboard hideout';box.position.copy(center);scene.add(box);obstacles.push([center.x,center.z,.49,.48]);
 const carton=new T.MeshStandardMaterial({color:'#bb895a',roughness:1}),edge=new T.MeshStandardMaterial({color:'#ddbd8a',roughness:1}),ink=new T.MeshStandardMaterial({color:'#6f5943'});
 function panel(size,p,mat=carton,parent=box){const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.position.set(...p);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 panel([.88,.035,.86],[0,.025,0]);for(const s of[-1,1]){panel([.035,.55,.86],[s*.44,.29,0]);panel([.88,.55,.035],[0,.29,s*.43]);}
 for(const s of[-1,1]){
  const z=new T.Group();z.name='Box hinged end lid '+s;z.position.set(0,.584,s*.43);box.add(z);panel([.88,.024,.44],[0,0,-s*.22],carton,z);flaps.push({object:z,axis:'x',open:s*2.75});
  const x=new T.Group();x.name='Box hinged side lid '+s;x.position.set(s*.44,.568,0);box.add(x);panel([.44,.022,.86],[-s*.22,0,0],carton,x);flaps.push({object:x,axis:'z',open:-s*2.7});
 }
 panel([.13,.004,.75],[0,.045,0],edge);panel([.10,.08,.006],[0,.23,.452],ink);
 for(const[x,y]of[[-.09,.32],[-.025,.37],[.055,.37],[.13,.32]]){const d=new T.Mesh(new T.SphereGeometry(.028,10,8),ink);d.scale.z=.15;d.position.set(x,y,.455);box.add(d);}
 let state='outside',phase=0,entry=null,scale=null,rotation=null,from=null,shake=0,time=0;
 function lids(open){flaps.forEach(f=>f.object.rotation[f.axis]=f.open*open);}
 lids(1);
 function enter(){const a=actors().player;if(state!=='outside'||Math.hypot(a.root.position.x-center.x,a.root.position.z-center.z)>1.3)return;
  dropLeaf();entry=a.root.position.clone();scale=a.root.scale.clone();rotation=a.root.rotation.clone();from=entry.clone();state='enter';phase=0;setAnim(a,'Paw');tone('tap');toast('扑通！小猫钻进纸箱，盖子马上合起来');reactTo(entry,6);
 }
 function exit(){if(state==='outside'||state==='exit')return false;if(state==='enter'){reset();return true;}if(state!=='open'&&state!=='peek'){state='open';phase=0;}else if(state==='peek'){state='exit';phase=0;from=actors().player.root.position.clone();}return true;}
 function candidates(){const a=actors().player;if(!a)return[];if(state!=='outside')return[{id:'box',icon:'▢',pin:center.clone().add(new T.Vector3(0,.9,0)),label:state==='rumble'?'纸箱里咚咚响 · E 打开':'小猫正在纸箱里捣蛋 · E 出来',d:0,range:1,run:exit}];return[{id:'box',icon:'▢',pin:center.clone().add(new T.Vector3(0,.85,0)),access:layout.box.access,label:'跳进纸箱，制造一点动静',d:Math.hypot(a.root.position.x-center.x,a.root.position.z-center.z),range:1.2,run:enter}];}
 function hiddenMeow(){if(state==='outside')return false;shake=.12;tone('meow');reactTo(entry,6);return true;}
 function update(dt,moving){time+=dt;shake*=Math.exp(-dt*4);const a=actors().player;if(!a)return;
  box.position.copy(center);box.rotation.set(0,0,0);if(state==='outside')return;
  phase+=dt;
  if(moving&&['rumble','peek'].includes(state)&&phase>.4)exit();
  if(state==='enter'||state==='exit'){
   const entering=state==='enter',t=Math.min(1,phase/.85),e=t*t*(3-2*t),to=entering?center:entry;
   a.root.visible=true;a.root.position.lerpVectors(from,to,e);a.root.position.y+=Math.sin(t*Math.PI)*.83;a.root.scale.copy(scale).multiplyScalar(entering?1-.3*e:.7+.3*e);lids(1);
   if(t===1){if(entering){state='close';phase=0;a.root.position.copy(center);setAnim(a,'Lounge');}else{reset();onDiscover?.('box');toast('盖子掀开，小猫蹦出来啦！纸箱恢复原样');}}
  }else if(state==='close'){
   const t=Math.min(1,phase/.24);lids(1-t);a.root.position.copy(center);a.root.visible=t<.4;
   if(t===1){state='rumble';phase=0;tone('tap');}
  }else if(state==='rumble'){
   lids(0);a.root.visible=false;const jump=Math.abs(Math.sin(phase*Math.PI*2.1));box.position.y+=jump*.09;box.rotation.z=Math.sin(phase*19)*(.055+shake);box.rotation.x=Math.sin(phase*15)*.035;
   if(phase>2.5){state='open';phase=0;tone('tap');}
  }else if(state==='open'){
   const t=Math.min(1,phase/.4);lids(t);a.root.visible=t>.75;a.root.position.copy(center);a.root.scale.copy(scale).multiplyScalar(.7);
   if(t===1){state='peek';phase=0;setAnim(a,'Paw');tone('meow');}
  }else if(state==='peek'){
   lids(1);a.root.visible=true;a.root.position.copy(center);a.root.position.y+=Math.sin(phase*Math.PI)*.12;
   if(phase>.7){state='exit';phase=0;from=a.root.position.clone();setAnim(a,'Paw');}
  }
 }
 function reset(){const a=actors().player;if(a&&entry&&state!=='outside'){a.root.visible=true;a.root.position.copy(entry);a.root.scale.copy(scale);a.root.rotation.copy(rotation);setAnim(a,'Idle');}state='outside';phase=0;shake=0;box.position.copy(center);box.rotation.set(0,0,0);lids(1);}
 return{candidates,update,reset,exit,hiddenMeow,get locked(){return state!=='outside';},get state(){return state;},get target(){return state==='outside'?null:entry;}};
}
