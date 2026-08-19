const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');

const chatWithAI = async (req, res, next) => {
    try {
        const { message, history } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return next(new Error("GEMINI_API_KEY is not configured in the backend."));
        }

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 1. Fetch properties to provide context to Gemini
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, title, description, price, type, bedrooms, bathrooms, land_size, district, city, images')
            .eq('status', 'approved');

        if (error) throw error;

        // 2. Fetch agents to provide context to Gemini
        const { data: agents, error: agentsError } = await supabase
            .from('users')
            .select('id, name, role, agent_profiles(service_areas, agency_name)')
            .in('role', ['AGENT', 'SELLER']);
            
        if (agentsError) console.error("Could not fetch agents for AI context", agentsError);

        // Create a compact context for properties
        const propertyContext = (properties || []).map(p => 
            `[ID: ${p.id}] ${p.title} - ${p.type} in ${p.city || p.district || 'Unknown location'}. Price: LKR ${p.price}. ${p.bedrooms || 0} Beds, ${p.bathrooms || 0} Baths, ${p.land_size || 0} perches. Image: ${p.images?.[0]}`
        ).join('\n');
        
        // Create a compact context for agents
        const agentContext = (agents || []).map(a => {
            const profile = a.agent_profiles && a.agent_profiles[0] ? a.agent_profiles[0] : {};
            return `${a.name} (${a.role}) - Agency: ${profile.agency_name || 'Independent'}. Service Areas (Locations): ${profile.service_areas || 'Island-wide'}.`;
        }).join('\n');

        const systemInstruction = `You are a helpful and friendly real estate assistant for Thirasara Properties in Sri Lanka. 
Your job is to help users find properties and real estate agents based on their requests.
Always be polite, concise, and enthusiastic. Use emojis where appropriate.
Use the following list of available properties to answer the user's questions:

--- AVAILABLE PROPERTIES ---
${propertyContext}
----------------------------

If the user asks for a property that matches their criteria, suggest the best matches from the list above. Include the property title, price, location, and a brief reason why it matches.
IMPORTANT: When suggesting a property, format the property ID at the end of the line like this: \`[ID: <uuid>]\`. This helps the frontend render a clickable card!
DO NOT invent properties that are not in the list.
If no properties match, apologize and tell them we don't currently have exactly that, but suggest a close alternative if possible.

--- AVAILABLE AGENTS ---
${agentContext}
----------------------------

If the user asks to find an agent in a specific location (e.g. Kandy, Colombo), look at the Available Agents list and suggest agents whose Service Areas match their location. Provide the agent's name, their agency, and tell the user they can search for this agent in the "Find an agent" page at the top navigation bar. If no agents match the location, apologize and tell them to check the "Find an agent" page.`;

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

        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction 
        });

        const response = await model.generateContent({ contents });

        res.status(200).json({ response: response.response.text() });
    } catch (error) {
        console.error("AI Error:", error);
        next(error);
    }
};

module.exports = { chatWithAI };
