import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createMischief} from './mischief.js';
import {createCollision} from './collision.js';
import {findPath} from './navigation.js';
import {placeMarkers} from './marker-layout.js';
import {createDayNight} from './day-night.js';
const layout=await fetch('layout.json').then(r=>{if(!r.ok)throw new Error('Layout unavailable');return r.json();});
const $=s=>document.querySelector(s), stage=$('#stage'),canvas=$('#world');
const content=$('#content'), body=$('#pageBody'), keys=new Set();
const pageInfo={projects:['产品项目','PRODUCT THINKING','从问题出发，让想法成为可以使用的体验。',['产品项目 01','产品项目 02']],illustration:['AI 插画','IMAGINATION & EXPERIMENTS','关于角色、色彩与画面叙事的探索。',['IP 设计系列','大促插画系列']],landscape:['园林设计','LANDSCAPE & SPACE','让自然、空间与人的日常相遇。',['园林项目 01','园林项目 02','园林项目 03']],other:['其他作品','OTHER OBSERVATIONS','记录季节，也记录日常里值得停留的瞬间。',['节气系列','个人摄影']],about:['关于我','A LITTLE ABOUT ME','个人照片、介绍、经历与简历将陆续补充。'],contact:['联系我','SAY HELLO','欢迎交流想法、作品与合作机会。']};
let paused=false,page=null,detail=null,ready=false,soundOn=false,ctx=null,elapsed=0,toastUntil=0,actionUntil=0,actionKind='',lastMeow=-10,travel=null,cluesVisible=true;
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');toastUntil=elapsed+3.2;}
function showPage(id){travel=null;page=id;detail=null;paused=true;keys.clear();content.hidden=false;document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));renderPage();$('#back').focus();}
function closePage(){content.hidden=true;page=null;paused=false;keys.clear();document.querySelectorAll('[data-page]').forEach(b=>b.classList.remove('active'));canvas.focus();}
function renderPage(){const [title,en,desc,items]=pageInfo[page];
 body.innerHTML=`<div class="page-intro"><span class="eyebrow">${en}</span><h2>${detail??title}</h2><p>${desc}</p></div>`;
 if(detail){body.insertAdjacentHTML('afterbegin',`<button class="detail-back">← 返回${title}</button>`);body.querySelector('.detail-back').onclick=()=>{detail=null;renderPage();};
  const sections=page==='projects'?['项目背景','问题与目标','我的职责','设计方案','关键决策','结果与复盘']:['作品图片','创作说明'];
  body.insertAdjacentHTML('beforeend',sections.map(t=>`<div class="detail-section"><h3>${t}</h3><p>待提供</p></div>`).join(''));
 }else if(items){const list=document.createElement('div');list.className='work-list';items.forEach(t=>{const b=document.createElement('button');b.className='work-card';b.innerHTML=`<div class="placeholder-art">作品待提供</div><div class="work-caption"><div><h3>${t}</h3><small>图片与内容待提供</small></div><span>↗</span></div>`;b.onclick=()=>{detail=t;renderPage();content.scrollTop=0;};list.append(b);});body.append(list);
 }else if(page==='about'){body.insertAdjacentHTML('beforeend','<div class="empty-portrait">个人照片待提供</div>'+['姓名 / 昵称','个人介绍','经历','简历'].map(t=>`<div class="detail-section"><h3>${t}</h3><p>待提供</p></div>`).join(''));
 }else{body.insertAdjacentHTML('beforeend','<div class="contact-line">邮箱<span>待提供</span></div><div class="contact-line">平台链接<span>待提供</span></div>');}
}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));$('#back').onclick=closePage;$('.brand').onclick=e=>{e.preventDefault();closePage();resetCamera();};
function toggleHelp(){$('#help').hidden=!$('#help').hidden;$('#mischiefPanel').hidden=true;}
$('#guide').onclick=toggleHelp;$('#helpToggle').onclick=toggleHelp;$('#help .help-close').onclick=toggleHelp;
$('#sound').onclick=()=>{soundOn=!soundOn;if(soundOn&&!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();ctx?.resume();$('#sound').textContent=soundOn?'声音开':'声音关';$('#sound').setAttribute('aria-label',soundOn?'关闭声音':'开启声音');};
function tone(type,note=0){if(!soundOn||!ctx)return;if(type==='pluck'){const frequency=[196,293.66,440,659.25][note%4],count=Math.round(ctx.sampleRate/frequency),buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*1.1),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<count;i++)data[i]=(Math.random()*2-1)*.17;for(let i=count;i<data.length;i++)data[i]=(data[i-count]+data[i-count+1])*.492;const source=ctx.createBufferSource();source.buffer=buffer;source.connect(ctx.destination);source.start();return;}const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;osc.connect(gain);gain.connect(ctx.destination);osc.type=type==='water'?'sine':'triangle';const f=type==='meow'?640:type==='water'?380:900;osc.frequency.setValueAtTime(f,t);osc.frequency.exponentialRampToValueAtTime(type==='meow'?360:140,t+.27);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(type==='water'?.025:.055,t+.04);gain.gain.exponentialRampToValueAtTime(.0001,t+.35);osc.start(t);osc.stop(t+.36);}
const scene=new THREE.Scene();scene.background=new THREE.Color('#8da492');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.OrthographicCamera(-10,10,8,-8,.1,100);const hemisphere=new THREE.HemisphereLight('#fff5db','#71866b',1.7);scene.add(hemisphere);
const sun=new THREE.DirectionalLight('#fff1ce',2.6);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:40});sun.shadow.bias=-.0005;sun.shadow.normalBias=.035;scene.add(sun);const ambient=new THREE.AmbientLight('#d8e1ce',.3);scene.add(ambient);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#7e9a84',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.43;floor.receiveShadow=true;scene.add(floor);
const lighting=createDayNight({scene,renderer,hemisphere,sun,ambient,floor});
$('#dayNight').onclick=()=>{const night=!lighting.night;lighting.setNight(night);document.body.dataset.time=night?'night':'day';$('#dayNight').setAttribute('aria-pressed',String(night));$('#dayNight').setAttribute('aria-label',night?'切换到白天':'切换到夜晚');$('#dayNight').textContent=night?'☀ 白天':'☾ 夜晚';toast(night?'夜幕降临，工作室的灯亮起来了':'阳光回来了，继续逛逛小院');};

let theta=.62,desiredTheta=.62,zoom=1,desiredZoom=1;const target=new THREE.Vector3(...layout.camera.target),baseTarget=target.clone();let height=15,markerSizeEpoch=0;
function resize(){let w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);height=Math.max(layout.camera.minHeight,layout.camera.minWidth/(w/h));camera.left=-height*w/h/2;camera.right=height*w/h/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();markerSizeEpoch++;}
new ResizeObserver(resize).observe(stage);resize();
function resetCamera(){desiredTheta=.62;desiredZoom=1;toast('回到工作室全景');}
$('#reset').onclick=resetCamera;
$('#rotateLeft').onclick=()=>desiredTheta=Math.max(.62-Math.PI/3,desiredTheta-.3);
$('#rotateRight').onclick=()=>desiredTheta=Math.min(.62+Math.PI/3,desiredTheta+.3);
let dragging=false,lastX=0;
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{canvas.focus();if(e.button===2){dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(dragging&&!paused){desiredTheta=THREE.MathUtils.clamp(desiredTheta-(e.clientX-lastX)*.006,.62-Math.PI/3,.62+Math.PI/3);lastX=e.clientX;}});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('wheel',e=>{if(paused)return;e.preventDefault();desiredZoom=THREE.MathUtils.clamp(desiredZoom*Math.exp(-e.deltaY*.001),.9,2.25);},{passive:false});
window.addEventListener('keydown',e=>{if(e.code==='Escape'){travel=null;if(!content.hidden)closePage();else{$('#help').hidden=true;$('#mischiefPanel').hidden=true;if(ready)mischief.exitBox();}return;}if(paused||!ready)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyE','KeyG'].includes(e.code)){e.preventDefault();keys.add(e.code);if(!e.repeat&&e.code==='KeyE')interact();if(!e.repeat&&e.code==='Space')meow();if(!e.repeat&&e.code==='KeyG')mischief.dropLeaf();}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();dragging=false;});
const loader=new GLTFLoader();let loadedCount=0;
async function load(file){const gltf=await loader.loadAsync('models/'+file);loadedCount++;$('#progress').style.width=`${loadedCount/7*100}%`;return gltf;}
const occluders=[];
function optimizeStatic(root){root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh)return;if(/^Swing_(seat|rope)/i.test(o.name)){mischief.attachSwingMesh(o);return;}const fade=/Rear_wall|Window_wall|Walnut_bookcase|Built_in|Connected_wall|Wall_decor/.test(o.name)||/Walnut_bookcase/.test(o.parent?.name);const side=/Window|wall_left/.test(o.name)?'left':'rear';const m=o.material;const glow=/Lantern_warm_pane/.test(o.name)?'lantern':/Ivory_lamp_shade/.test(o.name)?'shade':'';const key=m.uuid+(fade?side:'')+glow;let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(o.matrixWorld);for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));g.clearGroups();if(!groups.has(key))groups.set(key,{m:m.clone(),geos:[],fade,side,glow});groups.get(key).geos.push(g);});
 for(const {m,geos,fade,side,glow}of groups.values()){lighting.registerMaterial(m,glow);const g=mergeGeometries(geos,false);const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;if(fade){m.transparent=true;occluders.push({mesh,side});}scene.add(mesh);geos.forEach(g=>g.dispose());}}
const actors=[];let player,tabby,orange,longhair;
async function cat(file,name,pos,scale){const g=await load(file);const root=g.scene;root.position.set(...pos);root.scale.setScalar(scale);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});scene.add(root);const mixer=new THREE.AnimationMixer(root),actions={};g.animations.forEach(c=>{const key=['Idle','Walk','Paw','Rest','Lounge'].find(n=>c.name.includes(n));if(key)actions[key]=mixer.clipAction(c);});const a={name,root,mixer,actions,state:null,home:root.position.clone(),reactUntil:0,path:[],repathAt:0};setAnim(a,'Idle');actors.push(a);return a;}
function setAnim(a,n){if(a.state===n)return;const old=a.actions[a.state],next=a.actions[n]??a.actions.Idle;old?.fadeOut(.2);next?.reset().fadeIn(.2).play();a.state=n;}
const {obstacles,blocked}=createCollision(layout);
const mischief=createMischief({scene,layout,actors:()=>({player,tabby,orange,longhair}),blocked,obstacles,toast,tone,setAnim,isNight:()=>lighting.night,onReact:()=>{if(longhair){longhair.reactUntil=elapsed+3;longhair.root.rotation.y=Math.atan2(player.root.position.x-longhair.root.position.x,player.root.position.z-longhair.root.position.z);setAnim(longhair,'Paw');}},onAction:target=>{player.root.rotation.y=Math.atan2(target.x-player.root.position.x,target.z-player.root.position.z);act('Paw');},onCarry:carrying=>$('#carryLeaf').hidden=!carrying,onDiscover:id=>{const item=document.querySelector(`[data-discovery="${id}"]`);if(item){item.classList.add('discovered');item.querySelector('small').textContent='已经发现';}}});
$('#carryLeaf').onclick=()=>{if(!paused)mischief.dropLeaf();};
$('#mischiefToggle').onclick=()=>{$('#mischiefPanel').hidden=!$('#mischiefPanel').hidden;$('#help').hidden=true;};
$('#mischiefClose').onclick=()=>$('#mischiefPanel').hidden=true;
$('#resetMischief').onclick=()=>{if(!ready||paused)return;travel=null;mischief.reset();actionUntil=0;ball.position.set(...layout.ball);ballVelocity.set(0,0);ballLast=-10;pencilTime=-1;pencil.position.set(...layout.pencil.home);pencil.rotation.set(0,0,Math.PI/2);for(const a of [tabby,orange,longhair]){a.reactUntil=0;a.target=null;a.repathAt=0;}toast('落叶、纸箱、秋千和小物件都收拾好了，可以再玩一次');};
function move(a,dx,dz){let p=a.root.position;const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.07));for(let i=0;i<n;i++){if(!blocked(p.x+dx/n,p.z))p.x+=dx/n;if(!blocked(p.x,p.z+dz/n))p.z+=dz/n;}if(Math.abs(dx)+Math.abs(dz)>.001){const goal=Math.atan2(dx,dz);a.root.rotation.y+=Math.atan2(Math.sin(goal-a.root.rotation.y),Math.cos(goal-a.root.rotation.y))*.18;}}
function pathTo(start,end){return findPath(start,end,blocked).map(p=>new THREE.Vector3(p.x,.12,p.z));}
const ball=new THREE.Mesh(new THREE.SphereGeometry(.12,24,16),new THREE.MeshStandardMaterial({color:'#c88d65',roughness:.85}));ball.position.set(...layout.ball);ball.castShadow=true;scene.add(ball);const ballVelocity=new THREE.Vector2();let ballLast=-10,tabbyNudged=false;
const pencil=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.46,8),new THREE.MeshStandardMaterial({color:'#bc8950'}));pencil.rotation.z=Math.PI/2;pencil.position.set(...layout.pencil.home);scene.add(pencil);let pencilTime=-1;
const rippleGroup=new THREE.Group();scene.add(rippleGroup);const ripples=[];
function ripple(){for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.17,.195,48),new THREE.MeshBasicMaterial({color:'#d8eece',transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(layout.pond.ripple[0],.144,layout.pond.ripple[1]);rippleGroup.add(m);ripples.push({mesh:m,start:elapsed+i*.25});}}
const hotspots=layout.portfolio.map(({id,label,pin,access,offset})=>{const b=document.createElement('button');b.className='hotspot';b.textContent=label;b.onclick=()=>{if(player&&distance(player.root.position,access)<1.4)showPage(id);else toast('靠近这件物品查看，或直接使用左侧导航');};$('#hotspots').append(b);return{id,label,pos:new THREE.Vector3(...pin),access,offset,el:b};});
function distance(p,arr){return Math.hypot(p.x-arr[0],p.z-arr[1]);}
let nearest=null;
function candidates(){if(!player)return[];if(mischief.locked)return mischief.candidates();const p=player.root.position,list=[...mischief.candidates(),...hotspots.map(h=>({label:'查看'+h.label,d:distance(p,h.access),range:1.2,run:()=>showPage(h.id)}))];list.push({id:'ball',icon:'●',pin:ball.position.clone().add(new THREE.Vector3(0,.28,0)),access:[ball.position.x,ball.position.z],label:'拍一拍小球',d:p.distanceTo(ball.position),range:1.25,run:()=>{const v=new THREE.Vector2(ball.position.x-p.x,ball.position.z-p.z).normalize();ballVelocity.copy(v).multiplyScalar(2.5);ballLast=elapsed;tabbyNudged=false;act('Paw');tone('tap');toast('球滚起来了，狸花猫也想一起玩');}});list.push({id:'pencil',icon:'✎',pin:pencil.position.clone().add(new THREE.Vector3(0,.25,0)),access:layout.pencil.access,label:pencilTime<0?'扒拉桌边的铅笔':'看看地上的铅笔',d:distance(p,layout.pencil.access),range:.9,run:()=>{if(pencilTime>=0){toast('等一会儿，铅笔会回到桌边');return;}pencilTime=elapsed;act('Paw','pencil');tone('tap');tabby.reactUntil=elapsed+7;tabby.target=new THREE.Vector3(layout.pencil.access[0],.12,layout.pencil.access[1]);toast('啪嗒！狸花猫听见了');}});list.push({id:'pond',icon:'≈',pin:new THREE.Vector3(layout.pond.ripple[0],.32,layout.pond.ripple[1]),access:layout.pond.interaction,label:'在池塘边拨水',d:distance(p,layout.pond.interaction),range:1.05,run:()=>{act('Paw');ripple();tone('water');tabby.reactUntil=elapsed+6;tabby.target=new THREE.Vector3(layout.pond.interaction[0],.12,layout.pond.interaction[1]-.4);toast('水面泛起涟漪，小猫好奇地望过来');}});
 for(const a of [orange,tabby,longhair])if(a)list.push({id:'cat-'+a.name,icon:'♡',pin:a.root.position.clone().add(new THREE.Vector3(0,.85,0)),access:a===orange?[-2.4,-1.65]:a===longhair?layout.swing.access:[a.root.position.x,a.root.position.z],label:'和'+a.name+'打招呼',d:p.distanceTo(a.root.position),range:1.65,run:()=>{act('Paw');respond(a);}});return list;}
function act(n,kind=''){travel=null;actionUntil=elapsed+1.1;actionKind=kind;setAnim(player,n);}
function respond(a){a.reactUntil=elapsed+3;setAnim(a,'Paw');a.root.rotation.y=Math.atan2(player.root.position.x-a.root.position.x,player.root.position.z-a.root.position.z);tone('meow');toast(a===orange?'橘白猫伸了个懒腰，抬头看你':a===longhair?'秋千上的猫轻轻回了一声喵':'狸花猫靠过来，想和你玩');if(a===tabby)a.target=player.root.position.clone();}
function interact(){if(paused||!ready||elapsed<actionUntil)return;if(nearest){travel=null;nearest.run();}else toast('再靠近一点，看看有什么可以互动');}
$('#interact').onclick=interact;
function meow(){if(elapsed-lastMeow<1.4)return;lastMeow=elapsed;if(mischief.hiddenMeow())return;if(mischief.locked)return;act('Paw');tone('meow');const nearby=[orange,tabby,longhair].filter(a=>a&&a.root.position.distanceTo(player.root.position)<3.5);if(nearby.length)nearby.forEach(respond);else toast('喵——工作室里响起了你的声音');}
// Gold pins identify playful actions separately from portfolio entries.
const playMarkers=new Map(),markerOffsets=new Map();let hoveredMarker=null;
const markerLines=document.createElementNS('http://www.w3.org/2000/svg','svg');markerLines.id='markerLines';markerLines.setAttribute('aria-hidden','true');stage.insertBefore(markerLines,$('#hotspots'));
const markerHint=document.createElement('div');markerHint.id='markerHint';markerHint.hidden=true;stage.append(markerHint);
const markerLineNodes=new Map();
function hoverMarker(id){hoveredMarker=id;}

$('#clues').onclick=()=>{cluesVisible=!cluesVisible;$('#clues').setAttribute('aria-pressed',String(cluesVisible));$('#clues').textContent=cluesVisible?'互动提示开':'互动提示关';};
function approach(id){
 if(!ready||paused||elapsed<actionUntil)return;
 const c=candidates().find(c=>c.id===id);if(!c)return;
 travel=null;
 if(c.d<c.range&&(!c.access||distance(player.root.position,c.access)<.3)){c.run();return;}
 if(mischief.locked||!c.access)return;
 travel={id,path:[],repath:0,started:elapsed};
 toast('奶牛猫正走向这里，方向键可取消');canvas.focus();
}
function walkToInteraction(dt){
 const c=candidates().find(c=>c.id===travel.id);
 if(!c||elapsed-travel.started>18){travel=null;toast('换个位置再试试');return false;}
 if(c.d<c.range&&distance(player.root.position,c.access)<.3){travel=null;player.root.rotation.y=Math.atan2(c.pin.x-player.root.position.x,c.pin.z-player.root.position.z);c.run();return false;}
 if(elapsed>=travel.repath){travel.path=pathTo(player.root.position,new THREE.Vector3(c.access[0],.12,c.access[1]));travel.repath=elapsed+.75;}
 while(travel.path.length&&distance(player.root.position,[travel.path[0].x,travel.path[0].z])<.08)travel.path.shift();
 if(!travel.path.length){travel=null;toast('这里暂时走不过去，试着换个方向靠近');return false;}
 const p=travel.path[0],dx=p.x-player.root.position.x,dz=p.z-player.root.position.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*1.7);
 move(player,dx/len*step,dz/len*step);return true;
}
function updateSceneMarkers(){
 const width=stage.clientWidth,height=stage.clientHeight,items=[],elements=new Map();
 const anchor=pos=>{const p=pos.clone().project(camera);return p.z<1&&p.z>-1?{x:(p.x*.5+.5)*width,y:(-p.y*.5+.5)*height}:{x:-1,y:-1};};
 for(const h of hotspots){
  const near=player&&distance(player.root.position,h.access)<1.4;
  h.el.classList.toggle('near',near);h.el.classList.toggle('far',!near);h.el.setAttribute('aria-disabled',String(!near));
  if(h.sizeEpoch!==markerSizeEpoch){h.el.hidden=false;h.size=[Math.ceil(h.el.offsetWidth||84),Math.ceil(h.el.offsetHeight||36)];h.sizeEpoch=markerSizeEpoch;}
  const id='work-'+h.id;elements.set(id,h.el);items.push({id,kind:'work',anchor:anchor(h.pos),w:h.size[0],h:h.size[1],priority:100,offset:h.offset,previous:markerOffsets.get(id)});
 }
 const actions=candidates().filter(c=>c.id&&c.pin),active=new Set();
 for(const c of actions){
  active.add(c.id);let b=playMarkers.get(c.id);
  if(!b){b=document.createElement('button');b.className='play-marker';b.innerHTML='<i></i><span></span>';b.onclick=()=>approach(c.id);b.onpointerenter=()=>hoverMarker(c.id);b.onpointerleave=()=>{if(hoveredMarker===c.id)hoverMarker(null);};b.onfocus=()=>hoverMarker(c.id);b.onblur=b.onpointerleave;$('#playMarkers').append(b);playMarkers.set(c.id,b);}
  if(b.getAttribute('aria-label')!==c.label){b.querySelector('i').textContent=c.icon;b.querySelector('span').textContent=c.label;b.setAttribute('aria-label',c.label);}
  b.classList.toggle('near',c.d<c.range);b.classList.toggle('walking',travel?.id===c.id);b.hidden=!cluesVisible||!ready;
  const id='play-'+c.id;elements.set(id,b);
  if(cluesVisible)items.push({id,kind:'play',anchor:anchor(c.pin),w:22,h:22,priority:travel?.id===c.id?80:c.d<c.range?60:30,previous:markerOffsets.get(id)});
 }
 for(const[id,b]of playMarkers)if(!active.has(id))b.hidden=true;
 const placements=placeMarkers(items,{width,height});
 for(const[id,b]of elements){const r=placements.get(id);b.hidden=!ready||!r;if(r){b.style.left=r.x+'px';b.style.top=r.y+'px';markerOffsets.set(id,r.offset);}}
 for(const line of markerLineNodes.values())line.setAttribute('visibility','hidden');
 for(const item of items){const r=placements.get(item.id);if(!r||!ready)continue;let line=markerLineNodes.get(item.id);
  if(!line){line=document.createElementNS(markerLines.namespaceURI,'line');line.setAttribute('class',item.kind);markerLines.append(line);markerLineNodes.set(item.id,line);}
  line.setAttribute('visibility','visible');line.setAttribute('x1',r.anchor.x);line.setAttribute('y1',r.anchor.y);line.setAttribute('x2',Math.max(r.x+4,Math.min(r.x+r.w-4,r.anchor.x)));line.setAttribute('y2',Math.max(r.y+4,Math.min(r.y+r.h-4,r.anchor.y)));
 }
 markerLines.style.display=ready?'':'none';
 const hint=actions.find(c=>c.id===hoveredMarker);markerHint.hidden=!hint||!cluesVisible||$('#toast').classList.contains('show');if(hint)markerHint.textContent=hint.label+' · 点击让小猫走近';
}

function update(dt){if(paused){hotspots.forEach(h=>h.el.hidden=true);playMarkers.forEach(b=>b.hidden=true);markerLines.style.display='none';markerHint.hidden=true;return;}elapsed+=dt;if(toastUntil<elapsed)$('#toast').classList.remove('show');theta=THREE.MathUtils.damp(theta,desiredTheta,7,dt);zoom=THREE.MathUtils.damp(zoom,desiredZoom,7,dt);camera.zoom=zoom;
 const follow=ready&&zoom>1.45?Math.min(.8,(zoom-1.45)*.8):0;const want=baseTarget.clone();if(player){want.x=baseTarget.x+(player.root.position.x-baseTarget.x)*follow;want.z=baseTarget.z+(player.root.position.z-baseTarget.z)*follow;want.y=baseTarget.y+(player.root.position.y+1-baseTarget.y)*follow;}
 target.lerp(want,1-Math.exp(-dt*2));camera.position.set(target.x+Math.sin(theta)*22,target.y+17,target.z+Math.cos(theta)*22);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 for(const {mesh,side}of occluders){mesh.material.opacity=side==='left'?(theta<.04?.18:1):(Math.cos(theta)<.13?.18:1);mesh.material.depthWrite=mesh.material.opacity>.9;mesh.castShadow=mesh.material.opacity>.9;}

 if(!ready||paused)return;
 let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),right=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);let moving=forward!==0||right!==0;
 if(moving)travel=null;
 if(!mischief.locked){if(elapsed<actionUntil){moving=false;player.root.position.y=.12+(actionKind==='pencil'?Math.sin(Math.PI*(1-(actionUntil-elapsed)/1.1))*.6:0);}else{player.root.position.y=.12;if(travel){moving=walkToInteraction(dt);}else{const l=Math.hypot(forward,right)||1;move(player,(right*Math.cos(theta)-forward*Math.sin(theta))/l*dt*1.7,(-right*Math.sin(theta)-forward*Math.cos(theta))/l*dt*1.7);}if(elapsed>=actionUntil&&!mischief.locked)setAnim(player,moving?'Walk':'Idle');}}
 if(ballVelocity.length()>.015){const dx=ballVelocity.x*dt,dz=ballVelocity.y*dt;if(blocked(ball.position.x+dx,ball.position.z,.13))ballVelocity.x*=-.65;else ball.position.x+=dx;if(blocked(ball.position.x,ball.position.z+dz,.13))ballVelocity.y*=-.65;else ball.position.z+=dz;ball.rotation.z-=dx/.12;ball.rotation.x+=dz/.12;ballVelocity.multiplyScalar(Math.exp(-dt*1.1));}
 if(pencilTime>=0){const t=elapsed-pencilTime;if(t<.8){pencil.position.y=layout.pencil.home[1]-(layout.pencil.home[1]-layout.pencil.landing[1])*Math.min(1,(t/.8)**2);pencil.position.z=layout.pencil.home[2]+Math.min(1,t/.8)*(layout.pencil.landing[2]-layout.pencil.home[2]);pencil.rotation.y=t*3;}if(t>9){pencilTime=-1;pencil.position.set(...layout.pencil.home);pencil.rotation.set(0,0,Math.PI/2);}}
 for(let i=ripples.length-1;i>=0;i--){const r=ripples[i],t=elapsed-r.start;if(t<0){r.mesh.visible=false;continue;}r.mesh.visible=true;r.mesh.scale.setScalar(1+t*1.8);r.mesh.material.opacity=Math.max(0,.6-t*.3);if(t>2){rippleGroup.remove(r.mesh);r.mesh.geometry.dispose();r.mesh.material.dispose();ripples.splice(i,1);}}
 if(tabby){let destination=mischief.tabbyTarget()??tabby.home;if(elapsed-ballLast<8)destination=ball.position;else if(tabby.reactUntil>elapsed&&tabby.target)destination=tabby.target;
  if(elapsed>tabby.repathAt){tabby.path=pathTo(tabby.root.position,destination);tabby.repathAt=elapsed+.7;}
  const d=tabby.root.position.distanceTo(destination);if(d>.55&&tabby.path.length){const p=tabby.path[0],dx=p.x-tabby.root.position.x,dz=p.z-tabby.root.position.z,len=Math.hypot(dx,dz);if(len<.1)tabby.path.shift();else move(tabby,dx/len*dt*.85,dz/len*dt*.85);setAnim(tabby,'Walk');}else if(elapsed-ballLast<8&&!tabbyNudged){setAnim(tabby,'Paw');ballVelocity.set(-.8,.6);tabbyNudged=true;}else setAnim(tabby,tabby.reactUntil>elapsed?'Paw':'Idle');}
 for(const a of [orange,longhair])if(a){if(a.reactUntil<elapsed)setAnim(a,'Rest');else setAnim(a,'Paw');}
 mischief.update(dt,moving);
 for(const a of actors)a.mixer.update(dt);
 updateSceneMarkers();
 nearest=candidates().filter(c=>c.d<c.range).sort((a,b)=>a.d-b.d)[0]??null;$('#interact').hidden=!nearest;if(nearest)$('#interact span').textContent=nearest.label;$('#catStatus').textContent=travel?'正在走近互动物件 · 方向键可取消':nearest?nearest.label:'点击金色标记，让小猫走近捣蛋';
}
let previous=performance.now();function frame(t){const dt=Math.min(.05,(t-previous)/1000);previous=t;lighting.update(dt);update(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
try{const [g,surround,cozy]=await Promise.all([load('scene.glb'),load('surroundings.glb'),load('cozy-props.glb')]);optimizeStatic(g.scene);optimizeStatic(surround.scene);mischief.attachCozyProps(cozy.scene);[player,orange,tabby,longhair]=await Promise.all([cat('cat.glb','奶牛猫',layout.playerSpawn,.76),cat('orange-cat.glb','橘白猫',layout.sofa.orangeCat,.62),cat('tabby-cat.glb','狸花猫',[-1.3,.12,.65],.65),cat('longhair-cat.glb','长毛猫',layout.swing.cat,.65)]);player.root.rotation.y=Math.PI;orange.root.rotation.y=Math.PI/2;longhair.root.rotation.y=.1;ready=true;$('#loading').style.opacity=0;setTimeout(()=>$('#loading').hidden=true,650);if(innerWidth<540)toast('手机端可直接使用顶部导航浏览作品');else toast('点击金色标记开始互动 · WASD 移动 · 滚轮缩放');}
catch(e){console.error(e);$('#loadText').textContent='场景加载未完成，请刷新页面重试。作品导航仍可使用。';$('#loading').style.pointerEvents='none';}
