const fs=require('node:fs'),vm=require('node:vm');
// Exercise current registration before extraction, without loading config/dotenv.
function currentHandler(db){
 const source=fs.readFileSync(require.resolve('../server'),'utf8');
 const fragment=source.slice(source.indexOf("app.get('/health/ready'"),source.indexOf('// Global Error Handler'));
 let handler;vm.runInNewContext(fragment,{app:{get:(_path,fn)=>{handler=fn;}},supabase:db,Date,require:name=>{if(name==='./controllers/healthController')return require('../controllers/healthController');throw Error('Unexpected dependency');}});return handler;
}
const response=()=>({status:jest.fn().mockReturnThis(),json:jest.fn()});
let db,query,signal;
beforeEach(()=>{
 signal=undefined;
 query={select:jest.fn().mockReturnThis(),limit:jest.fn().mockReturnThis(),abortSignal:jest.fn(s=>{signal=s;return query;}),then:jest.fn(resolve=>Promise.resolve({error:null,status:200,data:null}).then(resolve))};
 db={from:jest.fn(()=>query)};
});
afterEach(()=>jest.useRealTimers());
test('canonical bounded HEAD probe accepts an empty table',async()=>{
 const res=response();await currentHandler(db)({},res);
 expect(db.from).toHaveBeenCalledWith('platform_settings');expect(query.select).toHaveBeenCalledWith('id',{head:true});expect(query.limit).toHaveBeenCalledWith(1);
 expect(res.status).toHaveBeenCalledWith(200);expect(res.json).toHaveBeenCalledWith(expect.objectContaining({status:'ready',database:'connected'}));
});
test.each(['returned','thrown'])('%s private errors are not exposed',async kind=>{
 query.then.mockImplementation((resolve,reject)=>kind==='returned'?Promise.resolve({error:{message:'private-host-schema'},status:500}).then(resolve,reject):Promise.reject(new Error('private-host-schema')).then(resolve,reject));
 const res=response();await currentHandler(db)({},res);
 expect(res.status).toHaveBeenCalledWith(503);expect(res.json).toHaveBeenCalledWith(expect.objectContaining({database:'unavailable',error:'Database readiness unavailable.'}));
 expect(JSON.stringify(res.json.mock.calls)).not.toContain('private-host-schema');
});
test.each([undefined,null,{}, {error:null},{error:null,status:500},{status:200},{error:undefined,status:200},{error:null,status:'200'}])('malformed result %p fails closed',async result=>{
 query.then.mockImplementation((resolve,reject)=>Promise.resolve(result).then(resolve,reject));const res=response();await currentHandler(db)({},res);expect(res.status).toHaveBeenCalledWith(503);
});
test('transport receives real abort at five seconds and timer is cleared',async()=>{
 jest.useFakeTimers();
 query.then.mockImplementation((resolve,reject)=>new Promise((yes,no)=>signal.addEventListener('abort',()=>no(new Error('private timeout')),{once:true})).then(resolve,reject));
 const res=response(),pending=currentHandler(db)({},res);await Promise.resolve();await Promise.resolve();
 expect(signal).toBeDefined();await jest.advanceTimersByTimeAsync(4999);expect(signal.aborted).toBe(false);expect(res.status).not.toHaveBeenCalled();
 await jest.advanceTimersByTimeAsync(1);await pending;expect(signal.aborted).toBe(true);expect(res.status).toHaveBeenCalledWith(503);expect(jest.getTimerCount()).toBe(0);
});
test('late transport success after abort is not ready',async()=>{
 jest.useFakeTimers();let finish;
 query.then.mockImplementation((resolve,reject)=>new Promise(yes=>{finish=yes;}).then(resolve,reject));
 const res=response(),pending=currentHandler(db)({},res);await Promise.resolve();await Promise.resolve();await jest.advanceTimersByTimeAsync(5000);
 finish({error:null,status:200});await pending;expect(res.status).toHaveBeenCalledWith(503);expect(jest.getTimerCount()).toBe(0);
});
test('successful settlement clears its deadline',async()=>{jest.useFakeTimers();await currentHandler(db)({},response());expect(jest.getTimerCount()).toBe(0);});
