"""Local V11 layout, landscaping and light fixtures. Retain previous assets."""
import pathlib
base=pathlib.Path(__file__).resolve().parents[2]/'cat-studio-v1/source/refine_scene.py'
helper=base.read_text(encoding='utf8').split('# Surface finishing')[0]
helper=helper.replace("bpy.ops.wm.open_mainfile(filepath=str(R/'studio.blend'))", "bpy.ops.wm.open_mainfile(filepath=str(R.parent/'cat-play-v10/studio-cozy-lounge.blend'))").replace("dist/layout.json","docs/layout.json")
exec(compile(helper,str(base),'exec'))
OUT=R.parent/'cat-stories-v11';OUT.mkdir(exist_ok=True);random.seed(11104)
# The picture plane's front turns toward +X, the lawn side of the studio.
bpy.data.objects['Illustration easel'].rotation_mode='XYZ'
bpy.data.objects['Illustration easel'].rotation_euler.z=layout['easelRotation']
for o in bpy.context.scene.objects:
 if o.name.startswith('Cello'):o.location+=V((.5,0,-.15))
 if o.name.startswith('Rocker'):o.location+=V((-.25,0,-.1))
original=set(bpy.context.scene.objects)
warm=mat('V11 frosted warm glass','#f7d59b',.48)
cool=mat('V11 frosted moon glass','#aed5d9',.42)
# Extra warm, visible fixtures: a slim reading lamp and two wall sconces.
for x,y,z in [(-4.6,1.88,-1.6),(.65,2.55,-3.72),(-4.1,2.65,-3.75)]:
 if y<2:
  lathe('V11 warm lamp base',(x,.12,z),[(0,.23),(.06,.24),(.1,.12)],darkwood)
  tube('V11 warm lamp stem',[(x,.18,z),(x,y-.12,z)],.025,gold)
 else:box('V11 warm sconce wood mount',(x,y,-3.85),(.20,.36,.08),oak,.03)
 lathe('V11 WarmGlow shade',(x,y-.2,z),[(0,.24),(.04,.24),(.34,.15),(.36,.14)],warm)
 tube('V11 shade rim',[(x+.24*math.cos(a),y-.19,z+.24*math.sin(a))for a in [i*math.tau/48 for i in range(49)]],.012,gold,True)
# Cool ground lights sit outside the narrow path and throw light across the pond.
for x,z in [(7.75,.55),(7.3,3.4),(5.3,3.68)]:
 lathe('V11 garden light stone foot',(x,.12,z),[(0,.13),(.10,.12),(.13,.08)],stoneM[2])
 tube('V11 garden light stem',[(x,.23,z),(x,.52,z)],.025,darkwood)
 ell('V11 CoolGlow garden globe',(x,.58,z),(.11,.13,.11),cool)
 lathe('V11 garden light cap',(x,.7,z),[(0,.13),(.045,.09),(.07,0)],darkwood)
# A low floral crescent beside the rocking chair leaves the front walking route open.
for i in range(7):
 a=-.9+i*.28;x=2.42+.18*math.cos(a);z=-.76+.48*math.sin(a)
 foliage('V11 butterfly flower patch',(x,.12,z),.14,.32,pinks[(i%2)*3],22)
# Surrounding planting grows in height layers; the front wooden base stays visible.
for x,z,scale in [(-7.3,2.8,.8),(-7.5,-2.8,1),(-4.1,-5.55,.85),(2,-5.2,.95),(9.05,-1.9,.9),(9.05,1.2,.7),(8.8,3.4,.7)]:
 ell('V11 outer moss cushion',(x,-.44,z),(.55*scale,.075,.48*scale),greens[0])
 for j in range(5):
  a=j*math.tau/5;foliage('V11 mixed border',(x+.34*scale*math.cos(a),-.38,z+.32*scale*math.sin(a)),.24*scale,.35*scale,pinks[j%5],24)
 for j in range(3):ell('V11 mossy border stone',(x-.30+j*.21,-.33,z+.37),(.14,.1,.11),stoneM[j%3])
for x,z in [(-7.4,-3.6),(8.95,-4.0)]:
 tube('V11 airy sapling trunk',[(x,-.42,z),(x+.06,.5,z),(x-.12,1.6,z+.1)],.04,darkwood)
 for j in range(7):
  a=j*2.4;xx=x+.4*math.cos(a);zz=z+.35*math.sin(a);yy=.65+j*.14
  tube('V11 airy sapling twig',[(x,.35,z),(xx,yy,zz)],.017,darkwood)
  foliage('V11 airy flowering crown',(xx,yy-.08,zz),.31,.38,pinks[j%2],26)
# Small mushrooms and a watering can make the garden edges feel tended.
for x,z in [(8.55,2.7),(-6.8,3.25),(8.75,-.2)]:
 for j in range(3):
  xx=x+j*.09;zz=z+(j%2)*.12;h=.11+j*.025
  tube('V11 mushroom stem',[(xx,-.38,zz),(xx,-.38+h,zz)],.018,cream)
  ell('V11 terracotta mushroom cap',(xx,-.38+h,zz),(.07,.035,.07),pinks[5])
lathe('V11 garden watering can',(2.53,.12,-1.25),[(0,.12),(.05,.16),(.27,.15),(.29,.12)],greens[1])
tube('V11 watering can handle',[(2.38,.18,-1.25),(2.28,.30,-1.25),(2.35,.49,-1.25),(2.53,.48,-1.25)],.018,gold)
tube('V11 watering can spout',[(2.65,.21,-1.25),(2.83,.39,-1.25)],.025,greens[1])
for (name,material),(verts,faces) in batches.items():
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(bpy.data.materials[material]);smooth(o)
for o in bpy.context.scene.objects:
 if o not in original and o.type=='CURVE':o.data.use_fill_caps=True
# Exports keep the same seven-file runtime contract and moving furniture names.
def export(name,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/name),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_apply=True)
cats=set()
for n in ['cat','orange-cat','tabby-cat','longhair-cat']:
 root=bpy.data.objects[n+' placed'];cats.update([root,*root.children_recursive])
objects=[o for o in bpy.context.scene.objects if o not in cats and o.type not in ('CAMERA','LIGHT')]
cozy=[o for o in objects if o.name.startswith(('Rocker','Bed ','Tower '))]
surround=[o for o in objects if o.name.startswith(('Surround','V11 '))]
export('cozy-props.glb',cozy);export('surroundings.glb',surround);export('scene.glb',[o for o in objects if o not in cozy and o not in surround])
# Restore the player from the previous contact-render pose to its gate spawn.
root=bpy.data.objects['cat placed'];root.location=V(layout['playerSpawn']);root.rotation_euler=(0,0,math.pi)
rig=bpy.data.objects['catRig']
for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.rotation_quaternion=(1,0,0,0);b.location=(0,0,0)
for t in rig.animation_data.nla_tracks:t.mute=t.name!='Idle'
s=bpy.context.scene;s.frame_set(0);target=V(layout['camera']['target']);s.camera.location=target+V((math.sin(.62)*22,17,math.cos(.62)*22));s.camera.rotation_euler=(target-s.camera.location).to_track_quat('-Z','Y').to_euler();s.camera.data.ortho_scale=22.4
s.render.resolution_x=1500;s.render.resolution_y=1000;s.render.resolution_percentage=100;s.render.filepath=str(OUT/'day-overview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'studio-stories.blend'));bpy.ops.render.render(write_still=True)
(OUT/'assembly-report.json').write_text(json.dumps({'version':'v11','paidGeneration':False,'newObjects':len(set(s.objects)-original),'easelRotation':layout['easelRotation'],'rocker':layout['cozy']['rocker']['center'],'instrument':layout['cello']},indent=2),encoding='utf8')
