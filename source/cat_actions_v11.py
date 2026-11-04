"""Add a full stretch and a wet-paw shake to the original skinned player."""
import bpy,math,pathlib,json,struct
from mathutils import Matrix,Vector,Euler
R=pathlib.Path(__file__).resolve().parent.parent;OUT=R.parent/'cat-stories-v11'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'studio-stories.blend'));rig=bpy.data.objects['catRig'];root=bpy.data.objects['cat placed']
for t in rig.animation_data.nla_tracks:t.mute=True
for t in list(rig.animation_data.nla_tracks):
 if t.name=='Lounge':rig.animation_data.nla_tracks.remove(t)
if bpy.data.actions.get('Lounge'):bpy.data.actions.remove(bpy.data.actions['Lounge'])
for name,end in [('Lounge',96),('Stretch',64),('Shake',32)]:
 act=bpy.data.actions.new(name);rig.animation_data.action=act
 for frame in range(0,end+1,4):
  t=frame/end;e=math.sin(math.pi*t)**1.4
  for b in rig.pose.bones:
   b.rotation_mode='QUATERNION';angles=Euler((0,0,0),'XYZ');b.location=(0,0,0)
   if name=='Lounge':
    if b.name=='root':b.location.y=-.17+math.sin(t*math.tau)*.007
    if b.name.startswith('front'):angles.x=-1.02
    if b.name.startswith('back'):angles.x=1.10
    if b.name=='head':angles.x=.12+math.sin(t*math.tau)*.012
    if b.name=='tail':angles.x=-.85;angles.y=.14+math.sin(t*math.tau)*.025
   elif name=='Stretch':
    if b.name=='root':b.location.y=-.10*e;angles.x=.12*e
    if b.name.startswith('front'):angles.x=-1.1*e
    if b.name.startswith('back'):angles.x=.18*e
    if b.name=='head':angles.x=.27*e
    if b.name=='tail':angles.y=math.sin(t*math.tau)*.2
   else:
    if b.name=='frontR':angles.x=(-1+.2*math.sin(t*math.tau*5))*e;angles.z=math.sin(t*math.tau*6)*.22*e
    if b.name=='head':angles.z=math.sin(t*math.tau*2)*.10*e
   b.rotation_quaternion=angles.to_quaternion();b.keyframe_insert('rotation_quaternion',frame=frame);b.keyframe_insert('location',frame=frame)
 rig.animation_data.action=None;track=rig.animation_data.nla_tracks.new();track.name=name;track.strips.new(name,0,act);track.mute=True
old=root.matrix_world.copy();root.matrix_world=Matrix.Identity(4);bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT')
for o in [root,*root.children_recursive]:o.select_set(True)
asset=OUT/'cat.glb';bpy.ops.export_scene.gltf(filepath=str(asset),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_apply=True)
data=asset.read_bytes();length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length]);g['animations']=[a for a in g['animations'] if a['name'] in ('Idle','Walk','Paw','Rest','Lounge','Stretch','Shake')];document=json.dumps(g,separators=(',',':')).encode();document+=b' '*((-len(document))%4);tail=data[20+length:];asset.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(document)+len(tail))+struct.pack('<II',len(document),0x4e4f534a)+document+tail)
root.matrix_world=old
def V(p):return Vector((p[0],-p[2],p[1]))
layout=json.loads((R/'docs/layout.json').read_text(encoding='utf8'));p=layout['cozy']['tower']['steps'][-1];root.location=V(p);root.rotation_euler=(0,0,.5)
for t in rig.animation_data.nla_tracks:t.mute=t.name!='Stretch'
s=bpy.context.scene;s.frame_set(32);target=V((p[0],p[1]+.3,p[2]));s.camera.location=target+V((3,2.5,5));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=3.2;s.render.resolution_x=900;s.render.resolution_y=900;s.render.filepath=str(OUT/'stretch-contact.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'studio-stories-actions.blend'));bpy.ops.render.render(write_still=True)
