jest.mock('../config/supabase',()=>({from:jest.fn()}));
const db=require('../config/supabase');
const repo=require('../repositories/agentRepository');
let conversations,bookings,directError;
beforeEach(()=>{
 directError=null;
 conversations=[{id:'chat',type:'agent',buyer_id:'buyer',seller_id:'agent',property_id:'house',lead_status:'Showing',buyer:{id:'buyer',name:'Buyer'}},{id:'other-chat',type:'agent',buyer_id:'other',property_id:'house'}];
 bookings=[{lead_id:'booking1',buyer_id:'buyer',property_id:'house',lifecycle_status:'New'},{lead_id:'booking2',buyer_id:'buyer',property_id:'house',lifecycle_status:'Active'},{lead_id:'different-property',buyer_id:'buyer',property_id:'land',lifecycle_status:'New'},{lead_id:'guest',buyer_id:null,property_id:'house',client_email:'buyer@example.test'}];
 db.from.mockImplementation(table=>{const q={select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),in:jest.fn().mockReturnThis(),order:jest.fn().mockReturnThis(),then:resolve=>Promise.resolve({data:table==='conversations'?conversations:table==='leads'?bookings:[],error:table==='leads'?directError:null}).then(resolve)};return q;});
});
test('each booking remains once while its verified conversation is represented by the booking',async()=>{
 const leads=await repo.getAgentLeads('agent');
 expect(leads.map(l=>l.id).sort()).toEqual(['booking1','booking2','different-property','guest','other-chat'].sort());
 expect(leads.find(l=>l.id==='booking1')).toMatchObject({conversation_id:'chat',buyer_id:'buyer',lead_status:'New'});
 expect(leads.find(l=>l.id==='booking2')).toMatchObject({conversation_id:'chat',lead_status:'Showing'});
 expect(leads.find(l=>l.id==='guest').conversation_id).toBeNull();
 expect(leads.find(l=>l.id==='different-property').conversation_id).toBeNull();
});
test('unmatched actual conversations remain usable and carry explicit conversation identity',async()=>{
 bookings=[];const leads=await repo.getAgentLeads('agent');expect(leads.find(l=>l.id==='chat').conversation_id).toBe('chat');
});

test('property inquiry cannot replace the agent booking conversation for the same buyer/property',async()=>{
 conversations.unshift({id:'property-chat',type:'property',buyer_id:'buyer',property_id:'house'});
 const leads=await repo.getAgentLeads('agent');
 expect(leads.find(l=>l.id==='booking1').conversation_id).toBe('chat');
 expect(leads.find(l=>l.id==='property-chat').conversation_id).toBe('property-chat');
});

test('lead retrieval failure cannot silently return conversation-only CRM',async()=>{directError=new Error('lead read unavailable');await expect(repo.getAgentLeads('agent')).rejects.toThrow('lead read unavailable');});
