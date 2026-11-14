const handler=require('../middleware/errorHandler');
const response=()=>({status:jest.fn().mockReturnThis(),json:jest.fn()});
let log;
beforeEach(()=>{log=jest.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>jest.restoreAllMocks());
test.each(['production','development'])('unknown %s error never exposes private text',env=>{
 const old=process.env.NODE_ENV;process.env.NODE_ENV=env;
 try{const res=response();handler(Object.assign(new Error('private-marker'),{statusCode:503}),{method:'GET',originalUrl:'/private-marker',route:{path:'/safe/:id'}},res,jest.fn());
 expect(res.status).toHaveBeenCalledWith(500);expect(res.json).toHaveBeenCalledWith({message:'Internal Server Error',stack:null});expect(JSON.stringify(log.mock.calls)).not.toContain('private-marker');}finally{process.env.NODE_ENV=old;}
});
test.each([
 [{name:'MulterError',code:'OTHER',message:'private-marker'},400,'Upload rejected.'],
 [{name:'MulterError',code:'LIMIT_UNEXPECTED_FILE',field:'private-marker'},400,'Unexpected upload field.'],
 [{type:'entity.parse.failed',status:400,message:'private-marker'},400,'Invalid JSON body.'],
 [{type:'entity.too.large',status:413,message:'private-marker'},413,'Request body is too large.']
])('safe mapped response %#', (error,status,message)=>{
 const res=response();handler(error,{},res,jest.fn());expect(res.status).toHaveBeenCalledWith(status);expect(res.json).toHaveBeenCalledWith({message,stack:null});expect(JSON.stringify(log.mock.calls)).not.toContain('private-marker');
});
test('registered request logger excludes private URL/path/query/header/body markers',()=>{
 const fs=require('node:fs'),vm=require('node:vm');const source=fs.readFileSync(require.resolve('../server'),'utf8');let middleware,finish;
 const fragment=source.slice(source.indexOf('// Lightweight production request logger'),source.indexOf('// Rate Limiting for Auth Routes'));
 const out=[];const capture=(...v)=>out.push(v);
 vm.runInNewContext(fragment,{app:{use(fn){middleware=fn;}},Date,console:{log:capture,warn:capture,error:capture},require:name=>{if(name==='./middleware/requestLogger')return require('../middleware/requestLogger');throw Error('Unexpected import');}});
 const spy=jest.spyOn(console,'log').mockImplementation(capture);
 try{middleware({method:'GET',path:'/items/private-marker',originalUrl:'/items/private-marker?token=private-marker',headers:{authorization:'private-marker'},body:{secret:'private-marker'},route:{path:'/items/:id'}},{statusCode:200,on(_event,fn){finish=fn;}},()=>{});finish();expect(JSON.stringify(out)).not.toContain('private-marker');}finally{spy.mockRestore();}
});
