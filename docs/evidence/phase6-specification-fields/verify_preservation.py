from pathlib import Path
root = Path(__file__).resolve().parents[3]
evidence = root / 'docs/evidence/phase6-specification-fields'
original = (evidence / 'AddProperty.before.jsx').read_bytes()
parent = (root / 'frontend-react/src/pages/AddProperty.jsx').read_bytes()
component = (root / 'frontend-react/src/components/property/create/PropertySpecificationFields.jsx').read_bytes()
start = original.index(b'              {!isLandType && (', original.index(b'STEP 3: SPECIFICATIONS'))
end = original.index(b'              <div>\n                <label', original.index(b'name="description"', start))
block = original[start:end]
prefix = b'import React from "react";\nimport { Bed, Bath, Maximize2 } from "lucide-react";\n\nexport default function PropertySpecificationFields({ formData, isLandType, isHouseType, onChange }) {\n  return (\n    <>\n'
suffix = b'    </>\n  );\n}\n'
assert component == prefix + block.replace(b'handleChange', b'onChange') + suffix, 'field markup differs'
expected = original[:start] + b'              <PropertySpecificationFields formData={formData} isLandType={isLandType} isHouseType={isHouseType} onChange={handleChange} />\n\n' + original[end:]
expected = expected.replace(b'  Bed, \n  Bath, \n  Maximize2, \n', b'')
expected = expected.replace(b'import LocationStep from "../components/property/create/LocationStep";', b'import LocationStep from "../components/property/create/LocationStep";\nimport PropertySpecificationFields from "../components/property/create/PropertySpecificationFields";')
assert parent == expected, 'parent differs outside approved substitutions'
assert (evidence / 'usePropertyForm.before.js').read_bytes() == (root / 'frontend-react/src/hooks/usePropertyForm.js').read_bytes(), 'hook differs'
print('PASS: exact field markup with handler substitution; exact parent bytes outside approved imports/field substitution; exact hook bytes')
print('Parent equality covers all 31 documented non-render statements, top-level declarations, map, media, navigation, and other steps.')
