// Portfolio entries and playful actions share one screen-space layout.
// Keep their actual object anchors; offset only the labels and connect them.
export function overlaps(a,b,gap=8){
 return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
}
const offsets=[[0,0]];
for(const radius of [24,48,76,108,148,196,252,320])for(let i=0;i<16;i++){
 const angle=i*Math.PI/8;offsets.push([Math.cos(angle)*radius,Math.sin(angle)*radius]);
}
export function placeMarkers(items,{width,height,top=70,bottom=142,gap=9}){
 const result=new Map(),occupied=[],pad=12;
 const visible=items.filter(i=>i.anchor.x>=0&&i.anchor.x<=width&&i.anchor.y>=0&&i.anchor.y<=height);
 visible.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
 for(const item of visible){
  const[dx,dy]=item.offset??[0,-10],baseX=item.anchor.x-item.w/2+dx,baseY=item.anchor.y-item.h-12+dy;
  const previous=item.previous??[0,0];
  const candidates=[...offsets,previous].map(([x,y])=>{
   x=Math.max(pad,Math.min(width-pad-item.w,baseX+x));y=Math.max(top,Math.min(height-bottom-item.h,baseY+y));
   return {x,y,w:item.w,h:item.h,score:Math.hypot(x-baseX,y-baseY)+.28*Math.hypot(x-baseX-previous[0],y-baseY-previous[1])};
  }).sort((a,b)=>a.score-b.score);
  const rect=candidates.find(r=>r.y>=top&&r.y+r.h<=height-bottom&&r.x>=pad&&r.x+r.w<=width-pad&&!occupied.some(o=>overlaps(r,o,gap)));
  if(!rect)continue;
  occupied.push(rect);result.set(item.id,{...rect,offset:[rect.x-baseX,rect.y-baseY],anchor:item.anchor});
 }
 return result;
}
