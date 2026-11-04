export function createWelcome({onEnter=()=>{}}={}){
 const overlay=document.querySelector('#loading'),button=document.querySelector('#enterGarden'),message=document.querySelector('#loadText');
 let entered=false,timer;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function dismiss(){if(entered)return;entered=true;clearTimeout(timer);overlay.classList.add('welcome-leaving');setTimeout(()=>{overlay.hidden=true;},reduced?0:460);onEnter();}
 button.onclick=dismiss;
 return{
  dismiss,
  ready(){if(entered)return;overlay.classList.add('welcome-ready');button.disabled=false;button.textContent='开始捣蛋 →';message.textContent='小院准备好了。铅笔……大概也没事。';timer=setTimeout(dismiss,reduced?800:Math.max(1000,3500-performance.now()));},
  failed(){clearTimeout(timer);overlay.classList.add('welcome-failed');message.textContent='小院暂时没准备好，可以先从左侧导航看作品。';button.disabled=false;button.textContent='收起开场 →';},
 };
}
