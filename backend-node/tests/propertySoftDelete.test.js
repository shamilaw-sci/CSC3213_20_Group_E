jest.mock('../config/supabase', () => ({ from: jest.fn() }));
const db = require('../config/supabase');
const repo = require('../repositories/propertyRepository');
let rows, physicalDeletes;
beforeEach(() => {
 rows = [{ id: 'a', seller_id: 'owner', status: 'approved', deleted_at: null, payment_status: 'Paid' }, { id: 'b', seller_id: 'other', status: 'approved', deleted_at: null }];
 physicalDeletes = 0;
 db.from.mockImplementation(() => {
  const predicates=[]; let changes;
  const execute = () => {
   const matched=rows.filter(row => predicates.every(test => test(row)));
   if(changes) matched.forEach(row => Object.assign(row,changes));
   return {data:matched.map(row=>({...row})),error:null,count:matched.length};
  };
  const q={select:jest.fn().mockReturnThis(),update:jest.fn(value=>{changes=value;return q;}),delete:jest.fn(()=>{physicalDeletes++;return q;}),
   eq:jest.fn((key,value)=>{predicates.push(row=>row[key]===value);return q;}),
   is:jest.fn((key,value)=>{predicates.push(row=>row[key]===value);return q;}),
   order:jest.fn().mockReturnThis(),range:jest.fn().mockReturnThis(),
   single:jest.fn(async()=>{const r=execute();return {data:r.data[0]||null,error:null};}),
   maybeSingle:jest.fn(async()=>{const r=execute();return {data:r.data[0]||null,error:null};}),
   then:(resolve,reject)=>Promise.resolve(execute()).then(resolve,reject)};
  return q;
 });
});
test('archive retains paid row, hides active reads and remains idempotent for owner', async()=>{
 expect(await repo.deleteMyProperty('a','owner')).toBe(true);
 const stamp=rows[0].deleted_at;
 expect(stamp).toEqual(expect.any(String));
 expect(rows[0].payment_status).toBe('Paid');
 expect(physicalDeletes).toBe(0);
 expect(await repo.getPropertyById('a')).toBeNull();
 expect((await repo.getMyProperties('owner',0,49)).data).toEqual([]);
 expect((await repo.getProperties(0,49)).data.map(row=>row.id)).toEqual(['b']);
 expect(await repo.deleteMyProperty('a','owner')).toBe(true);
 expect(rows[0].deleted_at).toBe(stamp);
 expect(await repo.getPropertyById('a',{includeDeleted:true})).toMatchObject({payment_status:'Paid',deleted_at:stamp});
});
test('other Seller cannot archive or claim successful repeat deletion', async()=>{
 expect(await repo.deleteMyProperty('a','other')).toBe(false);
 expect(rows[0].deleted_at).toBeNull();
 await repo.deleteMyProperty('a','owner');
 expect(await repo.deleteMyProperty('a','other')).toBe(false);
});
