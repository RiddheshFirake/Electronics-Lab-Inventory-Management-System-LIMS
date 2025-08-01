// routes/assistantRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Import your models with correct paths
const Component = require('../models/Component');
const User = require('../models/User');
const TransactionLog = require('../models/TransactionLog'); // <--- NEW: Import TransactionLog model

// Handles assistant chat interaction with comprehensive user data
router.post('/assistant', async (req, res) => {
  const { message, chat, userDetails } = req.body;
  
  // --- DEBUGGING LOGS ---
  console.log(`[Assistant Route] Received message: "${message}" for user ID: "${userDetails?.id}"`);
  // --- END DEBUGGING LOGS ---

  try {
    // Fetch comprehensive user data from database
    const userData = await gatherUserData(userDetails?.id);
    
    // --- DEBUGGING LOGS ---
    console.log(`[Assistant Route] UserData fetched (components count): ${userData?.components?.length || 0}`);
    console.log(`[Assistant Route] UserData fetched (transactions count): ${userData?.transactions?.length || 0}`); // <--- NEW LOG
    if (userData?.components && userData.components.length > 0) {
        console.log("[Assistant Route] Sample Component:", userData.components[0]);
    }
    if (userData?.transactions && userData.transactions.length > 0) { // <--- NEW LOG
        console.log("[Assistant Route] Sample Transaction:", userData.transactions[0]);
    }
    // --- END DEBUGGING LOGS ---

    // Combine chat history into a chat-like prompt for better context
    const context = (chat || []).map(msg =>
      (msg.from === 'assistant' ? "Assistant: " : "User: ") + msg.text
    ).join('\n');

    // Enhanced system instructions with comprehensive user data
    const systemInstructions = buildSystemInstructions(userDetails, userData);

    // Compose the enhanced prompt for Gemini
    const prompt =
      systemInstructions +
      `\n\nChat so far:\n${context}\n` +
      `User: ${message}\nAssistant:`;

    // --- DEBUGGING LOGS ---
    // console.log("[Assistant Route] Full Gemini Prompt:\n", prompt); // Uncomment only if needed, can be very long
    // --- END DEBUGGING LOGS ---

    // Call Gemini API
    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, // Use env variable
      { contents: [{ role: "user", parts: [{ text: prompt }] }] }
    );

    // Get the actual response text
    const textOut = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                    geminiRes.data?.candidates?.[0]?.content?.text ||
                    "Sorry, I couldn't find an answer right now.";
    
    res.json({ output: textOut });
  } catch (e) {
    console.error("Personal Assistant API error:", e.response?.data?.error?.message || e.response?.data || e.message);
    res.status(500).json({ error: "Failed to get assistant reply" });
  }
});

// Function to gather comprehensive user data
async function gatherUserData(userId) {
  try {
    if (!userId) {
        console.log("[gatherUserData] No userId provided. Returning null data.");
        return null;
    }

    // --- DEBUGGING LOGS ---
    console.log(`[gatherUserData] Fetching data for userId: ${userId}`);
    // --- END DEBUGGING LOGS ---

    // Get user's components with all relevant fields
    const components = await Component.find({ addedBy: userId })
      .select('componentName partNumber manufacturer category quantity criticalLowThreshold unitPrice location description status lastOutwardMovement totalInward totalOutward tags createdAt') // Added createdAt for old stock logic
      .limit(50) // Limit to prevent token overflow
      .lean();

    // Get user's recent transactions
    const transactions = await TransactionLog.find({ user: userId })
      .populate('componentId', 'componentName partNumber') // Populate component details for readability
      .sort({ transactionDate: -1 }) // Sort by most recent
      .limit(20) // Limit to prevent token overflow, adjust as needed
      .lean();
    
    // --- DEBUGGING LOGS ---
    console.log(`[gatherUserData] Found ${components.length} components.`);
    console.log(`[gatherUserData] Found ${transactions.length} transactions.`);
    // --- END DEBUGGING LOGS ---

    // Get enhanced user profile
    const userProfile = await User.findById(userId)
      .select('name email role preferences createdAt lastLogin')
      .lean();

    const userData = {
      components: components || [],
      transactions: transactions || [], // <--- NEW: Include transactions
      userProfile: userProfile || null,
      stats: calculateUserStats(components, transactions) // <--- NEW: Pass transactions to stats calculation if needed
    };

    return userData;
  } catch (error) {
    console.error('Error gathering user data:', error);
    return null;
  }
}

// Function to calculate user statistics based on components and transactions
function calculateUserStats(components, transactions) { // <--- NEW: Accept transactions
  if (!components || components.length === 0) {
    console.log("[calculateUserStats] No components provided, returning zero stats.");
    return {
      totalComponents: 0,
      totalQuantity: 0,
      lowStockItems: 0,
      criticalItems: 0,
      totalValue: '0.00',
      activeComponents: 0,
      discontinuedComponents: 0,
      oldStockItems: 0,
      categories: [],
      totalInwardMovement: 0,
      totalOutwardMovement: 0,
      averageUnitPrice: 0,
      recentTransactionsCount: 0 // <--- NEW STAT
    };
  }

  const totalComponents = components.length;
  const totalQuantity = components.reduce((sum, comp) => sum + (comp.quantity || 0), 0);
  const lowStockItems = components.filter(comp => comp.quantity <= comp.criticalLowThreshold).length;
  const criticalItems = components.filter(comp => comp.quantity === 0).length;
  const totalValue = components.reduce((sum, comp) => sum + ((comp.quantity || 0) * (comp.unitPrice || 0)), 0);
  
  const activeComponents = components.filter(comp => comp.status === 'Active').length;
  const discontinuedComponents = components.filter(comp => comp.status === 'Discontinued').length;
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const oldStockItems = components.filter(comp => {
    const checkDate = comp.lastOutwardMovement ? new Date(comp.lastOutwardMovement) : new Date(comp.createdAt);
    return checkDate < threeMonthsAgo;
  }).length;

  const totalInwardMovement = components.reduce((sum, comp) => sum + (comp.totalInward || 0), 0);
  const totalOutwardMovement = components.reduce((sum, comp) => sum + (comp.totalOutward || 0), 0);
  
  const averageUnitPrice = components.length > 0 
    ? components.reduce((sum, comp) => sum + (comp.unitPrice || 0), 0) / components.length 
    : 0;

  return {
    totalComponents,
    totalQuantity,
    lowStockItems,
    criticalItems,
    totalValue: totalValue.toFixed(2),
    activeComponents,
    discontinuedComponents,
    oldStockItems,
    totalInwardMovement,
    totalOutwardMovement,
    averageUnitPrice: averageUnitPrice.toFixed(2),
    categories: [...new Set(components.map(comp => comp.category).filter(Boolean))],
    recentTransactionsCount: transactions ? transactions.length : 0 // <--- NEW STAT
  };
}

// Function to build comprehensive system instructions
function buildSystemInstructions(userDetails, userData) {
  let instructions = `You are a helpful personal electronics assistant for the following user:

USER PROFILE:
- Name: ${userDetails?.name || "Unknown"}
- Email: ${userDetails?.email || "Not provided"}
- Role: ${userDetails?.role || "User"}
- Account Status: Active`;

  if (userData && userData.stats) {
    instructions += `

INVENTORY OVERVIEW:
- Total Components: ${userData.stats.totalComponents}
- Total Quantity in Stock: ${userData.stats.totalQuantity} units
- Total Inventory Value: INR ${userData.stats.totalValue}
- Low Stock Items: ${userData.stats.lowStockItems} components (at or below critical threshold)
- Critical Stock Items: ${userData.stats.criticalItems} components (zero quantity)
- Old Stock Items: ${userData.stats.oldStockItems} components (no movement in 3+ months)
- Active Components: ${userData.stats.activeComponents}
- Discontinued Components: ${userData.stats.discontinuedComponents}`;

    if (userData.stats.categories.length > 0) {
      instructions += `
- Component Categories: ${userData.stats.categories.join(', ')}`;
    }

    instructions += `

MOVEMENT STATISTICS:
- Total Inward Movement: ${userData.stats.totalInwardMovement} units
- Total Outward Movement: ${userData.stats.totalOutwardMovement} units
- Average Component Price: INR ${userData.stats.averageUnitPrice}
- Recent Transactions Logged: ${userData.stats.recentTransactionsCount}`; // <--- NEW LINE: Recent transactions count

    // Add detailed component information (existing logic)
    if (userData.components && userData.components.length > 0) {
      instructions += `\n\nDETAILED COMPONENT INVENTORY:`;
      
      // ... (your existing criticalComponents, lowStockComponents, normalComponents, oldStockComponents sections)
      const criticalComponents = userData.components.filter(comp => comp.quantity === 0);
      if (criticalComponents.length > 0) {
        instructions += `\n\n⚠️  CRITICAL STOCK (Zero Quantity):`;
        criticalComponents.slice(0, 10).forEach(comp => {
          instructions += `\n- ${comp.componentName} (${comp.partNumber}) by ${comp.manufacturer}: 0 units | Threshold: ${comp.criticalLowThreshold} | Location: ${comp.location}`;
        });
      }

      const lowStockComponents = userData.components.filter(comp => comp.quantity > 0 && comp.quantity <= comp.criticalLowThreshold);
      if (lowStockComponents.length > 0) {
        instructions += `\n\n⚡ LOW STOCK ITEMS:`;
        lowStockComponents.slice(0, 10).forEach(comp => {
          instructions += `\n- ${comp.componentName} (${comp.partNumber}) by ${comp.manufacturer}: ${comp.quantity} units (Critical: ${comp.criticalLowThreshold}) | INR ${comp.unitPrice} each | Location: ${comp.location}`;
        });
      }

      const normalComponents = userData.components.filter(comp => comp.quantity > comp.criticalLowThreshold);
      if (normalComponents.length > 0) {
        instructions += `\n\nNORMAL STOCK ITEMS:`;
        normalComponents.slice(0, 15).forEach(comp => {
          const tags = comp.tags && comp.tags.length > 0 ? ` | Tags: ${comp.tags.join(', ')}` : '';
          instructions += `\n- ${comp.componentName} (${comp.partNumber}) by ${comp.manufacturer}: ${comp.quantity} units @ INR ${comp.unitPrice} each | Location: ${comp.location}${tags}`;
        });
      }

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const oldStockComponents = userData.components.filter(comp => {
        const checkDate = comp.lastOutwardMovement ? new Date(comp.lastOutwardMovement) : new Date(comp.createdAt);
        return checkDate < threeMonthsAgo;
      });

      if (oldStockComponents.length > 0) {
        instructions += `\n\n🗄️  OLD STOCK (No movement in 3+ months):`;
        oldStockComponents.slice(0, 8).forEach(comp => {
          const lastMovement = comp.lastOutwardMovement 
            ? new Date(comp.lastOutwardMovement).toLocaleDateString() 
            : 'Never';
          instructions += `\n- ${comp.componentName} (${comp.partNumber}): ${comp.quantity} units | Last used: ${lastMovement}`;
        });
      }
    }

    // <--- NEW: Add recent transaction details to the instructions
    if (userData.transactions && userData.transactions.length > 0) {
      instructions += `\n\nRECENT INVENTORY MOVEMENTS (Last ${userData.transactions.length} Transactions):`;
      userData.transactions.forEach(t => {
        const componentName = t.componentId?.componentName || 'Unknown Component';
        const partNumber = t.componentId?.partNumber ? ` (${t.componentId.partNumber})` : '';
        const transactionDate = new Date(t.transactionDate).toLocaleString();
        instructions += `\n- ${transactionDate}: ${t.operationType.toUpperCase()} of ${t.quantity} units of ${componentName}${partNumber}. Reason/Project: ${t.reasonOrProject || 'N/A'}`;
      });
    }
  }

  instructions += `

ASSISTANT GUIDELINES:
- You are an electronics inventory management assistant with access to comprehensive component data and recent transaction logs.
- Help with component searches, stock management, reorder recommendations, and electronics technical questions.
- **You can now answer questions about recent inward and outward movements, including by whom, for what reason/project, and on what date/time.**
- Always reference specific component details like part numbers, manufacturers, and locations when available.
- Provide alerts for critical stock (zero quantity) and low stock situations.
- Suggest reorder quantities based on usage patterns and critical thresholds.
- Help identify old stock that may need attention.
- Answer electronics technical questions and project recommendations using available components.
- For Arduino/microcontroller projects, recommend specific components from their inventory.
- Never mention that you are Gemini or any other AI model name.
- Always be conversational, helpful, and professional.
- Use the user's actual inventory data to provide personalized, actionable responses.
- When suggesting alternatives, consider compatibility with existing components.
- Help with component organization and location management.`;

  return instructions;
}

module.exports = router;