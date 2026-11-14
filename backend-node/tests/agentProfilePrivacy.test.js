const express = require('express');
const request = require('supertest');

jest.mock('../config/supabase', () => ({}));
jest.mock('../repositories/agentRepository', () => ({ getAgentProfile: jest.fn() }));

const agentRepository = require('../repositories/agentRepository');
const { getAgentProfile } = require('../controllers/agentController');
const app = express();
app.get('/agents/:id', getAgentProfile);

describe('Public agent profile privacy', () => {
    beforeEach(() => jest.clearAllMocks());

    test.each(['BUYER', 'SELLER', 'ADMIN', 'PENDING_AGENT', 'REJECTED_AGENT', 'BANNED'])(
        'does not expose a %s account through an agent profile URL', async (role) => {
            agentRepository.getAgentProfile.mockResolvedValue({
                id: 'private-user', role, email: 'private@example.test', phone: '0000000000',
            });
            const response = await request(app).get('/agents/private-user');
            expect(response.status).toBe(404);
            expect(response.body.agent).toBeUndefined();
            expect(JSON.stringify(response.body)).not.toContain('private@example.test');
        }
    );

    test('preserves approved agent profiles and only includes approved properties', async () => {
        agentRepository.getAgentProfile.mockResolvedValue({
            id: 'agent-1', role: 'AGENT', name: 'Public Agent',
            properties: [{ id: 'live', status: 'approved' }, { id: 'draft', status: 'pending' }],
        });
        const response = await request(app).get('/agents/agent-1');
        expect(response.status).toBe(200);
        expect(response.body.agent.name).toBe('Public Agent');
        expect(response.body.agent.properties).toEqual([{ id: 'live', status: 'approved' }]);
    });

    test('preserves the not-found response', async () => {
        agentRepository.getAgentProfile.mockResolvedValue(null);
        const response = await request(app).get('/agents/missing');
        expect(response.status).toBe(404);
    });
});
