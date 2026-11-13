import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).parent
cases = json.loads((root / 'comparison.private.json').read_text(encoding='utf-8'))
names = [f"{c['size']}-{c['theme']}-{c['state'].replace(' ', '_')}{'-validation' if c['validation'] else ''}" for c in cases]
names += ['interaction-light', 'interaction-dark']
results = []
for name in names:
    with Image.open(root / f'{name}-before.png') as left, Image.open(root / f'{name}-after.png') as right:
        identical = left.size == right.size and left.mode == right.mode and left.tobytes() == right.tobytes()
        box = None if left.size != right.size else ImageChops.difference(left.convert('RGB'), right.convert('RGB')).getbbox()
        results.append({'case': name, 'size': left.size, 'identical': identical, 'differenceBox': box})
report = {'pairs': len(results), 'identical': sum(r['identical'] for r in results), 'results': results}
(root / 'pixels.private.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'pairs': report['pairs'], 'identical': report['identical'], 'failures': [r for r in results if not r['identical']]}))
assert report['pairs'] == report['identical'] == 28
