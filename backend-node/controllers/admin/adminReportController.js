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
        const format = req.query?.format === undefined ? 'csv' : req.query.format;
        if (!['csv', 'json'].includes(format)) return res.status(400).json({ message: 'Invalid report format' });

        const { dataToExport, headers } = await adminRepository.getExportData(type);
        if (format === 'json') {
            const rows = dataToExport.map(row => Object.fromEntries(headers.map(key => [key, row[key] ?? null])));
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=thirasara-${type}-report.json`);
            return res.status(200).send(JSON.stringify({ columns: headers, rows }));
        }

        // Sanitize cells against CSV / Spreadsheet Formula Injection (M6 fix)
        const sanitizeCsvCell = (val) => {
            if (val === null || val === undefined) return '""';
            let str = String(val);
            // CSV is the spreadsheet display format. JSON preserves source values.
            const numeric = typeof val === 'number' && Number.isFinite(val);
            if (!numeric && (/^[\s\u0000-\u001f\u007f-\u009f]*[=+\-@＝＋－＠]/u.test(str)
                || /^[\u0000-\u001f\u007f-\u009f]/u.test(str))) {
                str = '\t' + str.replace(/^[\u0000-\u001f\u007f-\u009f]+/u, '');
            }
            return `"${str.replace(/"/g, '""')}"`;
        };

        let csvContent = headers.join(',') + '\n';
        dataToExport.forEach(row => {
            const values = headers.map(header => sanitizeCsvCell(row[header]));
            csvContent += values.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=thirasara-${type}-report.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

module.exports = { getTransactions, exportReport };
