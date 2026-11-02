const propertyRepository = require('../../repositories/propertyRepository');

const addProperty = async(req, res, next) => {
    let uploadedFiles = [];
    try {
        const {
            type,
            listingType,
            title,
            description,
            price,
            pricePeriod,
            address,
            district,
            city,
            contactNumber,
            bedrooms,
            bathrooms,
            landSize,
            houseSize,
            latitude,
            longitude,
            boundary,
        } = req.body;

        if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
            return res.status(403).json({ error: "Access denied. Only Sellers and Agents can add properties." });
        }

        
        const files = req.files || {};
        const imageFiles = files.images || [];
        const virtualTourFiles = files.virtualTours || [];
        
        let imageUrls = [];
        let virtualTourUrls = [];

        if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(async (file) => {
                const fileExt = file.originalname.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `${req.user.id}/${fileName}`;
                uploadedFiles.push(filePath);
                return await propertyRepository.uploadImage(filePath, file.buffer, file.mimetype);
            });
            imageUrls = await Promise.all(uploadPromises);
        }

        if (virtualTourFiles.length > 0) {
            const uploadPromises = virtualTourFiles.map(async (file) => {
                const fileExt = file.originalname.split('.').pop();
                const fileName = `360-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const filePath = `${req.user.id}/${fileName}`;
                uploadedFiles.push(filePath);
                return await propertyRepository.uploadImage(filePath, file.buffer, file.mimetype);
            });
            virtualTourUrls = await Promise.all(uploadPromises);
        }

        let virtual_tours = [];
        if (req.body.virtualTourMetadata && virtualTourUrls.length > 0) {
            try {
                const metadata = JSON.parse(req.body.virtualTourMetadata);
                virtual_tours = metadata.map((meta, index) => ({
                    room: meta.room,
                    url: virtualTourUrls[index]
                })).filter(vt => vt.url); // filter out any missing urls
            } catch (e) {
                console.error('Error parsing virtualTourMetadata:', e);
            }
        }


        const property = await propertyRepository.addProperty({
            type,
            listing_type: listingType || 'Sale',
            title,
            description,
            price,
            price_period: pricePeriod || null,
            address: address || null,
            district: district || null,
            city: city || null,
            contact_number: contactNumber || null,
            bedrooms: bedrooms ?? null,
            bathrooms: bathrooms ?? null,
            land_size: landSize ?? null,
            house_size: houseSize || null,
            latitude,
            longitude,
            boundary,
            images: imageUrls,
            virtual_tours: virtual_tours,
            seller_id: req.user.id,
            status: "pending",
            payment_status: "Unpaid",
            created_at: new Date(),
        });

        res.status(201).json({
            message: "Property created and awaiting payment",
            property,
        });
    } catch (error) {
        if (uploadedFiles.length > 0) {
            propertyRepository.removeImages(uploadedFiles).catch((e) => console.error("Rollback failed:", e));
        }
        next(error);
    }
};

const updateMyProperty = async(req, res, next) => {
    try {
        if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
            return res.status(403).json({ message: "Only sellers and agents can update submitted properties." });
        }

        const existingProperty = await propertyRepository.getPropertyById(req.params.id);

        if (!existingProperty || existingProperty.seller_id !== req.user.id) {
            return res.status(404).json({ message: "Property not found." });
        }

        if (existingProperty.status === "approved") {
            return res.status(400).json({ message: "Approved properties cannot be edited from this page." });
        }

        const {
            type,
            title,
            description,
            price,
            pricePeriod,
            address,
            district,
            city,
            contactNumber,
            bedrooms,
            bathrooms,
            landSize,
            houseSize,
        } = req.body;

        const updates = {
            type,
            title,
            description,
            price,
            price_period: pricePeriod || null,
            address: address || null,
            district,
            city,
            contact_number: contactNumber || null,
            bedrooms: bedrooms ?? null,
            bathrooms: bathrooms ?? null,
            land_size: landSize ?? null,
            house_size: houseSize || null,
            status: "pending",
            rejection_reason: null,
        };

        Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

        let { data: property, error: updateError } = await propertyRepository.updateMyProperty(req.params.id, req.user.id, updates);

        if (updateError && updateError.message ?.includes("rejection_reason")) {
            const { rejection_reason, ...fallbackUpdates } = updates;
            const fallback = await propertyRepository.updateMyProperty(req.params.id, req.user.id, fallbackUpdates);
            property = fallback.data;
            updateError = fallback.error;
        }

        if (updateError) throw updateError;

        res.status(200).json({
            message: "Property updated and sent to admin review.",
            property,
        });
    } catch (error) {
        next(error);
    }
};

const deleteMyProperty = async(req, res, next) => {
    try {
        if (req.user.role !== "SELLER" && req.user.role !== "AGENT") {
            return res.status(403).json({ message: "Only sellers and agents can delete properties." });
        }

        const success = await propertyRepository.deleteMyProperty(req.params.id, req.user.id);

        if (!success) {
            return res.status(404).json({ message: "Property not found or unauthorized." });
        }

        res.status(200).json({ message: "Property deleted successfully." });
    } catch (error) {
        next(error);
    }
};

module.exports = { addProperty, updateMyProperty, deleteMyProperty };
