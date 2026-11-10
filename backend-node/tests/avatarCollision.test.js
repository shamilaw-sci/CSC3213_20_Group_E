jest.mock('../config/supabase',()=>({storage:{from:jest.fn()}}));
const db=require('../config/supabase'),repo=require('../repositories/userRepository');
test('an existing object cannot be overwritten by avatar upload',async()=>{
 let stored='original';
 db.storage.from.mockReturnValue({upload:async(_name,bytes,options)=>{
  if(!options.upsert)return {error:new Error('Synthetic collision')};stored=bytes.toString();return {error:null};
 },getPublicUrl:()=>({data:{publicUrl:'https://example.test/avatar'}})});
 await expect(repo.uploadAvatar('owned-existing.png',Buffer.from('replacement'),'image/png')).rejects.toThrow('Synthetic collision');
 expect(stored).toBe('original');
});
