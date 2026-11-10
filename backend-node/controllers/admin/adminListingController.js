const adminRepository = require('../../repositories/adminRepository');
const { sendListingStatusEmail } = require('../../utils/emailService');
const { checkSavedSearchMatches } = require('../savedSearchController');

const getListings = async(req, res, next) => {
    try {
        const listings = await adminRepository.getListings(req.query.status);
        res.status(200).json({ listings });
    } catch (error) {
        next(error);
    }
};

const getListingById = async(req, res, next) => {
    try {
        const listing = await adminRepository.getListingByIdWithTransactions(req.params.id);
        res.status(200).json({ listing });
    } catch (error) {
        console.error('admin_listing_lookup_failed');
        next(error);
    }
};

const approveListing = async(req, res, next) => {
    try {
        const data = await adminRepository.approveListingOnce(req.params.id);
        if (!data) {
            const existing = await adminRepository.getListingByIdWithTransactions(req.params.id);
            if (!existing) return res.status(404).json({ message: 'Listing not found' });
            return res.status(200).json({ message: 'Listing already approved' });
        }
        checkSavedSearchMatches(data).catch(error => console.error('saved_search_alerts_failed'));

        const sellerEmail = data ?.seller ?.email;
        const sellerName = data ?.seller ?.name || 'Seller';
        if (sellerEmail) {
            await sendListingStatusEmail(sellerEmail, sellerName, data.title, 'approved');
        }

        res.status(200).json({ message: "Listing approved successfully" });
    } catch (error) {
        next(error);
    }
};

const rejectListing = async(req, res, next) => {
    try {
        const { reason } = req.body;
        const data = await adminRepository.updateListingStatus(req.params.id, {
            status: 'rejected',
            rejection_reason: reason
        });

        const sellerEmail = data ?.seller ?.email;
        const sellerName = data ?.seller ?.name || 'Seller';
        if (sellerEmail) {
            await sendListingStatusEmail(sellerEmail, sellerName, data.title, 'rejected', reason);
        }

        res.status(200).json({ message: "Listing rejected successfully" });
    } catch (error) {
        next(error);
    }
};

const deleteListing = async(req, res, next) => {
    try {
        await adminRepository.deleteListing(req.params.id);
        res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getListings, getListingById, approveListing, rejectListing, deleteListing };
