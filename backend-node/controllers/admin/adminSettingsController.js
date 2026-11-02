const adminRepository = require('../../repositories/adminRepository');

const getSettings = async(req, res, next) => {
    try {
        const data = await adminRepository.getPlatformSettings();

        const settings = {};
        if (data) {
            data.forEach(item => {
                settings[item.setting_key] = item.setting_value;
            });
        }
        if (!settings['listing_fee']) settings['listing_fee'] = '500';

        res.status(200).json({ settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async(req, res, next) => {
    try {
        const { listing_fee } = req.body;
        if (listing_fee) {
            await adminRepository.updatePlatformSetting('listing_fee', listing_fee);
        }
        res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSettings, updateSettings };
