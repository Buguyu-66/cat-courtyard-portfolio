// This small entry can recover even when the main module or WebGL fails to start.
const retry=document.querySelector('#retryLoad'),message=document.querySelector('#loadText'),button=document.querySelector('#enterGarden');
retry.onclick=()=>location.reload();
const slow=setTimeout(()=>{message.textContent='连接比平时慢一些，可以重试。';retry.hidden=false;},15000);
window.addEventListener('studio:loading',()=>clearTimeout(slow),{once:true});
async function start(){
 if(typeof DecompressionStream==='undefined')return import('./app.bundle.js?v=__APP_REVISION__');
 const controller=new AbortController(),deadline=setTimeout(()=>controller.abort(),120000);let url;
 try{
  const response=await fetch('./app.bundle.js.gz?v=__APP_REVISION__',{signal:controller.signal});
  if(!response.ok)throw new Error('Startup: HTTP '+response.status);
  const data=new Uint8Array(await response.arrayBuffer());
  const stream=new Blob([data]).stream(),body=data[0]===31&&data[1]===139?stream.pipeThrough(new DecompressionStream('gzip')):stream;
  const script=await new Response(body).text();
  url=URL.createObjectURL(new Blob([script],{type:'text/javascript'}));
  await import(url);
 }finally{clearTimeout(deadline);if(url)URL.revokeObjectURL(url);}
}
start().catch(error=>{
 clearTimeout(slow);console.error(error);document.querySelector('#loading').classList.add('welcome-failed');
 message.textContent='小院启动未完成，请重新加载。';button.disabled=false;button.textContent='重新加载小院';button.onclick=()=>location.reload();retry.hidden=false;
});
