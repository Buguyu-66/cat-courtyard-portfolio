// Shared by the player and the curious tabby; every segment clears solid props.
export function findPath(start,end,blocked){
 const step=.28,key=(x,z)=>`${x},${z}`,cv=v=>Math.round(v/step);
 let sx=cv(start.x),sz=cv(start.z);const ex=cv(end.x),ez=cv(end.z);
 const clear=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.07));for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;};
 const anchors=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const x=sx+dx,z=sz+dz;if(clear(start,{x:x*step,z:z*step}))anchors.push({x,z,d:Math.hypot(x*step-start.x,z*step-start.z)});}
 anchors.sort((a,b)=>a.d-b.d);if(!anchors.length)return[];sx=anchors[0].x;sz=anchors[0].z;
 const open=[{x:sx,z:sz,g:0,f:0}],seen=new Map([[key(sx,sz),0]]),parents=new Map();let finish=null;
 for(let k=0;k<6000&&open.length;k++){
  open.sort((a,b)=>a.f-b.f);const n=open.shift();
  if(n.g>seen.get(key(n.x,n.z)))continue;
  if(Math.hypot(n.x-ex,n.z-ez)<1.4){finish=n;break;}
  for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const x=n.x+dx,z=n.z+dz;if(!clear({x:n.x*step,z:n.z*step},{x:x*step,z:z*step}))continue;
   const g=n.g+Math.hypot(dx,dz),id=key(x,z);if(g>=(seen.get(id)??Infinity))continue;
   seen.set(id,g);parents.set(id,n);open.push({x,z,g,f:g+Math.hypot(x-ex,z-ez)});
  }
 }
 if(!finish)return[];const path=[];let n=finish;
 while(n.x!==sx||n.z!==sz){path.unshift({x:n.x*step,z:n.z*step});n=parents.get(key(n.x,n.z));if(!n)break;}
 path.unshift({x:sx*step,z:sz*step});
 if(clear(path.at(-1)??start,end))path.push({x:end.x,z:end.z});
 return path;
}
