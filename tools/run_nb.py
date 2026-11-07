import sys, nbformat, pathlib
from nbclient import NotebookClient
for f in sys.argv[1:]:
    nb = nbformat.read(f, as_version=4)
    NotebookClient(nb, timeout=240, kernel_name='python3').execute()
    out = pathlib.Path('ejecutados'); out.mkdir(exist_ok=True); nbformat.write(nb, out/pathlib.Path(f).name)
    print('==', f)
    for c in nb.cells:
        if c.cell_type == 'code':
            for o in c.get('outputs', []):
                if o.get('output_type') == 'stream': print(o['text'].rstrip())
                elif o.get('output_type') == 'error': print('ERROR', o['ename'], o['evalue'])
