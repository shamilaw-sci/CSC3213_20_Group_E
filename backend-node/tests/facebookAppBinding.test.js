jest.mock('axios',()=>({get:jest.fn()}));
jest.mock('../config/supabase',()=>({from:jest.fn().mockReturnThis(),select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),maybeSingle:jest.fn()}));
jest.mock('../utils/emailService',()=>({sendWelcomeEmail:jest.fn().mockResolvedValue()}));
const axios=require('axios'),db=require('../config/supabase');
const {facebookLogin}=require('../controllers/socialAuthController');
const previous={id:process.env.FACEBOOK_APP_ID,secret:process.env.FACEBOOK_APP_SECRET};
const future=()=>Math.floor(Date.now()/1000)+3600;
const valid=()=>({is_valid:true,app_id:'123456',type:'USER',user_id:'subject-1',expires_at:future()});
let metadata,profile,res;
beforeEach(()=>{
    jest.clearAllMocks();process.env.FACEBOOK_APP_ID='123456';process.env.FACEBOOK_APP_SECRET='synthetic-secret';
    metadata=valid();profile={id:'subject-1',email:'owner@example.test',name:'Synthetic'};
    axios.get.mockImplementation(async url=>({data:url.includes('debug_token')?{data:metadata}:profile}));
    db.maybeSingle.mockResolvedValue({data:{id:'user-1',role:'BUYER',email:profile.email,password_hash:null},error:null});
    res={status:jest.fn().mockReturnThis(),json:jest.fn(),cookie:jest.fn()};
    jest.spyOn(console,'error').mockImplementation(()=>{});
});
afterEach(()=>{jest.restoreAllMocks();for(const [key,value]of [['FACEBOOK_APP_ID',previous.id],['FACEBOOK_APP_SECRET',previous.secret]]){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
}});
const invoke=()=>facebookLogin({body:{accessToken:'synthetic-token'}},res,jest.fn());
const denied=()=>{expect(res.cookie).not.toHaveBeenCalled();expect(db.from).not.toHaveBeenCalled();};
test.each([undefined,'',' ','not-numeric','1'.repeat(33)])('invalid app ID %# returns503 before provider',async value=>{
    if(value===undefined)delete process.env.FACEBOOK_APP_ID;else process.env.FACEBOOK_APP_ID=value;
    await invoke();expect(res.status).toHaveBeenCalledWith(503);expect(axios.get).not.toHaveBeenCalled();denied();
});
test.each([undefined,'',' ','x'.repeat(1025)])('missing/oversized secret %# returns503',async value=>{
    if(value===undefined)delete process.env.FACEBOOK_APP_SECRET;else process.env.FACEBOOK_APP_SECRET=value;
    await invoke();expect(res.status).toHaveBeenCalledWith(503);expect(axios.get).not.toHaveBeenCalled();denied();
});
test.each([null,[],{}, {app_id:'other'}, {app_id:123456}, {is_valid:false}, {is_valid:'true'},
    {type:'PAGE'},{type:'APP'},{type:'SYSTEM_USER'},{user_id:''},{user_id:null},{user_id:42},
    {expires_at:0},{expires_at:1},{expires_at:Infinity},{expires_at:'9999999999'},{expires_at:undefined},
    {data_access_expires_at:1},{data_access_expires_at:0},{data_access_expires_at:'9999999999'}])('bad metadata %# rejects before profile/DB',async value=>{
    metadata=value===null||Array.isArray(value)?value:Object.keys(value).length?{...valid(),...value}:{};
    await invoke();expect(res.status).toHaveBeenCalledWith(401);denied();
    expect(axios.get).toHaveBeenCalledTimes(1);expect(axios.get.mock.calls[0][0]).toContain('/debug_token');
});
test.each([{id:'different'}, {id:undefined},{email:''},{email:null}])('profile mismatch/missing identity %# rejects',async overrides=>{
    profile={...profile,...overrides};await invoke();expect(res.status).toHaveBeenCalledWith(401);denied();
});
test('valid inspection uses configured app, bounded no-redirect transport and existing session contract',async()=>{
    process.env.FACEBOOK_APP_ID=' 123456 ';process.env.FACEBOOK_APP_SECRET=' synthetic-secret ';
    metadata.data_access_expires_at=future();await invoke();
    expect(res.status).toHaveBeenCalledWith(200);expect(res.cookie).toHaveBeenCalledWith('token',expect.any(String),expect.objectContaining({httpOnly:true}));
    expect(axios.get).toHaveBeenNthCalledWith(1,'https://graph.facebook.com/debug_token',{
        params:{input_token:'synthetic-token',access_token:'123456|synthetic-secret'},timeout:5000,maxRedirects:0});
    expect(axios.get).toHaveBeenNthCalledWith(2,'https://graph.facebook.com/me',expect.objectContaining({timeout:5000,maxRedirects:0}));
    expect(JSON.stringify(res.json.mock.calls)).not.toMatch(/password_hash|credential_version|synthetic-secret/);
});
test.each([1,2])('provider error at call%s cannot leak credential markers',async stage=>{
    const error=Object.assign(new Error('synthetic-private-marker'),{response:{data:'synthetic-private-marker'}});
    if(stage===1)axios.get.mockRejectedValueOnce(error);
    else axios.get.mockResolvedValueOnce({data:{data:valid()}}).mockRejectedValueOnce(error);
    await invoke();expect(res.status).toHaveBeenCalledWith(401);denied();
    expect(JSON.stringify([...console.error.mock.calls,...res.json.mock.calls])).not.toContain('synthetic-private-marker');
});
