"""Create compact web copies; preserve all original GLBs and independent object names."""
import pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parent.parent
dest=root/'docs/models-web';dest.mkdir(exist_ok=True)
exe=pathlib.Path(sys.argv[1]).resolve()
for source in sorted((root/'docs/models').glob('*.glb')):
 name=source.name
 subprocess.run([str(exe),'-i',str(source),'-o',str(dest/name),'-kn','-km','-ke','-kv','-vpf','-vp','14','-vt','12','-vn','8','-cc','-ce','ext','-tw','-tq','9','-tj','6'],check=True)
 print(name,(root/'docs/models'/name).stat().st_size,(dest/name).stat().st_size,flush=True)
