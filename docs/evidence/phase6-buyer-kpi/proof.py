from pathlib import Path
b=Path('docs/evidence/phase6-buyer-kpi/BuyerDashboard.before.jsx').read_text(encoding='utf-8')
p=Path('frontend-react/src/pages/BuyerDashboard.jsx').read_text(encoding='utf-8')
c=Path('frontend-react/src/components/dashboard/BuyerKpiCards.jsx').read_text(encoding='utf-8')
body=c.split('    return (\n',1)[1].rsplit('\n    );',1)[0]
p=p.replace("import BuyerKpiCards from '../components/dashboard/BuyerKpiCards';\n",'').replace('                    <BuyerKpiCards appointments={appointments} favorites={favorites} savedSearches={savedSearches} unreadMessages={unreadMessages} handleTabChange={handleTabChange} navigate={navigate} />',body)
assert p==b
print('PASS normalized entire parent reconstructed, including state/effects/memo/handlers')
