const adminRepository = require('../../repositories/adminRepository');

const getTransactions = async(req, res, next) => {
    try {
        const transactions = await adminRepository.getTransactionsDetailed();
        res.status(200).json({ transactions });
    } catch (error) {
        next(error);
    }
};

const exportReport = async(req, res, next) => {
    try {
        const { type } = req.params;
        if (!['transactions', 'users', 'listings'].includes(type)) {
            return res.status(400).json({ message: "Invalid report type" });
        }

        const { dataToExport, headers } = await adminRepository.getExportData(type);

        // Sanitize cells against CSV / Spreadsheet Formula Injection (M6 fix)
        const sanitizeCsvCell = (val) => {
            if (val === null || val === undefined) return '""';
            let str = String(val);
            // Prepend single quote if value starts with formula triggers (=, +, -, @, \t, \r)
            if (/^[=+\-@\t\r]/.test(str)) {
                str = "'" + str;
            }
            return `"${str.replace(/"/g, '""')}"`;
        };

        let csvContent = headers.join(',') + '\n';
        dataToExport.forEach(row => {
            const values = headers.map(header => sanitizeCsvCell(row[header]));
            csvContent += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=thirasara-${type}-report.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

module.exports = { getTransactions, exportReport };
