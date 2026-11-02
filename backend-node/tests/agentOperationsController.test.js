jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/agentRepository', () => ({ getAgentLeads: jest.fn(), updateLeadMetadata: jest.fn(), deleteAgentLead: jest.fn(), getBuyerAppointments: jest.fn(), deleteBuyerAppointment: jest.fn() }));
const repo = require('../repositories/agentRepository');
const handlers = require('../controllers/agentController');
const req = (body = {}) => ({ user: { id: 'session-id', email: 'session@example.test', role: 'AGENT' }, params: { id: 'item-id' }, body });
const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const crm = [
    ['getAgentLeads', 'getAgentLeads', 'Only approved agents can access the CRM'],
    ['updateLeadMetadata', 'updateLeadMetadata', 'Only approved agents can update CRM leads'],
    ['deleteLead', 'deleteAgentLead', 'Only approved agents can delete CRM leads'],
];
beforeEach(() => jest.resetAllMocks());
describe.each(crm)('%s authorization', (handler, method, message) => {
    test.each(['BUYER', 'SELLER', 'ADMIN', 'PENDING_AGENT', 'REJECTED_AGENT', 'BANNED', undefined, 'agent'])('rejects %s', async role => {
        const request = req(); request.user.role = role; const response = res(); const next = jest.fn();
        await handlers[handler](request, response, next);
        expect(response.status).toHaveBeenCalledWith(403); expect(response.json).toHaveBeenCalledWith({ message });
        expect(repo[method]).not.toHaveBeenCalled(); expect(next).not.toHaveBeenCalled();
    });
});
test.each([null, undefined, [{ id: 'lead', lead_status: 'Offer' }]])('CRM read fallback %p', async value => {
    repo.getAgentLeads.mockResolvedValue(value); const response = res(); await handlers.getAgentLeads(req(), response, jest.fn());
    expect(repo.getAgentLeads).toHaveBeenCalledWith('session-id'); expect(response.status).toHaveBeenCalledWith(200); expect(response.json).toHaveBeenCalledWith({ leads: value || [] });
});
test.each([
    [{ lead_status: 'Offer', timeframe: 'soon', pre_approved: false }, ['Offer', 'soon', false]],
    [{ lead_status: null, timeframe: null, pre_approved: null }, [null, null, null]],
    [{}, [undefined, undefined, undefined]],
])('metadata positional values %p', async (body, values) => {
    const lead = { id: 'updated' }; repo.updateLeadMetadata.mockResolvedValue(lead); const response = res();
    await handlers.updateLeadMetadata(req(body), response, jest.fn());
    expect(repo.updateLeadMetadata).toHaveBeenCalledWith('item-id', 'session-id', ...values);
    expect(response.status).toHaveBeenCalledWith(200); expect(response.json).toHaveBeenCalledWith({ message: 'Lead updated successfully', lead });
});
test.each([true, false, null])('CRM deletion outcome %p', async success => {
    repo.deleteAgentLead.mockResolvedValue(success); const response = res(); await handlers.deleteLead(req(), response, jest.fn());
    expect(repo.deleteAgentLead).toHaveBeenCalledWith('item-id', 'session-id'); expect(response.status).toHaveBeenCalledWith(success ? 200 : 404);
    expect(response.json).toHaveBeenCalledWith({ message: success ? 'Lead removed from CRM pipeline successfully' : 'Lead not found or already removed' });
});
test.each([null, [{ id: 'appointment' }]])('buyer read preserves value and session scope %p', async appointments => {
    repo.getBuyerAppointments.mockResolvedValue(appointments); const request = req({ email: 'foreign', id: 'foreign' }); request.user.role = 'BUYER'; const response = res();
    await handlers.getMyAppointments(request, response, jest.fn());
    expect(repo.getBuyerAppointments).toHaveBeenCalledWith('session@example.test', 'session-id');
    expect(response.status).toHaveBeenCalledWith(200); expect(response.json).toHaveBeenCalledWith({ appointments });
});
test.each([true, false, null])('buyer cancel preserves email scope and outcome %p', async success => {
    repo.deleteBuyerAppointment.mockResolvedValue(success); const request = req({ email: 'foreign' }); request.user.role = 'BUYER'; const response = res();
    await handlers.cancelBuyerAppointment(request, response, jest.fn());
    expect(repo.deleteBuyerAppointment).toHaveBeenCalledWith('item-id', 'session@example.test'); expect(response.status).toHaveBeenCalledWith(success ? 200 : 404);
    expect(response.json).toHaveBeenCalledWith({ message: success ? 'Scheduled appointment cancelled successfully' : 'Appointment not found or already cancelled' });
});
test.each([...crm.map(([h, m]) => [h, m]), ['getMyAppointments', 'getBuyerAppointments'], ['cancelBuyerAppointment', 'deleteBuyerAppointment']])('%s forwards original error', async (handler, method) => {
    const error = new Error('repository failure'); repo[method].mockRejectedValue(error); const response = res(); const next = jest.fn();
    await handlers[handler](req(), response, next);
    expect(next).toHaveBeenCalledTimes(1); expect(next).toHaveBeenCalledWith(error); expect(response.status).not.toHaveBeenCalled(); expect(response.json).not.toHaveBeenCalled();
});
