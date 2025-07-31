// In routes/geminiRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/gemini-assessment', async (req, res) => {
  const prompt = req.body.prompt;
  try {
    // Replace with Gemini API endpoint and your actual API key
    const geminiRes = await axios.post(
    'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=AIzaSyAXX-NvDIwdN-o8M8v7tzT_lAKJJKnz_xE',
    { contents: [{ role: "user", parts: [{ text: prompt }] }] }
    );  
    const textOut = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                    geminiRes.data?.candidates?.[0]?.content?.text ||
                    "No output";
    res.json({ output: textOut });
  } catch (e) {
    console.error("Gemini API error:", e.response?.data || e.message);
    res.status(500).json({ error: "Failed to get Gemini assessment" });
  }
});
module.exports = router;
