const fs = require('fs');

const files = [
    'frontend-react/src/components/Navbar.jsx',
    'frontend-react/src/components/PropertyCard.jsx',
    'frontend-react/src/components/map/FeasibilityCalculator.jsx',
    'frontend-react/src/components/map/MapTopBar.jsx',
    'frontend-react/src/components/property/ImageUploader.jsx',
    'frontend-react/src/components/property/MapSidebarCard.jsx',
    'frontend-react/src/components/property/PropertyCard.jsx',
    'frontend-react/src/context/ThemeProvider.jsx',
    'frontend-react/src/context/UserAuthContext.jsx',
    'frontend-react/src/pages/AgentProfile.jsx',
    'frontend-react/src/pages/BuyPage.jsx',
    'frontend-react/src/pages/MyFavorites.jsx',
    'frontend-react/src/pages/MyProperties.jsx',
    'frontend-react/src/pages/ProfileSettings.jsx',
    'frontend-react/src/pages/PropertyDetails.jsx',
    'frontend-react/src/pages/SellerDashboard.jsx',
    'frontend-react/src/pages/admin/pages/AgentApprovalsPage.jsx',
    'frontend-react/src/pages/admin/pages/AnalyticsPage.jsx',
    'frontend-react/src/pages/admin/pages/DashboardPage.jsx',
    'frontend-react/src/pages/admin/pages/ReportsPage.jsx',
    'frontend-react/src/pages/agent/Dashboard.jsx'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    let changed = false;

    // Check if there's any console.error
    if (content.includes('console.error')) {
        // Add import
        if (!content.includes('react-hot-toast')) {
            const importLines = content.split('\n').filter(l => l.startsWith('import '));
            if (importLines.length > 0) {
                const lastImport = importLines[importLines.length - 1];
                content = content.replace(lastImport, lastImport + "\nimport toast from 'react-hot-toast';");
            } else {
                content = "import toast from 'react-hot-toast';\n" + content;
            }
            changed = true;
        }

        // Replace console.error("Msg", err) -> (toast.error("Msg"), console.error("Msg", err))
        const originalContent = content;
        content = content.replace(/console\.error\((["'`])(.*?)\1\s*(,\s*(.*?))?\)/g, (match, quote, msg, group3, errVar) => {
            return `(toast.error(${quote}${msg}${quote}), console.error(${quote}${msg}${quote}${errVar ? `, ${errVar}` : ''}))`;
        });
        
        if (content !== originalContent) changed = true;

        if (changed) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated ' + file);
        }
    }
});
