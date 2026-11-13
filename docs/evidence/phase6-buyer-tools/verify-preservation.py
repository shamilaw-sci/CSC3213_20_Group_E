"""Run from any cwd: python docs/evidence/phase6-buyer-tools/verify-preservation.py.

Strict whole-file reconstruction permits only indentation/newline normalization,
two exact new imports and two exact inner-root component call replacements.
Strings, classes, keys, imports, statements, callbacks and helpers are compared.
"""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[3]
original = (Path(__file__).parent / 'BuyerDashboard.before.jsx').read_text(encoding='utf-8')
current = (root / 'frontend-react/src/pages/BuyerDashboard.jsx').read_text(encoding='utf-8')
panels = [('calculator', 'BuyerMortgagePanel', 'calcPrice, setCalcPrice, calcDownpaymentPercent, setCalcDownpaymentPercent, calcTenureYears, setCalcTenureYears, calcInterestRate, setCalcInterestRate, loanSummary', 'Calculator'), ('dueDiligence', 'BuyerDueDiligencePanel', 'checkedItems, toggleCheckItem', 'Check')]
def normalized(text):
    return '\n'.join(line.strip() for line in text.splitlines())

reconstructed = current
for tab, name, props, icons in panels:
    added_import = "import " + name + " from '../components/dashboard/" + name + "';\n"
    assert reconstructed.count(added_import) == 1, name + ' exact new import'
    reconstructed = reconstructed.replace(added_import, '', 1)
    child = (root / 'frontend-react/src/components/dashboard' / (name + '.jsx')).read_text(encoding='utf-8')
    prefix = "import React from 'react';\nimport { " + icons + " } from 'lucide-react';\n\nconst " + name + ' = ({ ' + props + ' }) => {\n    return (\n'
    suffix = '\n    );\n};\n\nexport default ' + name + ';\n'
    assert child.startswith(prefix) and child.endswith(suffix), name + ' pure presentation boundary'
    jsx = child[len(prefix):-len(suffix)]
    call = '<' + name + ' ' + ' '.join(p + '={' + p + '}' for p in props.split(', ')) + ' />'
    assert reconstructed.count(call) == 1, name + ' exact prop identity'
    reconstructed = reconstructed.replace(call, jsx, 1)
    assert "{activeTab === '" + tab + "' && (" in current
assert normalized(reconstructed) == normalized(original), 'whole-parent reconstruction differs'
imports = lambda text: re.findall(r'^import[\s\S]*?;', text, re.M)
assert imports(reconstructed) == imports(original), 'original imports changed'
assert reconstructed[reconstructed.index('const BuyerDashboard'):reconstructed.index('    if (loading)')] == original[original.index('const BuyerDashboard'):original.index('    if (loading)')], 'non-return statements changed'
helper = '// ── Upgrade to Seller Tab'
assert reconstructed[reconstructed.index(helper):] == original[original.index(helper):], 'helper changed'
print('PASS: 2 exact JSX root transplants; complete normalized parent reconstruction including original imports; all non-return statements and UpgradeToSellerTab helper unchanged.')
