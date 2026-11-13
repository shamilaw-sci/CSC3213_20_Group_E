const db = require('../config/supabase');
async function readAll(buildQuery) {
 const result=[];
 for(let offset=0;;) {
  const {data,error}=await buildQuery().range(offset,offset+499);
  if(error) throw error;
  if(!Array.isArray(data)) throw new Error('Activity read unavailable');
  if(!data.length) return result;
  result.push(...data); offset+=data.length;
 }
}
async function getActivity(sellerId,window) {
 const [tracking,views,inquiries]=await Promise.all([
  db.from('property_activity_tracking').select('started_at').eq('id',true).single(),
  readAll(()=>db.from('property_view_days').select('view_date,views,properties!inner(seller_id,deleted_at)')
   .eq('properties.seller_id',sellerId).is('properties.deleted_at',null)
   .gte('view_date',window.startDate).lte('view_date',window.today).order('property_id').order('view_date')),
  readAll(()=>db.from('conversations').select('id,created_at,properties!inner(seller_id,deleted_at)')
   .eq('seller_id',sellerId).eq('properties.seller_id',sellerId).eq('type','property').is('properties.deleted_at',null)
   .gte('created_at',window.startInstant).lt('created_at',window.endInstant).order('id')),
 ]);
 if(tracking.error) throw tracking.error;
 return {views,inquiries,trackingStartedAt:tracking.data?.started_at};
}
module.exports={getActivity};
