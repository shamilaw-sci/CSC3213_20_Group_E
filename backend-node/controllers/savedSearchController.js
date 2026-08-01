const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const logger = require('../utils/logger');
const { sendSavedSearchAlertEmail } = require('../utils/emailService');
const { findMatchingSearches } = require('../utils/searchMatcher');

// @desc Save a new search (map polygon + filters) for the logged-in user
// @route POST /api/saved-searches
// @access Private
const saveSearch = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, polygon, beds, baths, property_type } = req.body;

        const { data, error } = await supabase
            .from('saved_searches')
            .insert([{
                user_id: userId,
                title: title || 'My Saved Search',
                polygon,
                beds,
                baths,
                property_type,
                email_alerts_enabled: true,
            }])
            .select();

        if (error) {
            if (error.message.includes('relation "public.saved_searches" does not exist')) {
                return res.status(500).json({ message: "saved_searches table does not exist in the database." });
            }
            throw error;
        }

        res.status(201).json({ message: "Search saved successfully", savedSearch: data[0] });
    } catch (error) {
        next(error);
    }
};

// @desc Get all saved searches for the logged-in user
// @route GET /api/saved-searches
// @access Private
const getSavedSearches = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('saved_searches')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            if (error.message.includes('relation "public.saved_searches" does not exist')) {
                return res.status(200).json({ savedSearches: [], message: "Table not created yet." });
            }
            throw error;
        }

        res.status(200).json({ savedSearches: data });
    } catch (error) {
        next(error);
    }
};

// @desc Delete a saved search belonging to the logged-in user
// @route DELETE /api/saved-searches/:id
// @access Private
const deleteSavedSearch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error } = await supabase
            .from('saved_searches')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.status(200).json({ message: "Saved search deleted" });
    } catch (error) {
        next(error);
    }
};

// @desc Turn email match-alerts on/off for one saved search
// @route PATCH /api/saved-searches/:id/alerts
// @access Private
const toggleAlerts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { emailAlertsEnabled } = req.body;

        const { data, error } = await supabase
            .from('saved_searches')
            .update({ email_alerts_enabled: emailAlertsEnabled })
            .eq('id', id)
            .eq('user_id', userId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "Saved search not found" });
        }

        res.status(200).json({ message: "Alert preference updated", savedSearch: data[0] });
    } catch (error) {
        next(error);
    }
};

/**
 * Called (fire-and-forget) whenever a property listing goes live (gets
 * approved). Finds every saved search - across ALL users, with alerts
 * turned on - that matches this property, and emails each owner.
 *
 * Intentionally never throws: a failure here must never break the
 * property-approval flow that calls it.
 */
const checkSavedSearchMatches = async (property) => {
    try {
        if (!property) return;

        const { data: activeSearches, error } = await supabase
            .from('saved_searches')
            .select('id, title, polygon, beds, baths, property_type, users(email)')
            .eq('email_alerts_enabled', true);

        if (error) {
            logger.error('Failed to load saved searches for matching', error);
            return;
        }

        const matches = findMatchingSearches(property, activeSearches || []);

        await Promise.all(
            matches.map((search) => {
                const email = search.users?.email;
                if (!email) return Promise.resolve();
                return sendSavedSearchAlertEmail(email, search.title, property).catch((err) =>
                    logger.error('Failed to send saved-search alert email', err)
                );
            })
        );

        if (matches.length > 0) {
            logger.info('Saved search alerts sent', { propertyId: property.id, matchCount: matches.length });
        }
    } catch (error) {
        logger.error('checkSavedSearchMatches failed', error);
    }
};

module.exports = {
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    toggleAlerts,
    checkSavedSearchMatches,
};
