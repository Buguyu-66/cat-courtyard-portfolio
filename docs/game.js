import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

const $=s=>document.querySelector(s), world=$('#world');
const categories=[
 {id:'product',name:'产品项目',en:'PRODUCT THINKING',desc:'从问题出发，记录思考、判断与解决问题的过程。',items:['产品项目 01','产品项目 02'],icon:'M5 3h13v18H5z M8 7h7 M8 11h7 M8 15h4'},
 {id:'art',name:'AI 插画',en:'AI & ILLUSTRATION',desc:'角色的想象，色彩的实验，以及 AI 参与的创作。',items:['IP 设计系列','大促插画系列'],icon:'M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h3a5 5 0 0 0-4-10z M7 8h1 M11 6h1 M6 13h1'},
 {id:'garden',name:'园林设计',en:'LANDSCAPE & SPACE',desc:'在自然与生活之间，寻找空间的秩序与诗意。',items:['园林项目 01','园林项目 02','园林项目 03'],icon:'M12 21V10 M12 14C3 15 3 6 3 6s9 0 9 8 M12 10C12 3 21 3 21 3s0 9-9 9'},
 {id:'other',name:'其他作品',en:'BEYOND THE EVERYDAY',desc:'节气里的光影，日常中的观察，还有尚未归类的灵感。',items:['节气系列','个人摄影'],icon:'M3 7h5l2-3h4l2 3h5v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0'},
 {id:'about',name:'关于我',en:'A LITTLE ABOUT ME',desc:'这里将放置个人照片、自我介绍与经历。',icon:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 22v-3a8 8 0 0 1 16 0v3'},
 {id:'contact',name:'联系我',en:'LET’S KEEP IN TOUCH',desc:'很高兴在小院里遇见你。',icon:'M3 5h18v15H3z M3 6l9 7 9-7'}
];
let paused=false, currentPanel=null;
const keys={};
function clearKeys(){for(const k in keys)keys[k]=false;}
function openPanel(id){const c=categories.find(c=>c.id===id);if(!c)return;paused=true;currentPanel=id;clearKeys();$('#panel').hidden=false;$('#panelTitle').textContent=c.name;$('#panelIndex').textContent=c.en;$('#sectionNo').textContent=String(categories.indexOf(c)+1).padStart(2,'0');$('#panelDescription').textContent=c.desc;
 $('#panelContent').innerHTML=c.items?'<div class="project-list">'+c.items.map((n,i)=>`<article class="project-row"><span class="idx">0${i+1}</span><div><h3>${n}</h3><p>作品内容待你提供后填入</p></div><span class="status">待填充</span></article>`).join('')+'</div>':id==='about'?'<div class="profile-placeholder"><div class="portrait-placeholder">个人照片 · 待提供</div><div><p>姓名与个人介绍，待填充。</p><p>教育 / 经历 / 简历<br>保留位置，等待你的真实资料。</p></div></div>':'<div class="empty-space">邮箱与其他联系方式 · 待提供</div>';
 if(c.items&&id==='product')$('#panelContent').innerHTML='<div class="case-list">'+c.items.map((n,i)=>`<details class="case-card"><summary><span class="idx">0${i+1}</span><h3>${n}</h3><span>待提供 ＋</span></summary><div class="case-sections">${['项目背景与问题','目标与个人职责','方案与关键决策','结果与复盘'].map(s=>`<section><h4>${s}</h4><p>待提供</p></section>`).join('')}</div></details>`).join('')+'</div>';
 if(c.items&&id!=='product')$('#panelContent').innerHTML='<div class="gallery-grid">'+c.items.map((n,i)=>`<article class="gallery-card"><div class="gallery-placeholder"><span>0${i+1}</span><p>作品图片 · 待提供</p></div><h3>${n}</h3><p>作品介绍 · 待提供</p></article>`).join('')+'</div>';
 document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.id===id));$('#panel').scrollTop=0;$('#closePanel').focus();}
function closePanel(){paused=false;$('#panel').hidden=true;document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));currentPanel=null;world.querySelector('canvas')?.focus();}
$('nav').innerHTML=categories.map((c,i)=>`<button data-id="${c.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${c.icon}"/></svg>${c.name}<span class="num">0${i+1}</span></button>`).join('');
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>openPanel(b.dataset.id));$('#closePanel').onclick=closePanel;$('.brand').onclick=e=>{e.preventDefault();closePanel();};
$('#helpBtn').onclick=()=>{clearKeys();paused=true;$('#help').showModal();};function closeHelp(){ $('#help').close();paused=!$('#panel').hidden;}$('#closeHelp').onclick=closeHelp;$('#start').onclick=closeHelp;$('#help').addEventListener('cancel',()=>{paused=!$('#panel').hidden;});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'&&!$('#panel').hidden)closePanel();if(!paused)keys[e.key.toLowerCase()]=true;});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',clearKeys);document.addEventListener('visibilitychange',clearKeys);
document.querySelectorAll('#joystick button').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.key]=false;});
let toastTimer;function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
let audio=false,ac;$('#sound').onclick=()=>{audio=!audio;$('#sound').textContent='声音 '+(audio?'开':'关');$('#sound').setAttribute('aria-label',audio?'关闭声音':'开启声音');if(audio){ac??=new(window.AudioContext||window.webkitAudioContext)();ac.resume();tone(440,.08);}};
function tone(freq,d=.1){if(!audio||!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(freq,ac.currentTime);g.gain.setValueAtTime(.035,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d);}


async function boot(){
const scene=new T.Scene();scene.background=new T.Color('#a9b97c');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;world.append(renderer.domElement);renderer.domElement.tabIndex=0;
scene.add(new T.HemisphereLight(0xfff7e8,0x7c967c,1.8));const sun=new T.DirectionalLight(0xfff4dd,2.3);sun.position.set(-12,24,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:65});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;scene.add(sun);
const camera=new T.OrthographicCamera(-12,12,8,-8,.1,150),offset=new T.Vector3(8,25,30),cameraFocus=new T.Vector3(0,.6,1.1),raycaster=new T.Raycaster(),pointer=new T.Vector2();let zoom=1,zoomGoal=1,cameraSpan=10.5;
const palette={white:'#f4f0df',black:'#343e39',red:'#b75e4d',wood:'#a98255',water:'#84aaa0'};
const mats={};function mat(c){return mats[c]??=new T.MeshStandardMaterial({color:c,roughness:1,metalness:0,flatShading:true});}
function mesh(geo,c,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,c,x,y,z,p=scene){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);}
function ball(r,c,x,y,z,p=scene,sx=1,sy=1,sz=1){const m=mesh(new T.SphereGeometry(r,10,7),c,x,y,z,p);m.scale.set(sx,sy,sz);return m;}
function cyl(rt,rb,h,c,x,y,z,p=scene,n=10){return mesh(new T.CylinderGeometry(rt,rb,h,n),c,x,y,z,p);}
function group(x=0,y=0,z=0,p=scene){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
function beam(a,b,r,c,p=scene){const v=new T.Vector3(...a),w=new T.Vector3(...b),mid=v.clone().add(w).multiplyScalar(.5),m=cyl(r,r,v.distanceTo(w),c,mid.x,mid.y,mid.z,p,6);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),w.sub(v).normalize());return m;}

const loader=new GLTFLoader();let loaded=0;
async function load(name){const data=window.COURTYARD_MODELS?.[name];const gltf=data?await loader.parseAsync(Uint8Array.from(atob(data),c=>c.charCodeAt(0)).buffer,''):await loader.loadAsync('./models/'+name+'.glb');loaded++;$('#loading p').textContent='小院准备中 · '+loaded+' / 4';gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return gltf;}
const [map,catFile,ownerFile,gardenFile]=await Promise.all(['scene','cat','owner','gardener'].map(load));scene.add(map.scene);
function named(n){const o=map.scene.getObjectByName(n);if(!o)throw new Error('Missing scene object: '+n);return o;}
const house=named('house'),worktable=named('worktable'),art=named('art'),gardenModel=named('gardenModel'),appleTree=named('appleTree'),photo=named('photo'),cameraTable=photo,aboutBoard=named('aboutBoard'),mailbox=named('mailbox'),dock=named('dock'),gatePivot=named('gatePivot');
let gateOpen=false,gateAngle=0;const gateHit=box(4.8,1.9,.35,palette.wood,0,1,10);gateHit.visible=false;
const pencil=box(.65,.045,.045,'#c99b44',.55,1.2,.4,worktable);const duck=group(4.6,.17,5.1);ball(.16,'#ddba58',0,.06,0,duck,1.3,.7,1);ball(.1,'#ddba58',0,.2,.11,duck);box(.12,.05,.09,'#bc7f42',0,.18,.23,duck);
const cat=group(0,0,13);cat.add(catFile.scene);const catBody=new T.Group(),head=new T.Group(),tail=new T.Group(),legs=Array.from({length:4},()=>new T.Group());
function animator(root,file){const mixer=new T.AnimationMixer(root),actions={};for(const clip of file.animations){const name=['Idle','Walk','Paw','Rest','Pickup'].find(n=>clip.name.includes(n));if(name)actions[name]=mixer.clipAction(clip);}let active='';return {update(name,dt){if(!actions[name])name='Idle';if(name!==active){actions[active]?.fadeOut(.15);actions[name]?.reset().fadeIn(.15).play();active=name;}mixer.update(dt);},clips:Object.keys(actions)};}
const catAnim=animator(cat,catFile);
function person(file,x,z){const g=group(x,0,z);g.add(file.scene);return {g,feet:[],task:null,routine:0,wait:2,time:0,state:'',walking:false,anim:animator(g,file)};}
const owner=person(ownerFile,-.6,-4.4),gardener=person(gardenFile,8,2.2);
const obstacles=[{x:-2,z:-8.6,w:15.5,d:5},{x:-4.3,z:-3.7,w:2.7,d:1.5},{x:-8,z:2,w:1.3,d:1},{x:8,z:2.9,w:1.8,d:1.3},{x:4.7,z:5,w:4.5,d:3.3},{x:8,z:-3.3,w:2.9,d:1.5},{x:8,z:-.5,w:2.9,d:1.5},{x:-8,z:-2.3,w:.7,d:.7},{x:2.3,z:-4.8,w:2.3,d:1.3},{x:10.2,z:7,w:1.5,d:1.2}];
obstacles.push({x:3.9,z:-4.7,w:.8,d:.8},{x:2,z:-3.6,w:.8,d:.8},{x:-7.4,z:3.1,w:.7,d:.7},{x:7,z:-4.7,w:1,d:1});
obstacles.push({x:9.3,z:5.2,w:1.2,d:1.3},{x:5.7,z:-4.5,w:1,d:.75});
const routinesOwner=[[-.6,-4.3],[3,-3],[6.5,-4.1],[1.8,-3.6]].map(([x,z])=>({x,z})),routinesGarden=[[9.9,-2],[10,1],[7.7,2],[8,7.4]].map(([x,z])=>({x,z}));
const npcLabels=[];function makeNPCLabel(npc){const el=document.createElement('div');el.className='maplabel';el.style.pointerEvents='none';el.style.fontSize='10px';el.style.padding='6px 9px';el.hidden=true;$('#labels').append(el);npcLabels.push({npc,el});}makeNPCLabel(owner);makeNPCLabel(gardener);
let apple=null,pencilDown=false,catHidden=false,actionTime=0,actionType='',actionTotal=0,stepTime=0,rippleTime=0,treeShake=0,walked=false;
const playBall=group(-.9,.25,8);ball(.25,'#d6ae6f',0,0,0,playBall);const band=mesh(new T.TorusGeometry(.25,.015,4,14),'#f3ecdb',0,0,0,playBall);band.rotation.y=Math.PI/2;const ballVelocity=new T.Vector2();
function task(npc,type,target,home){if(npc.task)return false;npc.task={type,target:{...target},home:{...home},stage:'wait',timer:2.2};npc.state=type==='apple'?'咦，苹果怎么跑到这里了？':'又是你这只小猫…';return true;}
function perform(type,duration=.6){actionType=type;actionTime=duration;actionTotal=duration;tone(520,.08);}
const interactables=[];let nearest=null;
function interactable(id,title,x,z,obj,fn,options={}){const entry={id,title,x,z,obj,fn,radius:options.radius??2.5,label:options.label??false,height:options.height??1.4};interactables.push(entry);obj.userData.interaction=id;if(entry.label){const el=document.createElement('button');el.className='maplabel';el.textContent=title;el.onclick=()=>activate(entry);$('#labels').append(el);entry.el=el;}return entry;}
const gateEntry=interactable('gate','推门进入',0,11,gatePivot,()=>{if(gateOpen){toast('门开着，继续逛吧。');return;}gateOpen=true;perform('paw',.7);tone(220,.18);toast('吱呀——欢迎来到小院。');},{radius:3.2});gateHit.userData.interaction='gate';
interactable('product','产品项目',-4.3,-2.2,worktable,()=>openPanel('product'),{label:true,height:1.8,radius:2.8});
interactable('art','AI 插画',-8,3.1,art,()=>openPanel('art'),{label:true,height:2.3});
interactable('garden','园林设计',8,4.1,gardenModel,()=>openPanel('garden'),{label:true,height:1.6});
interactable('other','其他作品',6.5,-3.8,photo,()=>openPanel('other'),{label:true,height:2.8,radius:2.8});cameraTable.userData.interaction='other';
interactable('about','关于我',-3.6,11.2,aboutBoard,()=>openPanel('about'),{label:true,height:2.15,radius:3});
interactable('contact','联系我',3.65,11,mailbox,()=>openPanel('contact'),{label:true,height:2.6,radius:3});
interactable('ball','拍一下球',playBall.position.x,playBall.position.z,playBall,()=>{const dir=new T.Vector2(playBall.position.x-cat.position.x,playBall.position.z-cat.position.z);if(dir.length()<.1)dir.set(1,-1);dir.normalize().multiplyScalar(3.8);ballVelocity.copy(dir);perform('paw');toast('再拍一下，就再追一小段。');},{radius:2});
interactable('tree','抓抓苹果树',-8,-2.3,appleTree,()=>{if(apple){toast('先看看掉下来的苹果吧。');return;}treeShake=1;perform('paw',.8);apple=ball(.19,palette.red,-7.2,2.9,-1.5);toast('咚！园艺师好像听见了。');task(gardener,'apple',{x:-7.2,z:-.9},{x:8,z:2});});
interactable('pencil','把铅笔扒拉下去',-2.8,-3.3,pencil,()=>{if(pencilDown){toast('主人正准备来捡铅笔。');return;}pencilDown=true;perform('paw');scene.attach(pencil);pencil.position.set(-2.4,.1,-2.8);toast('啪嗒。主人转过头来了。');task(owner,'pencil',{x:-1.8,z:-2.4},{x:-2.6,z:-3.3});},{radius:2});
interactable('pond','拨拨水，看小鸭漂走',4.8,2.5,dock,()=>{rippleTime=2.5;perform('paw',.8);toast('小黄鸭晃晃悠悠地漂远了。');});
const restObj=box(1,.05,.7,'#9aab7d',-4.5,.07,2.5);interactable('rest','在树荫里打个盹',-4.5,2.5,restObj,()=>{perform('sleep',8);toast('今天的工作：晒太阳。移动即可起身。');},{radius:2.5});
function activate(e){if(paused)return;if(Math.hypot(cat.position.x-e.x,cat.position.z-e.z)>e.radius){toast('再靠近一点，就可以'+e.title+'。');return;}e.fn();}
$('#context').onclick=()=>nearest&&activate(nearest);
const clickableRoots=[gateHit,...interactables.map(i=>i.obj),cameraTable];
function hit(e){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(clickableRoots,true);for(const h of hits){let o=h.object;while(o&&!o.userData.interaction)o=o.parent;if(o)return interactables.find(i=>i.id===o.userData.interaction);}return null;}
renderer.domElement.addEventListener('click',e=>{const target=hit(e);if(target)activate(target);});renderer.domElement.addEventListener('pointermove',e=>{renderer.domElement.style.cursor=hit(e)?'pointer':'default';});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
function zoomBy(v){zoomGoal=T.MathUtils.clamp(zoomGoal+v,.9,1.25);$('#zoomValue').textContent=Math.round(zoomGoal*100)+'%';}
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();if(!paused)zoomBy(-Math.sign(e.deltaY)*.04);},{passive:false});$('#zoomIn').onclick=()=>zoomBy(.05);$('#zoomOut').onclick=()=>zoomBy(-.05);
function resetPosition(){catHidden=false;cat.visible=true;cat.position.set(0,0,13);cat.rotation.y=Math.PI;walked=false;cameraSpan=10.5;cameraFocus.set(0,.6,1.1);zoomGoal=1;$('#zoomValue').textContent='100%';clearKeys();toast('回到门口。院子里的故事还在继续。');}
$('#home').onclick=resetPosition;
function collides(x,z){if(z>10.3){if(Math.abs(x)>2.65||z>15.4)return true;}else if(Math.abs(x)>11.45||z< -10.4)return true;if(!gateOpen&&Math.abs(z-10)<.5&&Math.abs(x)<2.5)return true;if(Math.abs(z-10)<.5&&Math.abs(x)>2.1)return true;for(const o of obstacles)if(Math.abs(x-o.x)<o.w/2+.22&&Math.abs(z-o.z)<o.d/2+.22)return true;return false;}
// Route NPCs over a small grid so people never walk through the house or pond.
function pathfind(start,end){const key=(x,z)=>x+','+z;const sx=Math.round(start.x),sz=Math.round(start.z),ex=Math.round(end.x),ez=Math.round(end.z),q=[[sx,sz]],seen=new Map([[key(sx,sz),null]]);let last=null;for(let i=0;i<q.length&&i<1800;i++){const [x,z]=q[i];if(Math.hypot(x-ex,z-ez)<1.5){last=[x,z];break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,k=key(nx,nz);if(seen.has(k)||nx< -11||nx>11||nz< -5||nz>9||collides(nx,nz))continue;seen.set(k,[x,z]);q.push([nx,nz]);}}if(!last)return [];const path=[];while(last&&!(last[0]===sx&&last[1]===sz)){path.unshift({x:last[0],z:last[1]});last=seen.get(key(...last));}return path;}
function moveNPC(n,point,dt){if(!n.route||n.destination!==point){n.route=pathfind(n.g.position,point);n.destination=point;}const p=n.route[0];if(!p)return true;const dx=p.x-n.g.position.x,dz=p.z-n.g.position.z,d=Math.hypot(dx,dz);if(d<.12){n.route.shift();return n.route.length===0;}n.walking=true;n.g.position.x+=dx/d*Math.min(d,dt*1.45);n.g.position.z+=dz/d*Math.min(d,dt*1.45);n.g.rotation.y=Math.atan2(dx,dz);n.time+=dt*6;n.feet.forEach((f,i)=>f.rotation.x=Math.sin(n.time+i*Math.PI)*.35);return false;}
function updateNPC(n,routine,dt){n.walking=false;n.feet.forEach(f=>f.rotation.x*=.88);if(n.task){const t=n.task;t.timer-=dt;if(t.stage==='wait'){if(t.timer<0){t.stage='go';n.route=null;n.state=t.type==='apple'?'又掉了一颗，我来捡。':'铅笔怎么在地上？';}}else if(t.stage==='go'){if(moveNPC(n,t.target,dt)){t.stage='pickup';t.timer=1.2;n.state='弯腰收拾一下…';}}else if(t.stage==='pickup'){n.g.rotation.x=Math.sin(Math.max(0,t.timer)/1.2*Math.PI)*.45;if(t.timer<0){n.g.rotation.x=0;if(t.type==='apple'&&apple){scene.remove(apple);apple.geometry.dispose();apple=null;}if(t.type==='pencil'){worktable.attach(pencil);pencil.position.set(.55,1.2,.4);pencilDown=false;}t.stage='return';n.route=null;n.state='放好了。别再闹啦。';}}else if(t.stage==='return'&&moveNPC(n,t.home,dt)){n.task=null;n.state='';n.wait=4;n.route=null;}return;}
 n.wait-=dt;if(n.wait>0)return;const goal=routine[n.routine%routine.length];if(moveNPC(n,goal,dt)){n.wait=3+Math.random()*3;n.routine++;n.route=null;n.state=n===owner?'整理一下，再喝口茶。':'花草也需要照顾。';}}
const ripple=new T.Mesh(new T.RingGeometry(.4,.44,28),new T.MeshBasicMaterial({color:0xe4e9d4,transparent:true,opacity:.6,side:T.DoubleSide}));ripple.rotation.x=-Math.PI/2;ripple.position.set(4.8,.12,4);ripple.visible=false;scene.add(ripple);
function resize(){renderer.setSize(innerWidth,innerHeight);const aspect=innerWidth/innerHeight;const h=cameraSpan;camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;const sidebar=$('#sidebar').getBoundingClientRect().width;camera.setViewOffset(innerWidth,innerHeight,-sidebar/2,0,innerWidth,innerHeight);camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
let lastTime=performance.now(),elapsed=0,lastNearest='';
function updateLabels(){for(const e of interactables){if(!e.el)continue;const d=Math.hypot(e.x-cat.position.x,e.z-cat.position.z);e.el.hidden=paused||(walked&&d>e.radius+1.2);const p=new T.Vector3(e.x,e.height,e.z).project(camera);e.el.style.left=(p.x*.5+.5)*innerWidth+'px';e.el.style.top=(-p.y*.5+.5)*innerHeight+'px';e.el.classList.toggle('near',d<e.radius);if(p.z>1||p.x<-.95||p.x>.95||p.y<-.95||p.y>.95)e.el.hidden=true;}
 for(const {npc,el}of npcLabels){el.hidden=paused||!npc.task;el.textContent=npc.state;const p=npc.g.position.clone().add(new T.Vector3(0,2.4,0)).project(camera);el.style.left=(p.x*.5+.5)*innerWidth+'px';el.style.top=(-p.y*.5+.5)*innerHeight+'px';}}
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
 if(!paused){elapsed+=dt;let mx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),my=(keys.w||keys.arrowup?1:0)-(keys.s||keys.arrowdown?1:0);const moving=!!(mx||my);cat.walking=moving;if(moving){walked=true;if(catHidden){catHidden=false;cat.visible=true;}if(actionType==='sleep')actionTime=0;const vec=new T.Vector3(mx*offset.z-my*offset.x,0,-mx*offset.x-my*offset.z).normalize();const speed=2.8;const nx=cat.position.x+vec.x*dt*speed,nz=cat.position.z+vec.z*dt*speed;if(!collides(nx,cat.position.z))cat.position.x=nx;if(!collides(cat.position.x,nz))cat.position.z=nz;const goal=Math.atan2(vec.x,vec.z);let diff=T.MathUtils.euclideanModulo(goal-cat.rotation.y+Math.PI,Math.PI*2)-Math.PI;cat.rotation.y+=diff*Math.min(1,dt*14);stepTime+=dt*11;legs.forEach((l,i)=>l.rotation.x=Math.sin(stepTime+(i===0||i===3?0:Math.PI))*.45);catBody.position.y=Math.abs(Math.sin(stepTime))* .025;}else{legs.forEach(l=>l.rotation.x*=.8);catBody.position.y=Math.sin(elapsed*2)*.008;}
 tail.rotation.z=Math.sin(elapsed*2.5)*.13;head.rotation.y=moving?0:Math.sin(elapsed*.7)*.1;
 if(actionTime>0){actionTime-=dt;const progress=1-actionTime/actionTotal;if(actionType==='paw')legs[2].rotation.x=-Math.sin(progress*Math.PI)*1.5;if(actionType==='sleep'){catBody.scale.y=.5;head.rotation.z=.2;}else catBody.scale.y=1;}else{catBody.scale.y=1;head.rotation.z=0;}
 if(catHidden){cat.visible=false;}else cat.visible=true;
 gateAngle=T.MathUtils.damp(gateAngle,gateOpen?-1.5:0,4,dt);gatePivot.rotation.y=gateAngle;
 if(treeShake>0){treeShake-=dt;appleTree.rotation.z=Math.sin(elapsed*24)*.03*treeShake;}else appleTree.rotation.z=0;
 if(apple)apple.position.y=Math.max(.2,apple.position.y-dt*3);
 if(ballVelocity.length()>.02){const nx=playBall.position.x+ballVelocity.x*dt,nz=playBall.position.z+ballVelocity.y*dt;if(Math.abs(nx)>4||nz<3||nz>9.2){ballVelocity.multiplyScalar(-.6);}else{playBall.position.x=nx;playBall.position.z=nz;playBall.rotation.x+=ballVelocity.y*dt*3;playBall.rotation.z-=ballVelocity.x*dt*3;}ballVelocity.multiplyScalar(Math.exp(-dt*1.6));}
 const be=interactables.find(e=>e.id==='ball');be.x=playBall.position.x;be.z=playBall.position.z;
 if(rippleTime>0){rippleTime-=dt;ripple.visible=true;ripple.scale.setScalar(1+(2.5-rippleTime)*1.2);ripple.material.opacity=rippleTime/4;duck.position.z=5.1+Math.sin((2.5-rippleTime)*.8)*.7;duck.rotation.z=Math.sin(elapsed*7)*.06;}else ripple.visible=false;
 updateNPC(owner,routinesOwner,dt);updateNPC(gardener,routinesGarden,dt);
 nearest=null;let min=Infinity;for(const e of interactables){if(e.id==='gate'&&gateOpen)continue;const dist=Math.hypot(cat.position.x-e.x,cat.position.z-e.z);if(dist<e.radius&&dist<min){nearest=e;min=dist;}}
 const nid=nearest?.id??'';if(nid!==lastNearest){lastNearest=nid;$('#context').innerHTML=nearest?`<button>${nearest.title}<small>左键互动</small></button>`:'';}
 $('#location').textContent=cat.position.z>10?'院门外 · 推门来坐坐':nearest?.label?'小院 · '+nearest.title:cat.position.z< -2?'屋前 · 日常与创作':cat.position.x>3?'水边 · 慢一点也没关系':'草坪 · 今天也适合捣蛋';
 const target=walked?cat.position.clone():new T.Vector3(0,.6,1.1);target.x=T.MathUtils.clamp(target.x,-7.5,8);target.z=T.MathUtils.clamp(target.z,-5,12);cameraFocus.lerp(target,1-Math.exp(-dt*(walked?1.8:4)));}
 if(!paused){catAnim.update(actionTime>0?(actionType==='paw'?'Paw':actionType==='sleep'?'Rest':'Idle'):cat.walking?'Walk':'Idle',dt);for(const n of [owner,gardener])n.anim.update(n.task?.stage==='pickup'?'Pickup':n.walking?'Walk':'Idle',dt);}
 cameraSpan=T.MathUtils.damp(cameraSpan,walked?6.7:10.5,1.8,dt);const aspect=innerWidth/innerHeight;camera.left=-cameraSpan*aspect;camera.right=cameraSpan*aspect;camera.top=cameraSpan;camera.bottom=-cameraSpan;
 zoom=T.MathUtils.damp(zoom,zoomGoal,6,dt);camera.zoom=zoom;camera.updateProjectionMatrix();camera.position.copy(cameraFocus).add(offset);camera.lookAt(cameraFocus);updateLabels();renderer.render(scene,camera);}
cat.rotation.y=Math.PI;camera.position.copy(cameraFocus).add(offset);camera.lookAt(cameraFocus);$('#loading').remove();toast('欢迎来到小院。WASD 移动后，镜头会跟随小猫。');requestAnimationFrame(tick);
// Read-only state plus bounded controls for browser verification and future editing.
window.courtyard={getState:()=>({cat:{x:cat.position.x,z:cat.position.z},gateOpen,zoom:zoomGoal,viewMode:walked?'follow':'overview',cameraSpan,cameraFocus:{x:cameraFocus.x,z:cameraFocus.z},panel:currentPanel,ownerTask:owner.task?.type??null,gardenerTask:gardener.task?.type??null,nearest:nearest?.id??null,animations:{cat:catAnim.clips,owner:owner.anim.clips,gardener:gardener.anim.clips},drawCalls:renderer.info.render.calls}),openPanel,closePanel};
}
boot().catch(error=>{console.error(error);$('#loading').innerHTML='<p>小院暂时未能加载</p><p>'+String(error.message).replace(/[<>]/g,'')+'</p><button onclick=location.reload()>重新加载</button>';});
