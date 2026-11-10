const owned=new WeakMap();
const definitions=Object.freeze({
    AI_UNAVAILABLE:Object.freeze({status:503,message:'AI chat is temporarily unavailable.',code:'AI_UNAVAILABLE'}),
    ACCOUNT_BANNED:Object.freeze({status:403,message:'Your account has been banned. Please contact support.',code:'ACCOUNT_BANNED'}),
    SOCIAL_LINK_CONFLICT:Object.freeze({status:403,message:'Social sign-in cannot link this account. Please use your original sign-in method.',code:'SOCIAL_LINK_CONFLICT'}),
    ADMIN_USER_NOT_FOUND:Object.freeze({status:404,message:'User not found.',code:'ADMIN_USER_NOT_FOUND'}),
    ADMIN_ROLE_PARTIAL:Object.freeze({status:409,message:'User role changed, but the agent profile update could not be confirmed. Refresh before retrying.',code:'ADMIN_ROLE_PARTIAL'}),
    SELLER_REQUEST_CONFLICT:Object.freeze({status:409,message:'Seller request could not be confirmed. Refresh before retrying.',code:'SELLER_REQUEST_CONFLICT'})
});
function publicError(code){
    if(!Object.hasOwn(definitions,code))throw new Error('Unknown public error code');
    const details=definitions[code],error=new Error(details.message);
    error.statusCode=details.status;owned.set(error,details);return error;
}
const publicErrorDetails=error=>error && (typeof error==='object'||typeof error==='function')?owned.get(error):undefined;
module.exports={publicError,publicErrorDetails};
