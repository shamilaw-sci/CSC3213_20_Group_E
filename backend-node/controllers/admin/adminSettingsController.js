const adminRepository = require('../../repositories/adminRepository');
const { parseListingFee } = require('../../validators/listingFee');

const getSettings = async(req, res, next) => {
    try {
        const data = await adminRepository.getPlatformSettings();

        const settings = { listing_fee: data === null ? '500.00' : parseListingFee(data.setting_value) };

        res.status(200).json({ settings, source: data === null ? 'configured_default' : 'database' });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async(req, res, next) => {
    try {
        let fee;
        try {
            if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)
                || ![Object.prototype, null].includes(Object.getPrototypeOf(req.body))) throw new Error('Invalid settings.');
            fee = parseListingFee(req.body.listing_fee);
        } catch {
            return res.status(400).json({ message: 'Enter a valid positive listing fee with at most two decimal places.' });
        }
        await adminRepository.updatePlatformSetting('listing_fee', fee);
        res.status(200).json({ message: 'Listing fee saved.', settings: { listing_fee: fee } });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSettings, updateSettings };
