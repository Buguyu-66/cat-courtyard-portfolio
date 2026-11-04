import * as THREE from './vendor/three.module.js';
import {createCozyInteractions} from './cozy-interactions.js';

// Small, independently controlled props; time advances only with the garden.
export function createMischief({scene,layout={},actors,blocked,obstacles,toast,tone,setAnim,onAction,onCarry,onDiscover,onReact,isNight}) {
 const boxCenter=new THREE.Vector3(...(layout.box?.center??[-4.95,.12,-.55])),boxAccess=layout.box?.access??[-4.15,-.55], swingOrigin=new THREE.Vector3(...(layout.swing?.pivot??[4.8,2.85,-2.05])),swingAccess=layout.swing?.access??[4.8,-1];
 let time=0,holding=null,boxState='outside',phase=0,entry=null,scale=null,from=null,angleAtEntry=0,shake=0,swingEnergy=0,swingTime=0,interest=null,interestUntil=0;
 const discovered=new Set(), leaves=[], swing=new THREE.Group(), cardboard=new THREE.Group();
 swing.name='Animated swing';swing.position.copy(swingOrigin);scene.add(swing);
 cardboard.name='Cat cardboard hideout';cardboard.position.copy(boxCenter);scene.add(cardboard);
 obstacles.push([boxCenter.x,boxCenter.z,.47,.46]);
 const carton=new THREE.MeshStandardMaterial({color:'#bb895a',roughness:1});
 const cutEdge=new THREE.MeshStandardMaterial({color:'#ddbd8a',roughness:1});
 function panel(w,h,d,x,y,z,material=carton){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;cardboard.add(m);return m;}
 panel(.88,.035,.86,0,.025,0);panel(.035,.55,.86,-.44,.29,0);panel(.035,.55,.86,.44,.29,0);panel(.88,.55,.035,0,.29,-.43);panel(.88,.55,.035,0,.29,.43);
 const frontFlap=panel(.88,.025,.29,0,.57,.56);frontFlap.rotation.x=-.3;
 const rearFlap=panel(.88,.025,.29,0,.57,-.56);rearFlap.rotation.x=.3;
 for(const s of [-1,1]){const m=panel(.28,.025,.86,s*.56,.57,0);m.rotation.z=s*.22;panel(.025,.012,.85,s*.44,.574,0,cutEdge);}
 panel(.13,.004,.75,0,.045,0,cutEdge);
 const ink=new THREE.MeshStandardMaterial({color:'#6f5943',roughness:1});
 const pad=panel(.11,.095,.006,.03,.25,.452,ink);pad.rotation.z=.15;
 for(const [x,y]of[[-.09,.34],[-.015,.39],[.065,.39],[.14,.34]]){const dot=new THREE.Mesh(new THREE.SphereGeometry(.032,12,8),ink);dot.scale.z=.12;dot.position.set(x,y,.455);cardboard.add(dot);}
 const leafShape=new THREE.Shape();leafShape.moveTo(0,-.19);leafShape.bezierCurveTo(-.26,-.06,-.2,.16,0,.28);leafShape.bezierCurveTo(.2,.16,.26,-.06,0,-.19);
 for(const [i,p]of (layout.leaves??[[-5.05,.17,1.95],[1.5,.17,2.0],[3.2,.17,-1.45]]).entries()){
  const leaf=new THREE.Group();leaf.name='Carryable autumn leaf '+i;const mesh=new THREE.Mesh(new THREE.ShapeGeometry(leafShape,16),new THREE.MeshStandardMaterial({color:['#c3883f','#b77743','#b3a15c'][i],side:THREE.DoubleSide,roughness:1}));leaf.add(mesh);
  const vein=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.24,.004),new THREE.Vector3(0,.19,.004)]),new THREE.LineBasicMaterial({color:'#ead29a'}));leaf.add(vein);leaf.position.set(...p);leaf.rotation.set(-Math.PI/2,0,i*1.7+.3);scene.add(leaf);leaves.push({object:leaf,home:leaf.position.clone(),rotation:leaf.rotation.clone()});
 }
 const cozy=layout.cozy?createCozyInteractions({scene,layout,actors,setAnim,tone,toast,dropLeaf,reactTo,onReact,onDiscover:discover,isNight}):null;
 function discover(id){if(discovered.has(id))return;discovered.add(id);onDiscover?.(id);}
 function distance(pos,p){return Math.hypot(pos.x-p.x,pos.z-p.z);}
 function reactTo(target,seconds=6){interest=target.clone();interestUntil=time+seconds;const tabby=actors().tabby;if(tabby){tabby.repathAt=0;tabby.reactUntil=0;}}
 function pickLeaf(leaf){if(holding||boxState!=='outside')return;holding=leaf;onCarry?.(true);tone('tap');toast('叼住了！可以带进工作室，按 G 放下');reactTo(actors().player.root.position);}
 function dropLeaf(){if(!holding)return false;const p=actors().player.root.position,yaw=actors().player.root.rotation.y;let spot=null;
  for(const r of [.4,.65,.85]){for(const offset of [0,.7,-.7,1.5,-1.5,Math.PI]){const a=yaw+offset,x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r;if(!blocked(x,z,.1)){spot=new THREE.Vector3(x,.17,z);break;}}if(spot)break;}
  spot??=holding.home.clone();const leaf=holding;holding=null;leaf.object.position.copy(spot);leaf.object.rotation.copy(leaf.rotation);leaf.object.scale.setScalar(1);onCarry?.(false);reactTo(spot);tone('tap');
  if(Math.abs(spot.x+2.45)<1.85&&Math.abs(spot.z+.2)<1.75){discover('leaf');toast('落叶搬进了工作室，狸花猫来检查你的“战利品”');}else toast('落叶放下了，狸花猫想凑过来闻一闻');return true;
 }
 function enterBox(){if(boxState!=='outside')return;const a=actors().player;if(distance(a.root.position,boxCenter)>1.25)return;dropLeaf();entry=a.root.position.clone();from=entry.clone();scale=a.root.scale.clone();angleAtEntry=a.root.rotation.y;boxState='entering';phase=0;setAnim(a,'Paw');tone('tap');toast('纸箱被你占领了！E 钻出，空格偷偷喵一声');reactTo(entry,5);discover('box');}
 function exitBox(){if(boxState!=='hidden')return false;boxState='exiting';phase=0;from=actors().player.root.position.clone();setAnim(actors().player,'Paw');return true;}
 function pushSwing(){if(swing.children.length===0)return;swingEnergy=Math.min(.16,swingEnergy+.11);swingTime=0;onAction?.(swingOrigin);const cat=actors().longhair;if(cat){cat.reactUntil=Infinity;setAnim(cat,'Paw');}tone('tap');toast('秋千轻轻晃起来，长毛猫抬爪抗议：喵！');discover('swing');}
 function attachSwingMesh(o){o.updateWorldMatrix(true,false);const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.translate(-swingOrigin.x,-swingOrigin.y,-swingOrigin.z);const copy=new THREE.Mesh(geo,o.material);copy.castShadow=true;copy.receiveShadow=true;swing.add(copy);}
 function candidates(){const a=actors().player;if(!a)return[];if(cozy?.locked)return cozy.candidates();if(boxState==='hidden')return[{id:'box',icon:'▢',pin:boxCenter.clone().add(new THREE.Vector3(0,.8,0)),label:'从纸箱里钻出来',d:0,range:1,run:exitBox}];if(boxState!=='outside')return[];const p=a.root.position,result=[...(cozy?.candidates()??[])];
  if(!holding)for(const [i,leaf] of leaves.entries())result.push({id:'leaf-'+i,icon:'❧',pin:leaf.object.position.clone().add(new THREE.Vector3(0,.18,0)),access:[leaf.object.position.x,leaf.object.position.z],label:'叼起这片落叶',d:distance(p,leaf.object.position),range:.85,run:()=>pickLeaf(leaf)});
  result.push({id:'box',icon:'▢',pin:boxCenter.clone().add(new THREE.Vector3(0,.8,0)),access:boxAccess,label:'钻进纸箱躲猫猫',d:distance(p,boxCenter),range:1.2,run:enterBox});
  if(swing.children.length)result.push({id:'swing',icon:'↝',pin:new THREE.Vector3(swingOrigin.x,1.15,swingOrigin.z+.6),access:swingAccess,label:'轻推秋千，逗逗长毛猫',d:distance(p,new THREE.Vector3(swingAccess[0],0,swingAccess[1])),range:1.05,run:pushSwing});return result;
 }
 function hiddenMeow(){if(boxState!=='hidden')return false;shake=.16;tone('meow');reactTo(entry,7);toast('纸箱里传出一声喵，狸花猫来找你了');return true;}
 function update(dt,moving){time+=dt;const a=actors().player;if(!a)return;cozy?.update(dt,moving);
  if(boxState==='hidden'&&moving)exitBox();
  if(boxState==='entering'||boxState==='exiting'){phase=Math.min(1,phase+dt/1.05);const ease=phase*phase*(3-2*phase),entering=boxState==='entering',to=entering?boxCenter:entry;a.root.position.lerpVectors(from,to,ease);a.root.position.y=.12+Math.sin(phase*Math.PI)*.83;a.root.scale.copy(scale).multiplyScalar(entering?1-.3*ease:.7+.3*ease);a.root.rotation.y=entering?angleAtEntry*(1-ease)+.62*ease:.62*(1-ease)+angleAtEntry*ease;if(phase===1){boxState=entering?'hidden':'outside';a.root.position.copy(to);a.root.scale.copy(scale).multiplyScalar(entering?.7:1);setAnim(a,entering?'Rest':'Idle');if(!entering)toast('从纸箱里探出头，继续捣蛋');}}
  else if(boxState==='hidden'){a.root.position.copy(boxCenter);a.root.scale.copy(scale).multiplyScalar(.7);setAnim(a,'Rest');}
  shake*=Math.exp(-dt*3.5);cardboard.rotation.z=Math.sin(time*24)*shake;frontFlap.rotation.x=-.3+Math.sin(time*23)*shake*1.5;rearFlap.rotation.x=.3-Math.sin(time*23)*shake;
  if(holding){a.root.updateMatrixWorld(true);holding.object.position.copy(a.root.localToWorld(new THREE.Vector3(0,.53,.57)));holding.object.rotation.set(.3,a.root.rotation.y,Math.sin(time*8)*.08);holding.object.scale.setScalar(.75);}
  swingTime+=dt;swingEnergy*=Math.exp(-dt*.45);if(swingEnergy<.001)swingEnergy=0;const angle=Math.sin(swingTime*3.3)*swingEnergy;swing.rotation.x=angle;const cat=actors().longhair;
  if(cat){cat.root.position.copy(cat.home).sub(swingOrigin).applyAxisAngle(new THREE.Vector3(1,0,0),angle).add(swingOrigin);cat.root.rotation.x=angle;if(swingEnergy===0&&cat.reactUntil===Infinity)cat.reactUntil=0;}
 }
 function tabbyTarget(){const a=actors();if(boxState==='hidden')return entry;if(holding&&a.tabby&&distance(a.player.root.position,a.tabby.root.position)<3.8)return a.player.root.position;if(time<interestUntil)return interest;return null;}
 function reset(){const a=actors();if(a.player&&boxState!=='outside'){a.player.root.position.copy(entry);a.player.root.scale.copy(scale);a.player.root.rotation.y=angleAtEntry;setAnim(a.player,'Idle');}boxState='outside';holding=null;phase=0;interest=null;interestUntil=0;onCarry?.(false);leaves.forEach(l=>{l.object.position.copy(l.home);l.object.rotation.copy(l.rotation);l.object.scale.setScalar(1);});swingEnergy=0;swing.rotation.x=0;if(a.longhair){a.longhair.root.position.copy(a.longhair.home);a.longhair.root.rotation.x=0;a.longhair.reactUntil=0;}shake=0;cardboard.rotation.z=0;}
 return {candidates,update,dropLeaf,hiddenMeow,exitBox:()=>cozy?.exit()||exitBox(),reset:()=>{cozy?.reset();reset();},attachSwingMesh,attachCozyProps:root=>cozy?.attach(root),tabbyTarget,get locked(){return boxState!=='outside'||!!cozy?.locked;}};
}
