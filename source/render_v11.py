"""Inspect local geometry and night lighting in Blender, not browser/WebGL parity."""
import bpy,pathlib,json,math
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parent.parent;OUT=R.parent/'cat-stories-v11'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'studio-stories.blend'))
def V(p):return Vector((p[0],-p[2],p[1]))
def rgb(h):return tuple(int(h[i:i+2],16)/255 for i in (1,3,5))
s=bpy.context.scene
for info in json.loads((OUT/'runtime-props.json').read_text()):
 m=bpy.data.meshes.new(info['name']);m.from_pydata([V(v)for v in info['vertices']],[],info['faces']);m.update();o=bpy.data.objects.new(info['name'],m);s.collection.objects.link(o)
 mat=bpy.data.materials.new(info['name']+' material');mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*info['color'],1);p.inputs['Roughness'].default_value=.7;m.materials.append(mat)
 for face in m.polygons:face.use_smooth=True
for o in s.objects:
 if o.name.startswith('Pond water'):
  print('POND_HEIGHT',o.name,[round((o.matrix_world@Vector(v)).z,3)for v in o.bound_box])
s.render.filepath=str(OUT/'day-with-wildlife.png');bpy.ops.render.render(write_still=True)
target=V((5.85,.2,1.8));s.camera.location=target+V((3,5,6));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=5.9;s.render.resolution_x=1000;s.render.resolution_y=1000;s.render.filepath=str(OUT/'pond-fish-detail.png');bpy.ops.render.render(write_still=True)
for o in s.objects:
 if o.type=='LIGHT':o.data.energy=0
s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(*rgb('#243d58'),1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.3
def light(name,p,energy,kind='POINT',target=None,color='#ffb45b'):
 data=bpy.data.lights.new(name,kind);data.energy=energy;data.color=rgb(color);o=bpy.data.objects.new(name,data);s.collection.objects.link(o);o.location=V(p)
 if kind=='POINT':data.shadow_soft_size=.3
 if target:o.rotation_euler=(V(target)-o.location).to_track_quat('-Z','Y').to_euler()
 return o
moon=light('Night moon',(-5,12,8),.55,'SUN',(0,0,0),'#9dbff0');moon.data.angle=.25
for name,p,power in [('Desk',[-3.2,1.65,2.45],16),('Wall',[-4.15,2.85,-3.4],26),('Gate left',[2.48,1.03,3.7],9),('Gate right',[4.55,1.03,3.7],16),('Shelf',[-1.8,2.55,-3.25],20),('Window',[-4.6,1.84,-1.6],15),('Right sconce',[.65,2.5,-3.5],18),('Left sconce',[-4.1,2.6,-3.5],16),('Fill',[-1.6,2.4,1.2],22)]:light(name,p,power*12)
room=light('Room soft warm',[-1.8,3.3,-1.6],600,'AREA',[-1.5,.2,0],'#ffd49a');room.data.shape='DISK';room.data.size=3
for i,p in enumerate([[7.75,.58,.55],[7.3,.58,3.4],[5.3,.58,3.68]]):light('Cool pond lamp '+str(i),p,70,color='#98c9e2')
pond=light('Pond wash',[7.55,1.7,2.5],160,'AREA',[5.8,.1,1.7],'#9dd5e6');pond.data.size=2
for o in list(s.objects):
 if o.type!='MESH':continue
 kind='cool' if 'CoolGlow' in o.name else 'warm' if 'WarmGlow' in o.name or o.name.startswith('Lantern warm pane') else 'shade' if o.name.startswith('Ivory lamp shade') else ''
 if kind:
  for i,m in enumerate(o.data.materials):
   m=m.copy();o.data.materials[i]=m;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Emission Color'].default_value=(*rgb('#a3d7ef' if kind=='cool' else '#ffc16d'),1);p.inputs['Emission Strength'].default_value=1.6 if kind=='cool' else 1.8 if kind=='warm' else .8
layout=json.loads((R/'docs/layout.json').read_text(encoding='utf8'));target=V(layout['camera']['target']);s.camera.location=target+V((math.sin(.62)*22,17,math.cos(.62)*22));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=22.4;s.render.resolution_x=1500;s.render.resolution_y=1000;s.render.filepath=str(OUT/'night-overview.png');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'studio-night-inspection.blend'));bpy.ops.render.render(write_still=True)
