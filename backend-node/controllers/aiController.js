const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "GEMINI_API_KEY is not configured in the backend." });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 1. Fetch properties to provide context to Gemini
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, title, description, price, property_type, bedrooms, bathrooms, land_size, address, images, features')
            .eq('status', 'approved');

        if (error) throw error;

        // Create a compact context
        const propertyContext = properties.map(p => 
            `[ID: ${p.id}] ${p.title} - ${p.property_type} in ${p.address}. Price: LKR ${p.price}. ${p.bedrooms || 0} Beds, ${p.bathrooms || 0} Baths, ${p.land_size || 0} perches. Features: ${(p.features||[]).join(', ')}. Image: ${p.images?.[0]}`
        ).join('\n');

        const systemInstruction = `You are a helpful and friendly real estate assistant for Thirasara Properties in Sri Lanka. 
Your job is to help users find properties based on their requests.
Always be polite, concise, and enthusiastic. Use emojis where appropriate.
Use the following list of available properties to answer the user's questions:

--- AVAILABLE PROPERTIES ---
${propertyContext}
----------------------------

If the user asks for a property that matches their criteria, suggest the best matches from the list above. Include the property title, price, location, and a brief reason why it matches.
IMPORTANT: When suggesting a property, format the property ID at the end of the line like this: \`[ID: <uuid>]\`. This helps the frontend render a clickable card!
DO NOT invent properties that are not in the list.
If no properties match, apologize and tell them we don't currently have exactly that, but suggest a close alternative if possible.`;

        // Format history for Gemini API (if provided)
        let contents = [];
        if (history && Array.isArray(history)) {
             history.forEach(msg => {
                 contents.push({
                     role: msg.role === 'user' ? 'user' : 'model',
                     parts: [{ text: msg.text }]
                 });
             });
        }
        
        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        res.status(200).json({ response: response.text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: error.message || "Failed to communicate with AI Assistant." });
    }
};

module.exports = { chatWithAI };
