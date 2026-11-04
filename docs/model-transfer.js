// Lossless transport compression; editable GLBs remain the source of truth.
export function createModelTransfer(manifest,{onProgress=()=>{},fetcher=fetch,idleMs=60000,totalMs=300000,compressed=typeof DecompressionStream!=='undefined'}={}){
 const critical=['scene.glb','cozy-props.glb','cat.glb'],received=new Map(),pending=new Map();
 const size=file=>manifest[file][compressed?'packedBytes':'bytes'];
 const total=critical.reduce((sum,file)=>sum+size(file),0);
 function progress(file,n){received.set(file,Math.min(n,size(file)));const done=critical.reduce((sum,f)=>sum+(received.get(f)??0),0);onProgress(Math.min(95,Math.floor(done/total*95)));}
 async function download(file){
  const item=manifest[file];if(!item)throw new Error('Unknown model: '+file);
  const controller=new AbortController();let idle;
  const touch=()=>{clearTimeout(idle);idle=setTimeout(()=>controller.abort(),idleMs);};
  const deadline=setTimeout(()=>controller.abort(),totalMs);touch();progress(file,0);
  try{
   const response=await fetcher(`${item.path}${compressed?'.gz':''}?v=${item.version}`,{signal:controller.signal});
   if(!response.ok)throw new Error(`${file}: HTTP ${response.status}`);
   const chunks=[];let length=0;
   if(response.body){const reader=response.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;touch();chunks.push(value);length+=value.byteLength;progress(file,length);}}
   else{const chunk=new Uint8Array(await response.arrayBuffer());chunks.push(chunk);length=chunk.byteLength;}
   clearTimeout(idle);const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   let result=bytes.buffer;
   if(compressed&&bytes[0]===0x1f&&bytes[1]===0x8b)result=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   const magic=new Uint8Array(result,0,Math.min(4,result.byteLength));
   if(result.byteLength!==item.bytes||String.fromCharCode(...magic)!=='glTF')throw new Error(file+': incomplete or invalid model');
   progress(file,size(file));return result;
  }catch(error){if(controller.signal.aborted)throw new Error(file+': download timed out');throw error;}
  finally{clearTimeout(idle);clearTimeout(deadline);}
 }
 return{load(file){if(!pending.has(file)){const task=download(file).finally(()=>pending.delete(file));pending.set(file,task);}return pending.get(file);}};
}
