from pathlib import Path
root = Path(__file__).resolve().parents[3]
evidence = root / 'docs/evidence/phase6-hd-photos'
parent = (root / 'frontend-react/src/pages/AddProperty.jsx').read_bytes()
hook = (root / 'frontend-react/src/hooks/usePropertyForm.js').read_bytes()
child = (root / 'frontend-react/src/components/property/create/HDPhotosSection.jsx').read_bytes()
original = (evidence / 'parent-before.jsx.snapshot').read_bytes()
markup = (evidence / 'hd-markup-before.snapshot').read_bytes()
replacement = b'''              <HDPhotosSection\n                imageCount={images.length}\n                previewUrls={previewUrls}\n                onUpload={handleImageUpload}\n                onRemove={removeImage}\n                currentSizeMB={currentHDSizeMB}\n                maxSizeMB={MAX_HD_MB}\n                progress={hdProgress}\n              />\n\n'''
added_import = b'\nimport HDPhotosSection from "../components/property/create/HDPhotosSection";'
assert parent.count(replacement) == 1 and parent.count(added_import) == 1
restored = parent.replace(replacement, markup).replace(added_import, b'').replace(b'  Trash2, \n', b'  Trash2, \n  Upload,\n')
assert restored == original, 'Parent differs outside the bounded extraction'
expected_markup = markup
for old, new in [(b'images.length',b'imageCount'),(b'handleImageUpload',b'onUpload'),(b'removeImage',b'onRemove'),(b'currentHDSizeMB',b'currentSizeMB'),(b'MAX_HD_MB',b'maxSizeMB'),(b'hdProgress',b'progress')]:
    expected_markup = expected_markup.replace(old,new)
expected_child = b'import { Trash2, Upload } from "lucide-react";\n\nconst HDPhotosSection = ({ imageCount, previewUrls, onUpload, onRemove, currentSizeMB, maxSizeMB, progress }) => (\n  <>\n' + expected_markup + b'  </>\n);\n\nexport default HDPhotosSection;\n'
assert child == expected_child, 'Extracted markup or component wrapper differs'
assert hook == (evidence / 'hook-before.snapshot').read_bytes(), 'Hook changed'
print('PASS: parent reconstructed byte-for-byte; child matches transformed markup; hook unchanged byte-for-byte')
