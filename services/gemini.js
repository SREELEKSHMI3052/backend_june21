const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeDeviceImage(base64Image) {
    try {
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `Analyze this electronic device. Return ONLY a raw JSON object (no markdown backticks, no explanatory text). 
        { 
          "deviceName": "string", 
          "condition": "A/B/C/D", 
          "price": number, 
          "description": "string", 
          "ecoScore": {"co2": number, "materials": "string"}, 
          "route": "marketplace" 
        }`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return {
            deviceName: "Unknown Device",
            condition: "C",
            price: 0,
            description: "Could not analyze image.",
            ecoScore: { co2: 0, materials: "N/A" },
            route: "recycler"
        };
    }
}

async function geminiChat(userMessage) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are the ReCircle recycling assistant. 
            You help users safely dispose of or sell their used electronics. 
            Give short, friendly 2-sentence answers about:
            - How to safely wipe data from phones/laptops
            - How to recycle e-waste responsibly
            - How to list devices on ReCircle
            - General questions about second-hand electronics`
        });

        const result = await model.generateContent(userMessage);
        return result.response.text();

    } catch (error) {
        console.error("Chat Error:", error);
        return "Sorry, I couldn't process that. Please try asking again!";
    }
}

module.exports = { analyzeDeviceImage, geminiChat };