jest.mock('../repositories/userRepository',()=>({findFullUserById:jest.fn(),findByEmail:jest.fn()}));
jest.mock('../utils/emailService',()=>({}));
jest.mock('../utils/emailVerification',()=>({enabled:()=>true,sendChallenge:jest.fn()}));
jest.mock('bcryptjs',()=>({compare:jest.fn().mockResolvedValue(false)}));
const repo=require('../repositories/userRepository');
const {updateProfile}=require('../controllers/authController');
test.each([[undefined,'Enter your current password to change your email.'],['wrong','Incorrect current password.']])('email change password feedback (%s)',async(currentPassword,message)=>{
 repo.findFullUserById.mockResolvedValue({id:'u1',email:'old@example.test',role:'BUYER',password_hash:'hash'});
 repo.findByEmail.mockResolvedValue(null);
 const res={status:jest.fn().mockReturnThis(),json:jest.fn()};
 await updateProfile({body:{email:'new@example.test',currentPassword},user:{id:'u1'}},res,jest.fn());
 expect(res.status).toHaveBeenCalledWith(400);expect(res.json).toHaveBeenCalledWith({message});
});
