import * as THREE from './vendor/three.module.js';
import {createCozyInteractions} from './cozy-interactions.js';
import {createBoxStory} from './box-story.js';
import {createLeafStory} from './leaf-story.js';
import {createGardenWildlife} from './garden-wildlife.js';

export function createMischief({scene,layout,actors,blocked,obstacles,toast,tone,setAnim,onAction,onCarry,onDiscover,onReact,isNight}){
 let time=0,interest=null,interestUntil=0,swingEnergy=0,swingTime=0;const discovered=new Set();
 const swingOrigin=new THREE.Vector3(...layout.swing.pivot),swing=new THREE.Group();swing.name='Animated swing';swing.position.copy(swingOrigin);scene.add(swing);
 function discover(id){if(discovered.has(id))return;discovered.add(id);onDiscover?.(id);}
 function reactTo(target,seconds=6){interest=target.clone();interestUntil=time+seconds;const tabby=actors().tabby;if(tabby){tabby.repathAt=0;tabby.reactUntil=0;}}
 const common={scene,layout,actors,blocked,setAnim,tone,toast,reactTo,onAction,onDiscover:discover};
 const leaves=createLeafStory({...common,onCarry});
 const cozy=createCozyInteractions({...common,dropLeaf:()=>leaves.drop(),onReact,isNight});
 const box=createBoxStory({...common,obstacles,dropLeaf:()=>leaves.drop()});
 const wildlife=createGardenWildlife({...common,dropLeaf:()=>leaves.drop()});
 function attachSwingMesh(o){o.updateWorldMatrix(true,false);const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.translate(-swingOrigin.x,-swingOrigin.y,-swingOrigin.z);const copy=new THREE.Mesh(geo,o.material);copy.castShadow=copy.receiveShadow=true;swing.add(copy);}
 function pushSwing(){if(!swing.children.length)return;swingEnergy=Math.min(.16,swingEnergy+.11);swingTime=0;onAction?.(swingOrigin);const cat=actors().longhair;if(cat){cat.reactUntil=Infinity;setAnim(cat,'Paw');}tone('tap');toast('秋千轻轻晃起来，长毛猫抬爪抗议：喵！');discover('swing');}
 function candidates(){const a=actors().player;if(!a)return[];for(const m of[box,cozy,wildlife])if(m.locked)return m.candidates();const list=[...cozy.candidates(),...box.candidates(),...wildlife.candidates(),...leaves.candidates()];
  if(swing.children.length)list.push({id:'swing',icon:'↝',pin:new THREE.Vector3(swingOrigin.x,1.15,swingOrigin.z+.6),access:layout.swing.access,label:'轻推秋千，逗逗长毛猫',d:Math.hypot(a.root.position.x-layout.swing.access[0],a.root.position.z-layout.swing.access[1]),range:1.05,run:pushSwing});return list;
 }
 function update(dt,moving){time+=dt;if(!actors().player)return;box.update(dt,moving);cozy.update(dt,moving);wildlife.update(dt,moving);leaves.update(dt);
  swingTime+=dt;swingEnergy*=Math.exp(-dt*.45);if(swingEnergy<.001)swingEnergy=0;const angle=Math.sin(swingTime*3.3)*swingEnergy;swing.rotation.x=angle;const cat=actors().longhair;
  if(cat){cat.root.position.copy(cat.home).sub(swingOrigin).applyAxisAngle(new THREE.Vector3(1,0,0),angle).add(swingOrigin);cat.root.rotation.x=angle;if(swingEnergy===0&&cat.reactUntil===Infinity)cat.reactUntil=0;}
 }
 function reset(){box.reset();cozy.reset();wildlife.reset();leaves.reset();interest=null;interestUntil=0;swingEnergy=0;swing.rotation.x=0;const cat=actors().longhair;if(cat){cat.root.position.copy(cat.home);cat.root.rotation.x=0;cat.reactUntil=0;}}
 return{candidates,update,reset,dropLeaf:()=>leaves.drop(),hiddenMeow:()=>box.hiddenMeow(),exitBox:()=>box.exit()||cozy.exit()||wildlife.exit(),attachSwingMesh,attachCozyProps:root=>cozy.attach(root),tabbyTarget:()=>box.target??leaves.target??(time<interestUntil?interest:null),get tabbyPlaying(){return leaves.playing;},get locked(){return box.locked||cozy.locked||wildlife.locked;}};
}
