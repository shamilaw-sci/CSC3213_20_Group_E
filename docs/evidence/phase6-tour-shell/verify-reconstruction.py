from pathlib import Path
root = Path(__file__).resolve().parents[3]
evidence = root / 'docs/evidence/phase6-tour-shell'
parent = (root / 'frontend-react/src/pages/AddProperty.jsx').read_bytes()
hook = (root / 'frontend-react/src/hooks/usePropertyForm.js').read_bytes()
original = (evidence / 'parent-before.snapshot').read_bytes()
section = (evidence / 'tour-markup-before.snapshot').read_bytes()
rows = (evidence / 'tour-rows-before.snapshot').read_bytes()
child_path = root / 'frontend-react/src/components/property/create/VirtualToursSection.jsx'
assert child_path.exists(), 'VirtualToursSection shell is missing'
child = child_path.read_bytes()
opening = b'''                <VirtualToursSection\n                  onUpload={handleVirtualTourUpload}\n                  currentSizeMB={current360SizeMB}\n                  maxSizeMB={MAX_360_MB}\n                  progress={v360Progress}\n                >\n'''
closing = b'                </VirtualToursSection>\n'
replacement = opening + rows + closing
added_import = b'\nimport VirtualToursSection from "../components/property/create/VirtualToursSection";'
assert parent.count(replacement) == 1 and parent.count(added_import) == 1
assert parent.replace(replacement, section).replace(added_import, b'').replace(b'  Check }', b'  Check, Maximize }') == original, 'Parent differs outside extraction'
expected = section.replace(rows, b'                  {children}\n')
for old,new in [(b'handleVirtualTourUpload',b'onUpload'),(b'current360SizeMB',b'currentSizeMB'),(b'MAX_360_MB',b'maxSizeMB'),(b'v360Progress',b'progress')]: expected=expected.replace(old,new)
wrapper = b'import { Maximize } from "lucide-react";\n\nconst VirtualToursSection = ({ onUpload, currentSizeMB, maxSizeMB, progress, children }) => (\n  <>\n' + expected + b'  </>\n);\n\nexport default VirtualToursSection;\n'
assert child == wrapper, 'Shell differs from transformed original markup'
assert hook == (evidence / 'hook-before.snapshot').read_bytes(), 'Hook changed'
print('PASS: parent and rows reconstruct byte-for-byte; shell matches original; hook unchanged')
