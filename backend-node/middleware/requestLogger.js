const methods=new Set(['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS']);
function safeRequestContext(req={},status){
    const route=req.route?.path;
    return {method:methods.has(req.method)?req.method:'OTHER',
        route:typeof route==='string' && route.length<=200?route:'unmatched',
        status:Number.isInteger(status)&&status>=100&&status<=599?status:500};
}
function requestLogger(req,res,next){
    const start=Date.now();
    res.on('finish',()=>{
        const context=safeRequestContext(req,res.statusCode);
        if((context.route==='/health'||context.route==='/health/ready')&&context.status<400)return;
        const log=context.status>=500?console.error:context.status>=400?console.warn:console.log;
        log('http_request',{...context,durationMs:Math.max(0,Date.now()-start)});
    });
    next();
}
module.exports=requestLogger;
module.exports.safeRequestContext=safeRequestContext;
