const repository = require('../../repositories/sellerActivityRepository');
const {activityWindow,summarizeActivity} = require('../../utils/sellerActivity');
const getSellerActivity = async (req,res,next) => {
 if(req.user?.role!=='SELLER') return res.status(403).json({message:'Only sellers can view their listing activity.'});
 try {
  const window=activityWindow();
  const {views,inquiries,trackingStartedAt}=await repository.getActivity(req.user.id,window);
  res.json(summarizeActivity(window,views,inquiries,trackingStartedAt));
 } catch(error) { next(error); }
};
module.exports={getSellerActivity};
