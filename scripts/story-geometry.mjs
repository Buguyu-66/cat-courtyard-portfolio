// Export runtime-created props for Blender inspection; this is not a browser test.
import fs from 'node:fs';
import * as T from '../docs/vendor/three.module.js';
import {createMischief} from '../docs/mischief.js';
const layout=JSON.parse(fs.readFileSync(new URL('../docs/layout.json',import.meta.url),'utf8')),scene=new T.Scene(),root=new T.Group();root.position.set(...layout.playerSpawn);
const player={root},game=createMischief({scene,layout,actors:()=>({player}),blocked:()=>false,obstacles:[],toast:()=>{},tone:()=>{},setAnim:()=>{}});game.update(.1,false);scene.updateMatrixWorld(true);
const meshes=[];scene.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,v=new T.Vector3(),verts=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);verts.push(v.toArray());}const index=o.geometry.index?.array??Array.from({length:p.count},(_,i)=>i),faces=[];for(let i=0;i<index.length;i+=3)faces.push([index[i],index[i+1],index[i+2]]);meshes.push({name:o.name||o.parent.name,vertices:verts,faces,color:o.material.color.toArray(),doubleSide:o.material.side===T.DoubleSide});});
fs.writeFileSync(new URL('../../cat-stories-v11/runtime-props.json',import.meta.url),JSON.stringify(meshes));console.log(`Exported ${meshes.length} runtime prop meshes for visual inspection.`);
