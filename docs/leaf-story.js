import * as T from './vendor/three.module.js';

export function createLeafStory({scene,layout,actors,blocked,setAnim,tone,toast,onCarry,onDiscover,reactTo,onAction}){
 const leaves=[],shape=new T.Shape();shape.moveTo(0,-.19);shape.bezierCurveTo(-.26,-.06,-.2,.16,0,.28);shape.bezierCurveTo(.2,.16,.26,-.06,0,-.19);
 const geometry=new T.ShapeGeometry(shape,16),colors=['#c3883f','#b77743','#b3a15c'];let holding=null,round=null,time=0;
 for(const[i,p]of layout.leaves.entries()){
  const root=new T.Group();root.name='Carryable autumn leaf '+i;root.position.set(...p);scene.add(root);
  const pieces=[];for(let k=0;k<5;k++){
   const piece=new T.Group(),leaf=new T.Mesh(geometry,new T.MeshStandardMaterial({color:colors[(i+k)%3],roughness:1,side:T.DoubleSide}));piece.add(leaf);
   const vein=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-.24,.004),new T.Vector3(0,.19,.004)]),new T.LineBasicMaterial({color:'#ead29a'}));piece.add(vein);
   piece.rotation.set(-Math.PI/2,0,k*1.6+.3);piece.position.set(Math.sin(k*2.4)*.13,k*.006,Math.cos(k*2.4)*.13);piece.scale.setScalar(.65);root.add(piece);pieces.push({object:piece,p:piece.position.clone(),r:piece.rotation.clone()});
  }leaves.push({object:root,home:root.position.clone(),rotation:root.rotation.clone(),pieces});
 }
 function pick(leaf){if(holding||round)return;holding=leaf;onCarry?.(true);tone('rustle');toast('叼起一小堆落叶 · 按 G 放下，邀请狸花猫一起扑叶子');reactTo(actors().player.root.position,5);}
 function drop(){if(!holding)return false;const a=actors().player,p=a.root.position,yaw=a.root.rotation.y;let spot=null;
  for(const r of[.45,.65,.85]){for(const offset of[0,.7,-.7,1.5,-1.5,Math.PI]){const x=p.x+Math.sin(yaw+offset)*r,z=p.z+Math.cos(yaw+offset)*r;if(!blocked(x,z,.19)){spot=new T.Vector3(x,.17,z);break;}}if(spot)break;}
  spot??=holding.home.clone();const leaf=holding;holding=null;onCarry?.(false);leaf.object.position.copy(spot);leaf.object.rotation.copy(leaf.rotation);leaf.object.scale.setScalar(1);
  round={leaf,spot:spot.clone(),phase:0,state:'invite'};reactTo(spot,12);tone('rustle');toast('沙沙——狸花猫听见了，正赶来扑落叶');return true;
 }
 function candidates(){if(holding||round)return[];const a=actors().player;if(!a)return[];return leaves.map((l,i)=>({id:'leaf-'+i,icon:'❧',pin:l.object.position.clone().add(new T.Vector3(0,.22,0)),access:[l.object.position.x,l.object.position.z],label:'叼起落叶堆，找朋友一起玩',d:Math.hypot(a.root.position.x-l.object.position.x,a.root.position.z-l.object.position.z),range:.85,run:()=>pick(l)}));}
 function putHome(l){l.object.position.copy(l.home);l.object.rotation.copy(l.rotation);l.object.scale.setScalar(1);l.pieces.forEach(p=>{p.object.position.copy(p.p);p.object.rotation.copy(p.r);});}
 function update(dt){time+=dt;const a=actors();if(!a.player)return;
  if(holding){a.player.root.updateMatrixWorld(true);holding.object.position.copy(a.player.root.localToWorld(new T.Vector3(0,.48,.56)));holding.object.rotation.set(.3,a.player.root.rotation.y,Math.sin(time*8)*.08);holding.object.scale.setScalar(.7);}
  if(!round)return;const r=round;r.phase+=dt;
  if(r.state==='invite'){
   const close=a.tabby&&Math.hypot(a.tabby.root.position.x-r.spot.x,a.tabby.root.position.z-r.spot.z)<.68;
   if(close||r.phase>12){r.state='toss';r.phase=0;r.friend=close;setAnim(close?a.tabby:a.player,'Paw');if(!close)onAction?.(r.spot);tone('rustle');toast(close?'狸花猫扑了过来！落叶被拍得飞起来':'一阵风把落叶吹起来，小猫抬爪拍了拍');}
  }else if(r.state==='toss'){
   if(r.friend)setAnim(a.tabby,'Paw');const t=Math.min(1,r.phase/2.2);
   for(const[i,p]of r.leaf.pieces.entries()){const angle=i*2.4;p.object.position.copy(p.p);p.object.position.x+=Math.cos(angle)*.35*Math.sin(t*Math.PI);p.object.position.z+=Math.sin(angle)*.35*Math.sin(t*Math.PI);p.object.position.y+=Math.sin(t*Math.PI)*(.35+i*.045);p.object.rotation.z=p.r.z+t*Math.PI*2;}
   if(t===1){r.state='return';r.phase=0;toast('一起玩够了，落叶随风飘回原处，可以再来一轮');}
  }else{
   const t=Math.min(1,r.phase/1.4),e=t*t*(3-2*t);r.leaf.object.position.lerpVectors(r.spot,r.leaf.home,e);r.leaf.object.position.y+=Math.sin(t*Math.PI)*.3;
   if(t===1){putHome(r.leaf);round=null;onDiscover?.('leaf');}
  }
 }
 function reset(){holding=null;round=null;onCarry?.(false);leaves.forEach(putHome);}
 return{candidates,update,drop,reset,get playing(){return round?.state==='toss'&&!!round.friend;},get target(){return round?.state==='invite'?round.spot:holding?actors().player.root.position:null;},get busy(){return !!round||!!holding;}};
}
