from pathlib import Path
root=Path(__file__).resolve().parents[3]
before=(root/'docs/evidence/phase6-agent-panels/Dashboard.before.jsx').read_text(encoding='utf-8')
after=(root/'frontend-react/src/pages/agent/Dashboard.jsx').read_text(encoding='utf-8')
for name in ['AgentOverviewPanel','AgentPropertiesPanel']:
    child=(root/f'frontend-react/src/components/dashboard/{name}.jsx').read_text(encoding='utf-8')
    markup=child.split(' => (\n',1)[1].rsplit(');\n\nexport default ',1)[0]
    needle='                    <'+name+' '
    start=after.index(needle); end=after.index('\n',start)+1
    after=after[:start]+markup+after[end:]
    after=after.replace(f"import {name} from '../../components/dashboard/{name}';\n",'')
assert after == before, 'Reconstructed parent differs from original'
print('PASS: complete parent reconstructed exactly; child JSX equals original branches')
