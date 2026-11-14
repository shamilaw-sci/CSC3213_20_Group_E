const { publicError } = require('../utils/publicError');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../config/supabase');
const { toolArgumentSchemas } = require('../validators/aiValidator');

const searchPropertiesFromDB = async (args) => {
    let query = supabase.from('properties').select('id, title, price, type, city, district, bedrooms, bathrooms, land_size').is('deleted_at', null).eq('status', 'approved').limit(5);
    
    if (args.location) {
        query = query.or(`city.ilike.%${args.location}%,district.ilike.%${args.location}%`);
    }
    if (args.maxPrice !== undefined) query = query.lte('price', args.maxPrice);
    if (args.type) query = query.ilike('type', `%${args.type}%`);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
};

const searchAgentsFromDB = async (args) => {
    let query = supabase.from('users').select('id, name, role, agent_profiles!inner(service_areas, agency_name)').in('role', ['AGENT', 'SELLER']).limit(5);
    
    if (args.location) {
        query = query.ilike('agent_profiles.service_areas', `%${args.location}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data.map(a => ({
        name: a.name,
        role: a.role,
        agency_name: a.agent_profiles[0]?.agency_name,
        service_areas: a.agent_profiles[0]?.service_areas
    }));
};

const tools = [{
    functionDeclarations: [
        {
            name: "search_properties",
            description: "Search the database for properties matching user criteria. Returns up to 5 properties.",
            parameters: {
                type: "OBJECT",
                properties: {
                    location: { type: "STRING", description: "City or district (e.g. Kandy, Colombo)" },
                    maxPrice: { type: "NUMBER", description: "Maximum price in LKR" },
                    type: { type: "STRING", description: "Property type (e.g. house, land, apartment, commercial)" }
                }
            }
        },
        {
            name: "search_agents",
            description: "Search the database for real estate agents operating in a specific location.",
            parameters: {
                type: "OBJECT",
                properties: {
                    location: { type: "STRING", description: "City or district where the user wants to find an agent" }
                },
                required: ["location"]
            }
        }
    ]
}];

const chatWithAI = async (req, res, next) => {
    try {
        const { message, history } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('AI configuration unavailable');
        }

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Role-based intelligence
        const userRole = req.user ? req.user.role : 'GUEST';
        const userName = req.user ? req.user.name : 'Guest';

        const systemInstruction = `You are a helpful and friendly real estate assistant for Thirasara Properties in Sri Lanka.
You are talking to a ${userRole} named ${userName}.

- If the user is an ADMIN: You should provide administrative insight and help them oversee properties/agents.
- If the user is a BUYER: Focus on helping them find their dream home, suggesting properties via your tools.
- If the user is a SELLER/AGENT: Focus on helping them list properties or manage leads, giving them market encouragement.
- If the user is a GUEST: Be very welcoming and encourage them to register an account to save properties and contact agents.

You have access to tools to search for live properties and agents in the database. Use them when the user asks for properties, homes, lands, or agents!
IMPORTANT: When suggesting a property from your search tool, ALWAYS format the property ID at the end of the line exactly like this: \`[ID: <uuid>]\`. This renders a clickable UI card for the user!`;

        let contents = [];
        if (history && Array.isArray(history)) {
             // Truncate to last 10 messages to prevent context window blowout
             const truncatedHistory = history.slice(-10);
             truncatedHistory.forEach(msg => {
                 contents.push({
                     role: msg.role === 'user' ? 'user' : 'model',
                     parts: [{ text: msg.text }]
                 });
             });
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction,
            tools: tools
        });

        // Use generateContent instead of startChat to easily handle history + function calling
        const result = await model.generateContent({ contents });
        const responseText = result.response.text();
        const functionCalls = result.response.functionCalls();

        // If the AI decides it needs to call a tool to answer
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            let apiResponse = { error: 'Unsupported search tool.' };
            if (Object.hasOwn(toolArgumentSchemas, call.name)) {
                const plainArgs = call.args !== null && typeof call.args === 'object'
                    && Object.getPrototypeOf(call.args) === Object.prototype;
                const parsed = plainArgs ? toolArgumentSchemas[call.name].safeParse(call.args) : null;
                if (!parsed?.success) {
                    apiResponse = { error: 'Invalid search parameters.' };
                } else if (call.name === 'search_properties') {
                    apiResponse = await searchPropertiesFromDB(parsed.data);
                } else {
                    apiResponse = await searchAgentsFromDB(parsed.data);
                }
            }

            // Append the model's function call request to history
            contents.push(result.response.candidates[0].content);
            
            // Append the tool's actual response
            contents.push({
                role: 'function',
                parts: [{
                    functionResponse: {
                        name: call.name,
                        response: { result: apiResponse || { error: "No results found" } }
                    }
                }]
            });

            // Make a second call to Gemini with the tool results so it can formulate the final answer
            const finalResult = await model.generateContent({ contents });
            return res.status(200).json({ response: finalResult.response.text() });
        }

        // If no tool was needed, just return the direct text response
        return res.status(200).json({ response: responseText });
    } catch {
        console.error('AI chat request failed');
        next(publicError('AI_UNAVAILABLE'));
    }
};

module.exports = { chatWithAI };
