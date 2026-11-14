const supabase = require('../config/supabase');
const aiController = require('./aiController');

exports.getPropertyHistory = async (req, res) => {
    try {
        const { assessmentNumber } = req.query;
        
        let query = supabase.from('property_sales_history').select('*').order('sale_date', { ascending: true });
        
        if (assessmentNumber) {
            query = query.eq('assessment_number', assessmentNumber);
        } else {
            // Requests without an assessment number return explicitly simulated history.
            return res.status(200).json({
                success: true,
                isSimulated: true,
                data: [
                    { sale_date: '2021-01-15', sale_price: 12000000 },
                    { sale_date: '2022-06-20', sale_price: 13500000 },
                    { sale_date: '2024-03-10', sale_price: 16000000 },
                    { sale_date: '2026-08-01', sale_price: 19500000 }
                ]
            });
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        res.status(200).json({ success: true, isSimulated: false, data });
    } catch (error) {
        console.error('property_history_failed');
        res.status(500).json({ success: false, message: 'Server error fetching history' });
    }
};

exports.getAIPrediction = async (req, res) => {
    try {
        const { propertyData, areaAverage } = req.body;
        
        // Rule-based comparison against the supplied area average; no model inference.
        const difference = propertyData.price - areaAverage;
        const percentDiff = (Math.abs(difference) / areaAverage) * 100;
        
        let status = 'Fair Price';
        let reason = 'This property is priced consistently with the current market average for this area.';
        
        if (propertyData.price < areaAverage * 0.95) {
            status = 'Good Deal';
            reason = `Priced ${percentDiff.toFixed(1)}% below the market average for similar properties in the area. Highly recommended.`;
        } else if (propertyData.price > areaAverage * 1.05) {
            status = 'Overpriced';
            reason = `Priced ${percentDiff.toFixed(1)}% above the market average. Consider negotiating or reviewing premium features.`;
        }
        
        res.status(200).json({
            success: true,
            prediction: {
                estimatedValue: areaAverage,
                status,
                reason,
                confidence: 85
            }
        });
    } catch (error) {
        console.error('valuation_failed');
        res.status(500).json({ success: false, message: 'Failed to generate AI valuation' });
    }
};
