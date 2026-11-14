const { generateKeyPairSync } = require('node:crypto');
const jwt = require('jsonwebtoken');
jest.mock('../config/supabase',()=>({from:jest.fn().mockReturnThis(),select:jest.fn().mockReturnThis(),eq:jest.fn().mockReturnThis(),maybeSingle:jest.fn()}));
jest.mock('../utils/emailService',()=>({sendWelcomeEmail:jest.fn().mockResolvedValue()}));
const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const key={...publicKey.export({format:'jwk'}),kid:'synthetic-key'};
const body=JSON.stringify({keys:[key]});
const priorAudience=process.env.APPLE_SERVICES_ID;
let sdk,hook,fetchMock,handler,db,res;
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
const response=()=>({ok:true,status:200,statusText:'OK',headers:new Headers(),text:async()=>body});
beforeEach(()=>{
    jest.resetModules();jest.useFakeTimers({doNotFake:['nextTick','setImmediate']});
    process.env.APPLE_SERVICES_ID='synthetic-client';
    fetchMock=jest.spyOn(globalThis,'fetch').mockResolvedValue(response());
    sdk=require('apple-signin-auth');const setter=jest.spyOn(sdk,'_setFetch');
    handler=require('../controllers/socialAuthController').appleLogin;
    hook=setter.mock.calls[0]?.[0];
    db=require('../config/supabase');db.maybeSingle.mockResolvedValue({data:{id:'user-1',role:'BUYER',email:'owner@example.test',password_hash:null},error:null});
    res={status:jest.fn().mockReturnThis(),cookie:jest.fn(),json:jest.fn()};jest.spyOn(console,'error').mockImplementation(()=>{});
});
afterEach(()=>{jest.useRealTimers();jest.restoreAllMocks();if(priorAudience===undefined)delete process.env.APPLE_SERVICES_ID;else process.env.APPLE_SERVICES_ID=priorAudience;});
const invoke=()=>handler({body:{id_token:jwt.sign({sub:'subject',email:'owner@example.test',email_verified:true},privateKey,
    {algorithm:'RS256',keyid:'synthetic-key',audience:'synthetic-client',issuer:'https://appleid.apple.com',expiresIn:'1h'})}},res,jest.fn());
test('real SDK validates synthetic signed token and retains its key cache',async()=>{
    await invoke();expect(res.status).toHaveBeenCalledWith(200);expect(res.cookie).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('https://appleid.apple.com/auth/keys',expect.objectContaining({method:'GET',redirect:'error',signal:expect.any(AbortSignal)}));
    await invoke();expect(fetchMock).toHaveBeenCalledTimes(1);expect(jest.getTimerCount()).toBe(0);
});
test.each(['headers','body'])('stalled %s is actually aborted at5000ms before DB/session',async stage=>{
    let signal;
    fetchMock.mockImplementation((_url,options)=>{
        signal=options.signal;
        const pending=()=>new Promise((_resolve,reject)=>{
            if(!signal)return reject(new Error('Missing deadline signal'));
            signal.addEventListener('abort',()=>reject(new Error('private-transport-marker')),{once:true});
        });
        return stage==='headers'?pending():Promise.resolve({...response(),text:pending});
    });
    const task=invoke();await flush();
    await jest.advanceTimersByTimeAsync(4999);expect(res.status).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);await task;
    expect(signal.aborted).toBe(true);expect(res.status).toHaveBeenCalledWith(401);
    expect(db.from).not.toHaveBeenCalled();expect(res.cookie).not.toHaveBeenCalled();
    expect(JSON.stringify(console.error.mock.calls)).not.toContain('private-transport-marker');expect(jest.getTimerCount()).toBe(0);
});
test.each(['http://appleid.apple.com/auth/keys','https://other.example/auth/keys','https://appleid.apple.com/auth/token',
    'https://user:pass@appleid.apple.com/auth/keys','https://appleid.apple.com/auth/keys?x=1','https://appleid.apple.com/auth/keys#x'])('rejects unsupported target %# before fetch',async url=>{
    expect(hook).toEqual(expect.any(Function));await expect(hook(url,{method:'GET'})).rejects.toThrow();expect(fetchMock).not.toHaveBeenCalled();
});
test('rejects unsupported method and body',async()=>{
    expect(hook).toEqual(expect.any(Function));
    for(const options of [{method:'POST'},{method:'GET',body:'unexpected'}])await expect(hook('https://appleid.apple.com/auth/keys',options)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
});
test('caller cancellation aborts active native request and disposes listener/timer',async()=>{
    expect(hook).toEqual(expect.any(Function));const parent=new AbortController();const remove=jest.spyOn(parent.signal,'removeEventListener');let signal;
    fetchMock.mockImplementation((_url,options)=>{signal=options.signal;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('cancelled'))));});
    const task=hook('https://appleid.apple.com/auth/keys',{signal:parent.signal});const caught=task.catch(error=>error);
    await flush();parent.abort();expect(await caught).toBeInstanceOf(Error);expect(signal.aborted).toBe(true);
    expect(remove).toHaveBeenCalledWith('abort',expect.any(Function));expect(jest.getTimerCount()).toBe(0);
});
test('already cancelled caller never starts fetch',async()=>{
    expect(hook).toEqual(expect.any(Function));const parent=new AbortController();parent.abort();
    await expect(hook('https://appleid.apple.com/auth/keys',{signal:parent.signal})).rejects.toThrow();expect(fetchMock).not.toHaveBeenCalled();expect(jest.getTimerCount()).toBe(0);
});
test.each([{status:302,ok:false},{status:200,ok:true,redirected:true}])('redirect response %# fails closed',async overrides=>{
    expect(hook).toEqual(expect.any(Function));fetchMock.mockResolvedValue({...response(),...overrides});
    await expect(hook('https://appleid.apple.com/auth/keys')).rejects.toThrow();expect(jest.getTimerCount()).toBe(0);
});
test('response read failure disposes deadline',async()=>{
    expect(hook).toEqual(expect.any(Function));fetchMock.mockResolvedValue({...response(),text:async()=>{throw new Error('body failed');}});
    await expect(hook('https://appleid.apple.com/auth/keys')).rejects.toThrow();expect(jest.getTimerCount()).toBe(0);
});
