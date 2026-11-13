from pathlib import Path
b=Path('docs/evidence/phase6-admin-management/adminController.before.js').read_text(encoding='utf-8')
p=Path('backend-node/controllers/adminController.js').read_text(encoding='utf-8')
a=b.index('const getListings ='); z=b.index('const getUsers ='); e=b.index('const getSearchHeatmap =')
l=b[a:z]; u=b[z:e]
assert Path('backend-node/controllers/admin/adminListingController.js').read_text(encoding='utf-8')=="const adminRepository = require('../../repositories/adminRepository');\nconst { sendListingStatusEmail } = require('../../utils/emailService');\nconst { checkSavedSearchMatches } = require('../savedSearchController');\n\n"+l+'module.exports = { getListings, getListingById, approveListing, rejectListing, deleteListing };\n'
assert Path('backend-node/controllers/admin/adminUserController.js').read_text(encoding='utf-8')=="const adminRepository = require('../../repositories/adminRepository');\n\n"+u+'module.exports = { getUsers, getPendingAgents, getUserById, banUser, unbanUser, updateUserRole };\n'
imports="const { getListings, getListingById, approveListing, rejectListing, deleteListing } = require('./admin/adminListingController');\nconst { getUsers, getPendingAgents, getUserById, banUser, unbanUser, updateUserRole } = require('./admin/adminUserController');\n\n"
assert p==b[:a]+imports+b[e:]
print('PASS exact11 handlers/child shapes and unchanged remaining parent/exports')
