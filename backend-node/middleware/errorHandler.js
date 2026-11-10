const {publicErrorDetails}=require('../utils/publicError');
const {safeRequestContext}=require('./requestLogger');
const uploadMessages={LIMIT_FILE_SIZE:'Uploaded file is too large. Max allowed size exceeded.',LIMIT_FILE_COUNT:'Too many files uploaded at once.',LIMIT_UNEXPECTED_FILE:'Unexpected upload field.'};
const errorHandler=(err,req,res,_next)=>{
    const safe=publicErrorDetails(err);
    let status=safe?.status||500,message=safe?.message||'Internal Server Error',code=safe?.code||'INTERNAL_ERROR';
    if(!safe){
        if(err?.name==='MulterError'){
            status=400;message=typeof err.code==='string'&&Object.hasOwn(uploadMessages,err.code)?uploadMessages[err.code]:'Upload rejected.';code='UPLOAD_REJECTED';
        }else if(err?.code==='INVALID_FILE_TYPE'){
            status=400;message='Unsupported file type.';code='UPLOAD_TYPE';
        }else if(err?.type==='entity.parse.failed'){
            status=400;message='Invalid JSON body.';code='INVALID_JSON';
        }else if(err?.type==='entity.too.large'){
            status=413;message='Request body is too large.';code='BODY_TOO_LARGE';
        }
    }
    console.error('request_error',{...safeRequestContext(req,status),code});
    return res.status(status).json({message,stack:null});
};
module.exports=errorHandler;
