const MAX_AVATAR_BYTES=3*1024*1024;
const invalid=()=>{const error=new Error('Invalid profile input.');error.statusCode=400;throw error;};
function parseProfileInput(body){
    if(!body || typeof body!=='object' || Array.isArray(body)
        || ![Object.prototype,null].includes(Object.getPrototypeOf(body)))invalid();
    const fields={};
    for(const [key,max] of Object.entries({name:255,email:254,phone:20,password:1024,currentPassword:1024})){
        if(body[key]===undefined)continue;
        if(key==='phone' && body[key]===null){fields[key]=null;continue;}
        if(typeof body[key]!=='string' || body[key].length>max)invalid();
        fields[key]=['name','email'].includes(key)?body[key].trim():body[key];
        if(['name','email'].includes(key)&&!fields[key])invalid();
    }
    if(fields.email!==undefined){fields.email=fields.email.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))invalid();}
    if(fields.password && (fields.password.length<6 || !fields.currentPassword))invalid();
    if(body.theme_preference!==undefined){if(!['light','dark','system'].includes(body.theme_preference))invalid();fields.theme_preference=body.theme_preference;}
    if(body.email_notifications!==undefined){if(typeof body.email_notifications!=='boolean')invalid();fields.email_notifications=body.email_notifications;}
    let avatar;
    if(body.avatar_url!==undefined){
        const value=body.avatar_url;
        if(value===null || value==='')fields.avatar_url=value;
        else if(typeof value!=='string')invalid();
        else if(value.startsWith('data:')){
            if(value.length>4*Math.ceil(MAX_AVATAR_BYTES/3)+40)invalid();
            const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
            if(!match || match[2].length%4!==0)invalid();
            const bytes=Buffer.from(match[2],'base64');
            if(!bytes.length || bytes.length>MAX_AVATAR_BYTES || bytes.toString('base64')!==match[2])invalid();
            const type=match[1];
            const valid=type==='png'?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))
                :type==='jpeg'?bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255
                :bytes.length>=12&&bytes.subarray(0,4).equals(Buffer.from('RIFF'))&&bytes.subarray(8,12).equals(Buffer.from('WEBP'));
            if(!valid)invalid();
            avatar={bytes,mime:`image/${type}`,extension:type==='jpeg'?'jpg':type};
        }else{
            if(value.length>2048 || value.includes('\\') || /[\u0000-\u0020]/.test(value))invalid();
            let url;try{url=new URL(value);}catch{invalid();}
            if(!['http:','https:'].includes(url.protocol)||url.username||url.password)invalid();
            fields.avatar_url=value;
        }
    }
    return {fields,avatar};
}
module.exports={parseProfileInput,MAX_AVATAR_BYTES};
