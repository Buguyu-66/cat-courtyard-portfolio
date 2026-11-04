"""Create compact web copies; preserve all original GLBs and independent object names."""
import pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parent.parent
dest=root/'docs/models-web';dest.mkdir(exist_ok=True)
exe=pathlib.Path(sys.argv[1]).resolve()
for name in ['scene.glb','surroundings.glb','cozy-props.glb']:
 subprocess.run([str(exe),'-i',str(root/'docs/models'/name),'-o',str(dest/name),'-kn','-km','-ke','-kv','-vpf','-vtf','-vnf','-vp','16','-vt','16','-vn','12','-cc','-ce','ext','-tw','-tq','9','-tj','6'],check=True)
 print(name,(root/'docs/models'/name).stat().st_size,(dest/name).stat().st_size,flush=True)
