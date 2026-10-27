jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/agentRepository');

let direct, conversations, writes;
beforeEach(() => {
    direct = [{ lead_id: 'lead1', assigned_agent_id: 'agent1', lifecycle_status: 'New' }];
    conversations = [];
    writes = [];
    db.from.mockImplementation(table => {
        const filters = [];
        let update;
        const query = {
            select: jest.fn(() => query),
            eq: jest.fn((key, value) => { filters.push([key, value]); return query; }),
            in: jest.fn(() => query),
            order: jest.fn(() => query),
            update: jest.fn(value => { update = value; return query; }),
            then(resolve) {
                const rows = (table === 'leads' ? direct : table === 'conversations' ? conversations : [])
                    .filter(row => filters.every(([key, value]) => row[key] === value));
                if (update) {
                    writes.push({ table, filters, update });
                    rows.forEach(row => Object.assign(row, update));
                }
                return Promise.resolve({ data: rows, error: null }).then(resolve);
            },
        };
        return query;
    });
});

test.each([
    ['New', 'New'], ['Contacted', 'Attempted Contact'], ['Showing', 'Active'], ['Offer', 'Offer'], ['Closed', 'Closed'],
])('direct lead %s survives write and reload', async (stage, lifecycle) => {
    await repo.updateLeadMetadata('lead1', 'agent1', stage);
    expect(direct[0].lifecycle_status).toBe(lifecycle);
    expect((await repo.getAgentLeads('agent1'))[0].lead_status).toBe(stage);
});

test('another agent cannot update or read a direct lead', async () => {
    await repo.updateLeadMetadata('lead1', 'agent2', 'Offer');
    expect(direct[0].lifecycle_status).toBe('New');
    expect(await repo.getAgentLeads('agent2')).toEqual([]);
    expect(writes.find(w => w.table === 'leads').filters).toContainEqual(['assigned_agent_id', 'agent2']);
});

test('conversation Offer keeps its existing status and ownership path', async () => {
    conversations = [{ id: 'conv1', seller_id: 'agent1', lead_status: 'Showing' }];
    await repo.updateLeadMetadata('conv1', 'agent1', 'Offer', 'Soon', true);
    expect(conversations[0]).toMatchObject({ lead_status: 'Offer', timeframe: 'Soon', pre_approved: true });
    expect(writes.some(w => w.table === 'leads')).toBe(false);
    expect((await repo.getAgentLeads('agent1')).find(l => l.id === 'conv1').lead_status).toBe('Offer');
});
