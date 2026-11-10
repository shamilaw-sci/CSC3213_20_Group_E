const request=require('supertest');
jest.mock('../config/supabase',()=>({from:jest.fn()}));
jest.mock('@supabase/supabase-js',()=>({createClient:jest.fn(()=>({}))}));
jest.mock('../utils/emailService',()=>({}));
jest.mock('dotenv',()=>({config:()=>({})}));
const db=require('../config/supabase'),app=require('../server');
beforeEach(()=>jest.clearAllMocks());
test('actual public readiness registration uses the canonical handler and no returned rows',async()=>{
 const query={select:jest.fn().mockReturnThis(),limit:jest.fn().mockReturnThis(),abortSignal:jest.fn().mockResolvedValue({error:null,status:200,data:null})};
 db.from.mockReturnValue(query);
 const res=await request(app).get('/health/ready');expect(res.status).toBe(200);expect(res.body.status).toBe('ready');expect(res.body.data).toBeUndefined();
 expect(db.from).toHaveBeenCalledWith('platform_settings');expect(query.limit).toHaveBeenCalledWith(1);
});
test('actual public failure is safe and liveness remains independent',async()=>{
 const query={select:jest.fn().mockReturnThis(),limit:jest.fn().mockReturnThis(),abortSignal:jest.fn().mockRejectedValue(new Error('private-db-host'))};
 db.from.mockReturnValue(query);
 const failed=await request(app).get('/health/ready');expect(failed.status).toBe(503);expect(JSON.stringify(failed.body)).not.toContain('private-db-host');
 expect((await request(app).get('/health')).status).toBe(200);
});
