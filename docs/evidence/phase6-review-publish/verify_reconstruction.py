from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[3]
evidence = root / 'docs/evidence/phase6-review-publish'
before = (evidence / 'AddProperty.before.jsx').read_bytes()
parent = (root / 'frontend-react/src/pages/AddProperty.jsx').read_bytes()
child = (root / 'frontend-react/src/components/property/create/ReviewPublishStep.jsx').read_bytes()
hook_before = (evidence / 'usePropertyForm.before.js').read_bytes()
hook = (root / 'frontend-react/src/hooks/usePropertyForm.js').read_bytes()
props = ['formData', 'isRentType', 'isLandType', 'images', 'virtualTourFiles', 'virtualTourMetadata', 'previewUrls', 'paymentConfig', 'loading', 'goToStep', 'handleSubmit', 'formatLKRPreview', 'locationMode', 'boundaryCoordinates']
start = before.index(b'          {currentStep === 4 && (')
root_end = before.index(b'\n', before.index(b'<m.div ', start)) + 1
inner_end = before.index(b'            </m.div>', root_end)
inner = before[root_end:inner_end]
child_prefix = b'import React from "react";\nimport { ArrowLeft, Compass, CreditCard, Edit3, Lock, MapPin } from "lucide-react";\n\nconst ReviewPublishStep = ({ ' + ', '.join(props).encode() + b' }) => (\n  <>\n'
child_suffix = b'  </>\n);\n\nexport default ReviewPublishStep;\n'
assert child == child_prefix + inner + child_suffix, 'Child markup differs from original inner markup'
replacement = b'              <ReviewPublishStep\n' + b''.join(('                ' + x + '={' + x + '}\n').encode() for x in props) + b'              />\n\n'
reconstructed = parent.replace(replacement, inner, 1)
reconstructed = reconstructed.replace(b'\nimport ReviewPublishStep from "../components/property/create/ReviewPublishStep";', b'', 1)
reconstructed = reconstructed.replace(b'  ArrowLeft, \n', b'  ArrowLeft, \n  Compass, \n', 1)
reconstructed = reconstructed.replace(b'  AlertCircle,\n', b'  AlertCircle,\n  Lock,\n  Edit3,\n  CreditCard,\n', 1)
assert reconstructed == before, 'Parent reconstruction differs from snapshot'
assert hook == hook_before, 'Hook differs from snapshot'
for name, data in [('parent snapshot', before), ('reconstructed parent', reconstructed), ('hook snapshot', hook_before), ('current hook', hook), ('child original markup', inner)]:
    print(f'{name}: {len(data)} bytes sha256={hashlib.sha256(data).hexdigest()}')
print('PASS: exact parent reconstruction, child markup, and hook bytes')
