// The same reference layout drives Blender assembly and browser navigation.
export function createCollision(layout) {
 const [ax,az]=layout.arch;
 const obstacles=[[...layout.desk.center,1.8,.68],[...layout.desk.chair,.32,.32],[-5.15,1.05,.45,.45],
  [...layout.modelTable,1.06,.68],[...layout.teaTable,.72,.45],[...layout.sofa.center,...layout.sofa.halfSize],[-2.8,-3.6,1.1,.28],
  [...layout.coffeeCabinet,1.08,.45],[...layout.tree,.32*layout.treeScale[0],.30*layout.treeScale[2]],[...layout.cello,.28,.25],[layout.swing.cat[0],layout.swing.cat[2],.6,.7],
  [...layout.mailbox,.17,.17],[ax-.75,az,.12,.12],[ax+.75,az,.12,.12],
  [ax-1.02,az+.15,.16,.16],[ax+1.05,az+.15,.16,.16],
  ...[...layout.planters,...layout.windowPlants].map(([x,z,r])=>[x,z,r,r]),
  ...Object.values(layout.cozy??{}).filter(p=>p.halfSize).map(p=>[p.center[0],p.center[2],...p.halfSize]),...(layout.extraSolids??[])];
 function blocked(x,z,r=.19){
  const b=layout.bounds;if(x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r)return true;
  const {center,radius}=layout.pond;
  if(((x-center[0])/(radius[0]+r))**2+((z-center[1])/(radius[1]+r))**2<1)return true;
  return obstacles.some(([cx,cz,hx,hz])=>Math.abs(x-cx)<hx+r&&Math.abs(z-cz)<hz+r);
 }
 // Exact swept clearance prevents tiny corner cuts between navigation samples.
 blocked.segmentClear=(a,b,r=.192)=>{
  if(blocked(a.x,a.z,r)||blocked(b.x,b.z,r))return false;
  const {center,radius}=layout.pond,u={x:(a.x-center[0])/(radius[0]+r),z:(a.z-center[1])/(radius[1]+r)},v={x:(b.x-a.x)/(radius[0]+r),z:(b.z-a.z)/(radius[1]+r)};
  const t=Math.max(0,Math.min(1,-(u.x*v.x+u.z*v.z)/(v.x*v.x+v.z*v.z||1)));if((u.x+t*v.x)**2+(u.z+t*v.z)**2<1)return false;
  for(const[cx,cz,hx,hz]of obstacles){let lo=0,hi=1,intersects=true;for(const[p,d,min,max]of[[a.x,b.x-a.x,cx-hx-r,cx+hx+r],[a.z,b.z-a.z,cz-hz-r,cz+hz+r]]){if(Math.abs(d)<1e-10){if(p<min||p>max){intersects=false;break;}}else{let s=(min-p)/d,e=(max-p)/d;if(s>e)[s,e]=[e,s];lo=Math.max(lo,s);hi=Math.min(hi,e);if(lo>hi){intersects=false;break;}}}if(intersects)return false;}
  return true;
 };
 return {obstacles,blocked};
}
