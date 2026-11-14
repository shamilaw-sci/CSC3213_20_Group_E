jest.mock('../repositories/adminRepository', () => ({ getExportData: jest.fn() }));
const repo = require('../repositories/adminRepository');
const { exportReport } = require('../controllers/admin/adminReportController');
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn(), setHeader: jest.fn() });
beforeEach(() => jest.resetAllMocks());
async function run(format, type = 'users') {
    const res = response(), next = jest.fn(); await exportReport({ params: { type }, query: format === undefined ? {} : { format } }, res, next); return { res, next };
}
test.each(['pdf', '', ['json'], { format: 'json' }, 1])('invalid format %p rejects before DB', async format => {
    const { res } = await run(format); expect(res.status).toHaveBeenCalledWith(400); expect(repo.getExportData).not.toHaveBeenCalled();
});
test.each(['csv', 'pdf', 'secrets'])('invalid report type %s rejects before DB', async type => {
    const { res } = await run('json', type); expect(res.status).toHaveBeenCalledWith(400); expect(repo.getExportData).not.toHaveBeenCalled();
});
test('JSON projects only export columns while preserving raw text/types/nulls', async () => {
    repo.getExportData.mockResolvedValue({ headers: ['name', 'value', 'missing'], dataToExport: [{ name: '\n=1+1', value: 0, secret: 'not-exported' }, { name: '＝1+1', value: null }] });
    const { res, next } = await run('json'); expect(next).not.toHaveBeenCalled();
    const output = JSON.parse(res.send.mock.calls[0][0]);
    expect(output).toEqual({ columns: ['name', 'value', 'missing'], rows: [{ name: '\n=1+1', value: 0, missing: null }, { name: '＝1+1', value: null, missing: null }] });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=thirasara-users-report.json');
});
test.each(['=1+1', '+1', '-1', '@SUM(1)', '＝1+1', '＋1', '－1', '＠SUM(1)', '  =1', '\t=1', '\r=1', '\n=1', '\u0000=1'])('spreadsheet CSV protects trigger %p inside quoted cell', async name => {
    repo.getExportData.mockResolvedValue({ headers: ['name'], dataToExport: [{ name }] });
    const { res } = await run('csv'); const csv = res.send.mock.calls[0][0];
    expect(csv.startsWith('name\n"\t')).toBe(true); expect(csv).not.toContain('"\n=');
});
test('default CSV retains quoting/order/nulls and finite numeric representation', async () => {
    repo.getExportData.mockResolvedValue({ headers: ['name', 'value'], dataToExport: [{ name: 'a"b, c\ntext', value: -5 }, { name: null, value: 0 }] });
    const { res } = await run(); expect(res.send).toHaveBeenCalledWith('name,value\n"a""b, c\ntext","-5"\n"","0"\n');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=thirasara-users-report.csv');
});
