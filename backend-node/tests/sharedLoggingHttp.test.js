const express=require('express'),request=require('supertest');
const requestLogger=require('../middleware/requestLogger'),handler=require('../middleware/errorHandler');
const {publicError}=require('../utils/publicError');
let logs,app;
beforeEach(()=>{
 logs=[];for(const name of ['log','warn','error'])jest.spyOn(console,name).mockImplementation((...v)=>logs.push(v));
 app=express();app.use(requestLogger);app.use(express.json({limit:'1kb'}));
 app.post('/items/:id',(req,res)=>res.json({ok:true}));
 app.get('/health',(_req,res)=>res.json({ok:true}));
 app.get('/owned',(_req,_res,next)=>{const error=publicError('AI_UNAVAILABLE');error.message='private-marker';error.statusCode=418;next(error);});
 app.get('/forged',(_req,_res,next)=>next(Object.assign(new Error('private-marker'),{code:'AI_UNAVAILABLE',statusCode:503})));
 app.use(handler);
});
afterEach(()=>jest.restoreAllMocks());
test('HTTP logs route template, never private path/query/header/body',async()=>{
 expect((await request(app).post('/items/private-marker?token=private-marker').set('Authorization','Bearer private-marker').send({password:'private-marker'})).status).toBe(200);
 expect(logs).toContainEqual(['http_request',expect.objectContaining({method:'POST',route:'/items/:id',status:200})]);
 expect(JSON.stringify(logs)).not.toContain('private-marker');
});
test('unmatched request markers are not logged',async()=>{expect((await request(app).get('/private-marker?secret=private-marker')).status).toBe(404);expect(JSON.stringify(logs)).not.toContain('private-marker');expect(logs[0][1].route).toBe('unmatched');});
test('successful health probe is not logged',async()=>{expect((await request(app).get('/health')).status).toBe(200);expect(logs).toEqual([]);});
test('owned public metadata survives forged instance fields; cloned error is not owned',async()=>{
 const owned=await request(app).get('/owned');expect(owned.status).toBe(503);expect(owned.body).toEqual({message:'AI chat is temporarily unavailable.',stack:null});
 const forged=await request(app).get('/forged');expect(forged.status).toBe(500);expect(forged.body).toEqual({message:'Internal Server Error',stack:null});expect(JSON.stringify(logs)).not.toContain('private-marker');
});
test('actual malformed JSON and size failures expose no body excerpts',async()=>{
 const invalid=await request(app).post('/items/private-marker').set('Content-Type','application/json').send('{"private-marker":');expect(invalid.status).toBe(400);expect(invalid.body).toEqual({message:'Invalid JSON body.',stack:null});
 const large=await request(app).post('/items/private-marker').send({value:'private-marker'.repeat(200)});expect(large.status).toBe(413);expect(large.body).toEqual({message:'Request body is too large.',stack:null});expect(JSON.stringify(logs)).not.toContain('private-marker');
});
