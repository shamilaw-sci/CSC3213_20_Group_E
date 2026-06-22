const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Helper function to parse WKT POLYGON and extract coordinates
const parseWKT = (wkt) => {
    const match = wkt.match(/POLYGON\s*\(\(([^)]+)\)\)/i);
    if (!match) return null;
    
    const pointsStr = match[1].split(',');
    return pointsStr.map(pt => {
        const [lng, lat] = pt.trim().split(/\s+/).map(Number);
        return [lng, lat]; // [x, y]
    });
};

// Ray-casting algorithm for point in polygon
const isPointInPolygon = (point, vs) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

const searchPropertiesMap = async (req, res, next) => {
    try {
        const { polygon } = req.body;
        if (!polygon) {
            return res.status(400).json({ message: "Polygon WKT is required" });
        }

        const polygonPoints = parseWKT(polygon);
        
        // Fetch all approved properties
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, title, description, price, latitude, longitude, images')
            .eq('status', 'approved');

        if (error) {
            throw error;
        }

        if (!polygonPoints) {
            // Fallback: return all if WKT parsing fails
            return res.status(200).json({ properties });
        }

        // Filter properties using Point-in-Polygon
        const filteredProperties = properties.filter(prop => {
            if (prop.longitude == null || prop.latitude == null) return false;
            return isPointInPolygon([prop.longitude, prop.latitude], polygonPoints);
        });

        res.status(200).json({ properties: filteredProperties });
    } catch (error) {
        next(error);
    }
};

module.exports = { searchPropertiesMap };
