const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes an electronic device image and returns structured JSON.
 * @param {string} base64Image - The base64 encoded image string.
 * @returns {Promise<Object>} - The structured analysis result.
 */
async function analyzeDeviceImage(base64Image) {
    try {
        // 1. Clean the base64 string (remove data prefix if present)
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        // 2. Define the Prompt (enforcing strict JSON output)
        const prompt = `Analyze this electronic device. Return ONLY a raw JSON object (no markdown backticks, no explanatory text). 
        { 
          "deviceName": "string", 
          "condition": "A/B/C/D", 
          "price": number, 
          "description": "string", 
          "ecoScore": {"co2": number, "materials": "string"}, 
          "route": "marketplace" 
        }`;

        // 3. Use Flash model for speed (perfect for hackathons)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 4. Send the image to the model
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        // 5. Parse the output text
        const responseText = result.response.text();
        
        // Remove potential markdown formatting just in case
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("AI Analysis Error:", error);
        // Returning a fallback object so the application flow doesn't break during the demo
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

module.exports = { analyzeDeviceImage };