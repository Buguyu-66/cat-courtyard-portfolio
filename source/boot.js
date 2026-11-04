// This small entry can recover even when the main module or WebGL fails to start.
const retry=document.querySelector('#retryLoad'),message=document.querySelector('#loadText'),button=document.querySelector('#enterGarden');
retry.onclick=()=>location.reload();
const slow=setTimeout(()=>{message.textContent='连接比平时慢一些，可以重试。';retry.hidden=false;},15000);
window.addEventListener('studio:loading',()=>clearTimeout(slow),{once:true});
import('__APP_BUNDLE_URL__').catch(error=>{
 clearTimeout(slow);console.error(error);document.querySelector('#loading').classList.add('welcome-failed');
 message.textContent='小院启动未完成，请重新加载。';button.disabled=false;button.textContent='重新加载小院';button.onclick=()=>location.reload();retry.hidden=false;
});
