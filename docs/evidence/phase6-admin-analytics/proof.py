from pathlib import Path
b=Path('docs/evidence/phase6-admin-analytics/adminController.before.js').read_text(encoding='utf-8')
p=Path('backend-node/controllers/adminController.js').read_text(encoding='utf-8')
c=Path('backend-node/controllers/admin/adminAnalyticsController.js').read_text(encoding='utf-8')
a=b.index('const getDashboardStats ='); z=b.index('const getListings ='); x=b.index('const getAnalytics ='); y=b.index('const getSearchHeatmap =')
first=b[a:z]; second=b[x:y]
assert c=="const adminRepository = require('../../repositories/adminRepository');\n\n"+first+second+'module.exports = { getDashboardStats, getRevenueData, getUserGrowth, getAnalytics };\n'
expected=b[:x]+b[y:]
expected=expected[:a]+"const { getDashboardStats, getRevenueData, getUserGrowth, getAnalytics } = require('./admin/adminAnalyticsController');\n\n"+expected[z:]
assert p==expected
print('PASS exact four handlers, child shape, remaining parent and exports')
