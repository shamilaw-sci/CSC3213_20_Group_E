from pathlib import Path
root=Path.cwd()
p=root/'frontend-react/src/pages/BuyerDashboard.jsx'
s=p.read_text(encoding='utf-8')
panels=[('calculator','BuyerMortgagePanel','calcPrice, setCalcPrice, calcDownpaymentPercent, setCalcDownpaymentPercent, calcTenureYears, setCalcTenureYears, calcInterestRate, setCalcInterestRate, loanSummary','Calculator'),('dueDiligence','BuyerDueDiligencePanel','checkedItems, toggleCheckItem','Check')]
for tab,name,props,icons in panels:
    marker="{activeTab === '"+tab+"' && (\n"
    start=s.index(marker)+len(marker)
    end=s.index('\n                )}',start)
    jsx=s[start:end]
    lines=jsx.splitlines()
    jsx='\n'.join(line[12:] if line.startswith('            ') else line for line in lines)
    child="import React from 'react';\nimport { "+icons+" } from 'lucide-react';\n\nconst "+name+' = ({ '+props+' }) => {\n    return (\n'+jsx+'\n    );\n};\n\nexport default '+name+';\n'
    (root/'frontend-react/src/components/dashboard'/f'{name}.jsx').write_text(child,encoding='utf-8')
    call='<'+name+' '+' '.join(prop+'={'+prop+'}' for prop in props.split(', '))+' />'
    s=s[:start]+'                    '+call+s[end:]
    s="import "+name+" from '../components/dashboard/"+name+"';\n"+s
p.write_text(s,encoding='utf-8',newline='\r\n')
proof=(root/'docs/evidence/phase6-buyer-panels/verify-preservation.py').read_text(encoding='utf-8')
a=proof.index('panels = [')
b=proof.index('\n]\n',a)+3
proof=proof[:a]+'panels = '+repr(panels)+ '\n'+proof[b:]
proof=proof.replace('phase6-buyer-panels','phase6-buyer-tools').replace('three exact new imports and three exact inner-root','two exact new imports and two exact inner-root').replace('PASS: 3 exact JSX root','PASS: 2 exact JSX root')
(root/'docs/evidence/phase6-buyer-tools/verify-preservation.py').write_text(proof,encoding='utf-8')
