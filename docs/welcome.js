export function createWelcome({onEnter=()=>{}}={}){
 const overlay=document.querySelector('#loading'),button=document.querySelector('#enterGarden'),message=document.querySelector('#loadText');
 let entered=false,timer,hideTimer,complete=false,failed=false;
 const retry=document.querySelector('#retryLoad'),browse=document.querySelector('#browseWhileLoading');
 const slow=setTimeout(()=>{if(!complete&&!entered){retry.hidden=false;message.textContent='还在准备小院，可以先看作品，进度会继续。';}},12000);
 retry.onclick=()=>location.reload();browse.disabled=false;browse.onclick=()=>document.querySelector('[data-page="projects"]').click();
 window.dispatchEvent(new Event('studio:loading'));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function dismiss(){if(entered)return;entered=true;clearTimeout(timer);clearTimeout(slow);overlay.classList.add('welcome-leaving');hideTimer=setTimeout(()=>{overlay.hidden=true;},reduced?0:460);onEnter();}
 button.onclick=dismiss;
 return{
  dismiss,
  resume(){if(complete)return;clearTimeout(hideTimer);entered=false;overlay.hidden=false;overlay.classList.remove('welcome-leaving');retry.hidden=false;},
  progress(percent){if(entered||complete||failed)return;document.querySelector('#progress').style.width=percent+'%';button.textContent='准备小院 · '+percent+'%';},
  ready(){complete=true;clearTimeout(slow);if(entered)return;overlay.classList.add('welcome-ready');document.querySelector('#progress').style.width='100%';button.disabled=false;button.textContent='开始捣蛋 →';message.textContent='小院准备好了。铅笔……大概也没事。';retry.hidden=true;timer=setTimeout(dismiss,reduced?800:Math.max(1000,3500-performance.now()));},
  failed(){failed=true;clearTimeout(timer);clearTimeout(slow);overlay.classList.add('welcome-failed');message.textContent='小院暂时没准备好，可以重试，或先看作品。';button.disabled=false;button.textContent='重新加载小院';button.onclick=()=>location.reload();retry.hidden=false;},
 };
}
