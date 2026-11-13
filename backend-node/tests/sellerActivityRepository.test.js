jest.mock('../config/supabase',()=>({from:jest.fn()}));
const db=require('../config/supabase');
const {getActivity}=require('../repositories/sellerActivityRepository');
let queries;
beforeEach(()=>{
 queries=[];db.from.mockImplementation(table=>{
  const q={table,select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),is:jest.fn().mockReturnThis(),gte:jest.fn().mockReturnThis(),lte:jest.fn().mockReturnThis(),lt:jest.fn().mockReturnThis(),order:jest.fn().mockReturnThis(),single:jest.fn().mockResolvedValue({data:{started_at:'2026-11-14T00:00:00Z'},error:null}),range:jest.fn().mockImplementation(async offset=>({data:offset===0?(table==='property_view_days'?[{view_date:'2026-11-14',views:1}]:[{id:'thread',created_at:'2026-11-14T00:00:00Z'}]):[],error:null}))};
  queries.push(q);return q;
 });
});
const window={startDate:'2026-11-01',today:'2026-11-14',startInstant:'2026-10-31T18:30:00Z',endInstant:'2026-11-14T18:30:00Z'};
test('scopes both property activity reads to active owned inventory and paginates to empty page',async()=>{
 const result=await getActivity('seller',window);
 const rows=queries.filter(q=>q.table!=='property_activity_tracking');
 for(const q of rows){expect(q.eq).toHaveBeenCalledWith('properties.seller_id','seller');expect(q.is).toHaveBeenCalledWith('properties.deleted_at',null);}
 expect(rows.find(q=>q.table==='conversations').eq).toHaveBeenCalledWith('seller_id','seller');
 expect(rows.find(q=>q.table==='conversations').eq).toHaveBeenCalledWith('type','property');
 expect(rows.some(q=>q.range.mock.calls.some(([offset])=>offset===1))).toBe(true);
 expect(result.views).toHaveLength(1);expect(result.inquiries).toHaveLength(1);
});
test('read errors propagate rather than produce empty chart data',async()=>{
 const original=db.from.getMockImplementation();
 db.from.mockImplementation(table=>{const q=original(table);if(table==='property_activity_tracking')q.single.mockResolvedValue({data:null,error:new Error('missing tracking table')});return q;});
 await expect(getActivity('seller',window)).rejects.toThrow('missing tracking table');
});
