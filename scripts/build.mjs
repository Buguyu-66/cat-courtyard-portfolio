import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),docs=path.join(root,'docs');
const hash=data=>createHash('sha256').update(data).digest('hex').slice(0,12),manifest={};
for(const name of(await fs.readdir(path.join(docs,'models'))).filter(f=>f.endsWith('.glb'))){
 const webPath='models-web/'+name,selected=await fs.access(path.join(docs,webPath)).then(()=>webPath,()=> 'models/'+name);
 const raw=await fs.readFile(path.join(docs,selected)),packed=gzipSync(raw,{level:9});
 await fs.writeFile(path.join(docs,selected+'.gz'),packed);
 manifest[name]={path:selected,bytes:raw.length,packedBytes:packed.length,version:hash(packed)};
}
await fs.writeFile(path.join(docs,'model-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await build({entryPoints:[path.join(docs,'app.js')],outfile:path.join(docs,'app.bundle.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'inline',charset:'utf8'});
const bundle=await fs.readFile(path.join(docs,'app.bundle.js')),revision=hash(bundle);
await fs.writeFile(path.join(docs,'app.bundle.js.gz'),gzipSync(bundle,{level:9}));
const boot=(await fs.readFile(path.join(root,'source/boot.js'),'utf8')).replaceAll('__APP_REVISION__',revision);
await fs.writeFile(path.join(docs,'boot.js'),boot);
let html=await fs.readFile(path.join(docs,'index.html'),'utf8');html=html.replace(/src="boot\.js[^"]*"/,`src="boot.js?v=${hash(boot)}"`).replace(/href="welcome\.css[^"]*"/,`href="welcome.css?v=${hash(await fs.readFile(path.join(docs,'welcome.css')))}"`);await fs.writeFile(path.join(docs,'index.html'),html);
console.log(JSON.stringify({bundle:revision,models:7,originalBytes:Object.values(manifest).reduce((n,a)=>n+a.bytes,0),entryBytes:['scene.glb','cozy-props.glb','cat.glb'].reduce((n,f)=>n+manifest[f].packedBytes,0)}));
