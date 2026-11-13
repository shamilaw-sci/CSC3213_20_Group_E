from pathlib import Path
b=Path('docs/evidence/phase6-admin-reject/ListingsPage.before.jsx').read_text(encoding='utf-8')
p=Path('frontend-react/src/pages/admin/pages/ListingsPage.jsx').read_text(encoding='utf-8')
c=Path('frontend-react/src/pages/admin/components/listings/RejectModal.jsx').read_text(encoding='utf-8')
a=b.index('const RejectModal =');z=b.index('// ── Detailed Inspection Modal',a);body=b[a:z]
assert c=='import React, { useState } from "react";\nimport { AlertTriangle, X } from "lucide-react";\n\n'+body+'export default RejectModal;\n'
assert p=='import RejectModal from "../components/listings/RejectModal";\n'+b[:a]+b[z:]
print('PASS exact component/state body and complete remaining page/imports')
