import * as THREE from './vendor/three.module.js';

export function createDayNight({scene,renderer,hemisphere,sun,ambient,floor}){
 let amount=0,from=0,target=0,time=3;
 const emissive=[],lights=[];
 const colors={dayBg:new THREE.Color('#8da492'),nightBg:new THREE.Color('#172d40'),dayGround:new THREE.Color('#7e9a84'),nightGround:new THREE.Color('#354c57'),daySky:new THREE.Color('#fff5db'),nightSky:new THREE.Color('#8eaed4'),dayBounce:new THREE.Color('#71866b'),nightBounce:new THREE.Color('#34495b'),daySun:new THREE.Color('#fff1ce'),nightSun:new THREE.Color('#9dbff0')};
 function point(name,p,power,distance,color='#ffb45b'){const l=new THREE.PointLight(color,0,distance,2);l.name=name;l.position.set(...p);scene.add(l);lights.push({light:l,power});return l;}
 point('Desk lamp warm light',[-3.2,1.65,2.45],16,4.5);
 point('Wall lantern warm light',[-4.15,2.85,-3.40],26,6);
 point('Left gate lantern warm light',[2.48,1.03,3.7],9,4.1);
 point('Right gate lantern warm light',[4.55,1.03,3.7],16,4.5);
 point('Bookcase warm light',[-1.8,2.55,-3.25],20,5);
 const room=new THREE.SpotLight('#ffd49a',0,10,1.05,.8,2);room.name='Warm studio light';room.position.set(-1.8,3.3,-1.6);room.target.position.set(-1.5,.2,0);scene.add(room,room.target);lights.push({light:room,power:60});
 const desk=new THREE.SpotLight('#ffdba5',0,5,.95,.75,2);desk.name='Desk reading light';desk.position.set(-3.2,1.58,2.45);desk.target.position.set(-3.0,.15,2.7);desk.castShadow=true;desk.shadow.mapSize.set(512,512);desk.shadow.bias=-.001;desk.shadow.normalBias=.02;scene.add(desk,desk.target);lights.push({light:desk,power:12});
 point('Window reading warm light',[-4.6,1.84,-1.6],15,4.5);
 point('Right wall warm sconce',[.65,2.5,-3.5],18,5);
 point('Left wall warm sconce',[-4.1,2.6,-3.5],16,5);
 point('Studio soft warm fill',[-1.6,2.4,1.2],22,7,'#ffdda8');
 for(const [i,p]of [[7.75,.58,.55],[7.3,.58,3.4],[5.3,.58,3.68]].entries())point('Pond cool garden light '+i,p,5,3.3,'#98c9e2');
 const pond=new THREE.SpotLight('#9dd5e6',0,7,1.0,.9,2);pond.name='Cool pond wash';pond.position.set(7.55,1.7,2.5);pond.target.position.set(5.8,.1,1.7);scene.add(pond,pond.target);lights.push({light:pond,power:16});
 // Separate shelf strips remain editable objects, independent of shared wood materials.
 for(const[x,y,w]of[[-.08,2.17,3.25],[-.08,2.99,3.25],[-2.8,3.1,1.6]]){
  const mat=new THREE.MeshStandardMaterial({color:'#e6c594',emissive:'#ffb257',emissiveIntensity:0,roughness:.6});const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.018,.022),mat);mesh.name='Warm shelf strip';mesh.position.set(x,y,-3.5);scene.add(mesh);emissive.push({material:mat,day:0,night:2.5});
 }
 function registerMaterial(material,kind){if(!kind)return;material.emissive.set(kind==='cool'?'#a3d7ef':'#ffc16d');const day=kind==='lantern'?.2:0,night=kind==='lantern'?2.8:kind==='cool'?1.6:kind==='warm-added'?1.8:.8;emissive.push({material,day,night});material.emissiveIntensity=THREE.MathUtils.lerp(day,night,amount);}
 function apply(){
  scene.background.copy(colors.dayBg).lerp(colors.nightBg,amount);floor.material.color.copy(colors.dayGround).lerp(colors.nightGround,amount);
  hemisphere.color.copy(colors.daySky).lerp(colors.nightSky,amount);hemisphere.groundColor.copy(colors.dayBounce).lerp(colors.nightBounce,amount);hemisphere.intensity=THREE.MathUtils.lerp(1.7,.6,amount);
  sun.color.copy(colors.daySun).lerp(colors.nightSun,amount);sun.intensity=THREE.MathUtils.lerp(2.6,.48,amount);ambient.intensity=THREE.MathUtils.lerp(.3,.22,amount);
  renderer.toneMappingExposure=THREE.MathUtils.lerp(1.08,1.02,amount);
  for(const {light,power}of lights)light.intensity=power*amount;
  for(const {material,day,night}of emissive)material.emissiveIntensity=THREE.MathUtils.lerp(day,night,amount);
 }
 function setNight(night){from=amount;target=night?1:0;time=0;}
 function update(dt){if(time>=3)return;time=Math.min(3,time+dt);const t=time/3,e=t*t*(3-2*t);amount=THREE.MathUtils.lerp(from,target,e);apply();}
 apply();return{setNight,update,registerMaterial,get night(){return target===1;},get amount(){return amount;},lights};
}
