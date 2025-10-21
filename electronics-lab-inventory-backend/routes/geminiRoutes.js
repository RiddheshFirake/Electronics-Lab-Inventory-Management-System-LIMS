// In routes/geminiRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// It is assumed you have already required 'dotenv' and configured environment variables
// in your main server.js file.

router.post('/gemini-assessment', async (req, res) => {
  const prompt = req.body.prompt;
  
  // 🔑 FIX: Get the API key from a secure environment variable
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

  if (!GEMINI_API_KEY) {
    // Fail fast if the key is missing from the environment
    console.error("FATAL: GEMINI_API_KEY is not set in environment variables.");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error: API key missing." 
    });
  }

  try {
    // Construct the URL using the environment variable
    const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

    const geminiRes = await axios.post(
      apiUrl, // Use the dynamically constructed URL
      { contents: [{ role: "user", parts: [{ text: prompt }] }] }
    );  
    
    const textOut = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                    geminiRes.data?.candidates?.[0]?.content?.text ||
                    "No output";
    
    res.json({ output: textOut });

  } catch (e) {
    // Enhance error logging to check for token limit (400) or authentication (401)
    const status = e.response?.status || 500;
    const errorMessage = e.response?.data?.error?.message || e.message;
    
    console.error(`Gemini Assessment API error (Status ${status}):`, errorMessage);

    // Return a 400 for client-side issues (like bad prompt/token limit) or a 500 for server issues
    res.status(status >= 400 && status < 500 ? 400 : 500).json({ 
      success: false,
      error: `Failed to get Gemini assessment. ${status === 400 ? "Check prompt for token limit or content safety." : ""}` 
    });
  }
});

module.exports = router;
