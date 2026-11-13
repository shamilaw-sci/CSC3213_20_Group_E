from pathlib import Path
b=Path('docs/evidence/phase6-seller-kpi/SellerDashboard.before.jsx').read_text(encoding='utf-8')
p=Path('frontend-react/src/pages/SellerDashboard.jsx').read_text(encoding='utf-8')
c=Path('frontend-react/src/components/dashboard/SellerKpiCards.jsx').read_text(encoding='utf-8')
body=c.split('    return (\n',1)[1].rsplit('\n    );',1)[0]
p=p.replace("import SellerKpiCards from '../components/dashboard/SellerKpiCards';\n",'').replace('                <SellerKpiCards loading={loading} stats={stats} formatLKR={formatLKR} />',body)
assert p==b
print('PASS normalized complete parent reconstructed, including calculations/effects/helper')
