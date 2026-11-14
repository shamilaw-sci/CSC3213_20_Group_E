jest.mock('../repositories/sellerActivityRepository', () => ({ getActivity: jest.fn() }));
const repo = require('../repositories/sellerActivityRepository');
const { getSellerActivity } = require('../controllers/property/sellerActivityController');
const response=()=>({status:jest.fn().mockReturnThis(),json:jest.fn()});
beforeEach(()=>jest.clearAllMocks());
test.each(['BUYER','AGENT','ADMIN'])('rejects %s without loading another seller activity',async role=>{
 const res=response();await getSellerActivity({user:{id:'user',role},query:{seller_id:'other'}},res,jest.fn());
 expect(res.status).toHaveBeenCalledWith(403);expect(repo.getActivity).not.toHaveBeenCalled();
});
test('uses authenticated seller identity, ignoring client seller id',async()=>{
 repo.getActivity.mockResolvedValue({views:[],inquiries:[],trackingStartedAt:'2026-11-14T00:00:00Z'});
 const res=response(),next=jest.fn();await getSellerActivity({user:{id:'seller',role:'SELLER'},query:{seller_id:'other'}},res,next);
 expect(repo.getActivity).toHaveBeenCalledWith('seller',expect.any(Object));expect(next).not.toHaveBeenCalled();
 expect(res.json).toHaveBeenCalledWith(expect.objectContaining({days:expect.any(Array)}));
});
test('database failure forwards error without returning fabricated zeros',async()=>{
 const error=new Error('unavailable');repo.getActivity.mockRejectedValue(error);const next=jest.fn(),res=response();
 await getSellerActivity({user:{id:'seller',role:'SELLER'}},res,next);expect(next).toHaveBeenCalledWith(error);expect(res.json).not.toHaveBeenCalled();
});
