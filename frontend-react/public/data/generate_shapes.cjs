const fs = require('fs');

function generateCirclePolygon(center, radiusDeg, numPoints = 64) {
    const coords = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const r = radiusDeg * (1 + 0.1 * Math.sin(5 * angle));
        const dx = r * Math.cos(angle);
        const dy = r * Math.sin(angle) * 0.9;
        coords.push([center[0] + dx, center[1] + dy]);
    }
    coords.push(coords[0]); // close polygon
    return coords;
}

const landslideData = [
  { name: "Kandy", center: [80.63, 7.29], radius: 0.1, deaths: 243, missing: 69, affectedFamilies: 5905 },
  { name: "Badulla", center: [81.05, 6.98], radius: 0.15, deaths: 89, missing: 10, affectedFamilies: 26393 },
  { name: "Nuwara Eliya", center: [80.78, 6.97], radius: 0.12, deaths: 81, missing: 32, affectedFamilies: 18193 },
  { name: "Kegalle", center: [80.34, 7.25], radius: 0.1, deaths: 33, missing: 38, affectedFamilies: 11091 },
  { name: "Matale", center: [80.62, 7.46], radius: 0.08, deaths: 29, missing: 8, affectedFamilies: 6759 }
];

const floodData = [
  { name: "Kurunegala", center: [80.36, 7.48], radius: 0.1, deaths: 62, missing: 11, affectedFamilies: 0 },
  { name: "Puttalam", center: [79.82, 8.03], radius: 0.08, deaths: 38, missing: 4, affectedFamilies: 0 },
  { name: "Gampaha", center: [79.99, 7.08], radius: 0.06, deaths: 17, missing: 0, affectedFamilies: 0 },
  { name: "Anuradhapura", center: [80.38, 8.31], radius: 0.08, deaths: 13, missing: 0, affectedFamilies: 0 },
  { name: "Colombo", center: [79.86, 6.92], radius: 0.05, deaths: 9, missing: 1, affectedFamilies: 18 }
];

function buildFeatureCollection(dataArray, type) {
    return {
        type: "FeatureCollection",
        features: dataArray.map(item => ({
            type: "Feature",
            properties: {
                name: `${item.name} ${type} Zone`,
                deaths: item.deaths,
                missing: item.missing,
                affectedFamilies: item.affectedFamilies,
                risk_level: item.deaths > 50 ? "Critical" : "High"
            },
            geometry: {
                type: "Polygon",
                coordinates: [generateCirclePolygon(item.center, item.radius)]
            }
        }))
    };
}

const floodGeoJSON = buildFeatureCollection(floodData, "Flood");
const landslideGeoJSON = buildFeatureCollection(landslideData, "Landslide");

fs.writeFileSync('D:/CSC3213_20_Group_E/frontend-react/public/data/flood_zones.json', JSON.stringify(floodGeoJSON, null, 2));
fs.writeFileSync('D:/CSC3213_20_Group_E/frontend-react/public/data/landslide_zones.json', JSON.stringify(landslideGeoJSON, null, 2));

console.log("Generated updated GeoJSON files based on the DMC Situation Report.");
