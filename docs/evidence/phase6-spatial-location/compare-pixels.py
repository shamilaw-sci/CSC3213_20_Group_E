import json
from pathlib import Path
from PIL import Image, ImageChops
root = Path(__file__).parent
cases = json.loads((root / 'comparison.private.json').read_text(encoding='utf-8'))
names = [f"{c['size']}-{c['theme']}-{c['state']}{'-validation' if c['validation'] else ''}" for c in cases]
names += ['interaction-light', 'interaction-dark', 'keyboard-light', 'keyboard-dark']
rows = []
for name in names:
    with Image.open(root / f'{name}-before.png') as a, Image.open(root / f'{name}-after.png') as b:
        same = a.size == b.size and a.mode == b.mode and a.tobytes() == b.tobytes()
        box = ImageChops.difference(a.convert('RGB'), b.convert('RGB')).getbbox() if a.size == b.size else None
        rows.append({'case': name, 'size': a.size, 'identical': same, 'differenceBox': box})
report = {'pairs': len(rows), 'identical': sum(r['identical'] for r in rows), 'results': rows}
(root / 'pixels.private.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'pairs': report['pairs'], 'identical': report['identical'], 'failures': [r for r in rows if not r['identical']]}))
assert report['pairs'] == report['identical'] == 36
