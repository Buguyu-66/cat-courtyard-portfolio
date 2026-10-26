import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const directory=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs');
export const prefix='/cat-courtyard-portfolio/';
export function createServer(){return http.createServer(async(req,res)=>{
 try{
  let url=new URL(req.url,'http://localhost').pathname;
  if(url==='/'){res.writeHead(302,{Location:prefix});res.end();return;}
  if(!url.startsWith(prefix)){res.writeHead(404);res.end();return;}
  let rel=decodeURIComponent(url.slice(prefix.length))||'index.html';
  let file=path.resolve(directory,rel);
  if(!file.startsWith(directory+path.sep)){res.writeHead(403);res.end();return;}
  let data=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.glb':'model/gltf-binary'})[path.extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))createServer().listen(4195,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4195'+prefix));
