const Land = require('../models/Land');
const User = require('../models/User');
const LandTransaction = require('../models/LandTransaction');
const BuyRequest = require('../models/BuyRequest');
const { predictLandPrice } = require('../services/mlService');
// Use built-in fetch (Node 18+)

/**
 * Hybrid AI Chatbot Service
 * Combines rule-based NLP (fast, offline) with optional AI API (smart, complex queries)
 */

class ChatbotService {
  constructor() {
    // Keywords for intent recognition
    this.intents = {
      SEARCH_LANDS: ['show', 'find', 'search', 'list', 'lands', 'properties', 'available'],
      PRICE_PREDICTION: ['predict', 'prediction', 'estimate', 'value', 'worth', 'valuation', 'ai price', 'ml price'],
      PRICE_INQUIRY: ['price', 'cost', 'expensive', 'cheap', 'average', 'how much'],
      RECOMMENDATION: ['recommend', 'suggest', 'best', 'good', 'investment', 'should i'],
      LOCATION_QUERY: ['near', 'location', 'area', 'district', 'state', 'where'],
      HELP: ['help', 'how', 'what', 'guide', 'explain', 'process'],
      STATS: ['statistics', 'stats', 'total', 'count', 'how many'],
      COMPARISON: ['compare', 'difference', 'versus', 'vs', 'better'],
    };

    // Quick responses for common questions
    this.quickResponses = {
      greeting: ['hi', 'hello', 'hey', 'greetings'],
      thanks: ['thank', 'thanks', 'appreciate'],
      goodbye: ['bye', 'goodbye', 'see you'],
    };

    // Initialize AI API (OpenRouter)
    this.aiEnabled = false;
    this.aiApiKey = process.env.OPENROUTER_API_KEY;
    
    if (this.aiApiKey) {
      this.aiEnabled = true;
      console.log('Chatbot: OpenRouter AI integration enabled.');
    } else {
      console.warn('Chatbot: OPENROUTER_API_KEY not found in environment. AI fallback disabled.');
    }
  }

  /**
   * Main message processing function
   * Uses rule-based NLP first, falls back to AI if configured
   */
  async processMessage(message, userId, context = {}) {
    try {
      const normalizedMessage = message.toLowerCase().trim();

      // Check for quick responses first
      const quickResponse = this.getQuickResponse(normalizedMessage);
      if (quickResponse) {
        return {
          message: quickResponse,
          type: 'text'
        };
      }

      // Special check: if message contains area units (cent, acre, sqft) + location, treat as price prediction
      const hasAreaUnit = /\d+\.?\d*\s*(cent|acre|sqft)/i.test(normalizedMessage);
      const hasLocation = /\b(in|at|near)\s+\w+/i.test(normalizedMessage);
      const hasPriceKeyword = /\b(price|cost|value|worth|predict|estimate)/i.test(normalizedMessage);
      
      console.log('Natural language check:', { hasAreaUnit, hasLocation, hasPriceKeyword, message: normalizedMessage });
      
      if (hasAreaUnit && (hasLocation || hasPriceKeyword)) {
        // This is a natural language price prediction query
        console.log('Routing to natural language price prediction');
        return await this.handlePricePrediction(normalizedMessage, userId);
      }

      // Match intent using keywords
      const intent = this.recognizeIntent(normalizedMessage);
      console.log('Recognized intent:', intent);

      // Process rule-based response
      let ruleResponse = await this.getRuleBasedResponse(intent, normalizedMessage, userId);

      // Orchestrate final response via Gemini
      return await this.orchestrateResponse(message, ruleResponse, userId, context);

    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        response: "I'm having trouble processing that. Could you rephrase your question?",
        type: 'error'
      };
    }
  }

  /**
   * Recognize user intent from message
   */
  recognizeIntent(message) {
    for (const [intent, keywords] of Object.entries(this.intents)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Get quick response for common phrases
   */
  getQuickResponse(message) {
    if (this.quickResponses.greeting.some(word => message.includes(word))) {
      return "Hello! 👋 I'm your AI land registry assistant. I can help you find properties, check prices, and guide you through the buying process. What would you like to know?";
    }
    if (this.quickResponses.thanks.some(word => message.includes(word))) {
      return "You're welcome! Feel free to ask me anything else about lands or the buying process. 😊";
    }
    if (this.quickResponses.goodbye.some(word => message.includes(word))) {
      return "Goodbye! Come back anytime you need help with land registry. Have a great day! 👋";
    }
    return null;
  }

  /**
   * Helper to get rule-based response based on intent
   */
  async getRuleBasedResponse(intent, message, userId) {
    switch (intent) {
      case 'SEARCH_LANDS': return await this.handleSearchLands(message, userId);
      case 'PRICE_INQUIRY': return await this.handlePriceInquiry(message);
      case 'PRICE_PREDICTION': return await this.handlePricePrediction(message, userId);
      case 'RECOMMENDATION': return await this.handleRecommendation(message, userId);
      case 'LOCATION_QUERY': return await this.handleLocationQuery(message);
      case 'HELP': return await this.handleHelp(message);
      case 'STATS': return await this.handleStats(message);
      case 'COMPARISON': return await this.handleComparison(message);
      default: return null;
    }
  }

  /**
   * Gemini Orchestrator: Combines rule-based data with AI personality
   */
  async orchestrateResponse(userMessage, ruleResponse, userId, context) {
    if (!this.aiEnabled) {
      // Fallback if AI is disabled
      const r = ruleResponse || { message: "I'm not sure about that. How can I help you with lands?", type: 'text' };
      return {
        response: r.message,
        type: r.type || 'text',
        data: r.data || null,
        suggestions: r.suggestions || this.getContextualSuggestions(context)
      };
    }

    try {
      let prompt = `You are the official PropChain Support Representative. 
      
      PERSONALITY RULES:
      1. Act as an official representative of the PropChain platform.
      2. Be professional, helpful, and extremely concise.
      3. Your response must be a single, short paragraph (maximum 3-4 sentences).
      4. DO NOT use introductory boilerplate like "Based on the platform context..." or "As an AI...". Start directly with the answer.
      5. Never use bullet points unless absolutely necessary for complex data.
      6. USE PLAIN ENGLISH ONLY. NEVER use emojis, icons, or special visual characters.
      7. SECURITY GUARDRAIL: If the user's question is unrelated to land registry, real estate, blockchain technology, or PropChain services, you MUST politely decline to answer. Simply state that you are a specialized assistant for PropChain land and blockchain services and cannot help with unrelated topics.
      
      User Message: "${userMessage}"\n\n`;

      if (ruleResponse) {
        prompt += `The system has detected a specific intent and generated this standard response/data:
        ---
        Standard Response: "${ruleResponse.message}"
        Data Type: ${ruleResponse.type}
        ---
        
        INSTRUCTIONS:
        1. If the Standard Response contains useful data (like prices, search results, or stats), incorporate it naturally into your answer.
        2. If the Standard Response is just a generic help message and your AI knowledge provides a better, more direct answer to the User Message, prioritize your AI answer.
        3. ALWAYS be professional and helpful. 
        4. If the Data Type is 'search_results' or 'price_analysis', keep your text brief and encourage them to look at the results/cards shown.
        5. Your final response should be a single, cohesive message for the user.`;
      } else {
        prompt += `The system did not recognize a specific intent. Please use your AI knowledge to answer the question based on the PropChain platform context (Blockchain Land Registry).`;
      }

      const aiText = await this.callOpenRouter(prompt);

      return {
        response: aiText,
        type: ruleResponse?.type || 'text',
        data: ruleResponse?.data || null
      };
    } catch (error) {
      console.error('Orchestration error:', error);
      const r = ruleResponse || { message: "I'm having trouble thinking right now. Try again?", type: 'text' };
      return {
        response: r.message,
        type: r.type || 'text',
        data: r.data || null
      };
    }
  }

  /**
   * Direct call to OpenRouter API
   */
  async callOpenRouter(prompt) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.aiApiKey}`,
          'HTTP-Referer': 'http://localhost:5173', // Site URL
          'X-OpenRouter-Title': 'PropChain Assistant',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free', // Auto-selects the best available free model
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `OpenRouter API error: ${response.status}`);
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter Fetch Error:', error.message);
      throw error;
    }
  }

  /**
   * Handle land search queries
   */
  async handleSearchLands(message, userId) {
    try {
      const filters = this.extractFilters(message);
      console.log('Extracted filters:', filters);

      // Build query
      const query = { 'marketInfo.isForSale': true };
      
      if (filters.landType) {
        query.landType = filters.landType.toUpperCase();
      }
      if (filters.district) {
        query.district = new RegExp(filters.district, 'i');
      }
      if (filters.state) {
        query.state = new RegExp(filters.state, 'i');
      }
      if (filters.minPrice || filters.maxPrice) {
        query['marketInfo.askingPrice'] = {};
        if (filters.minPrice) query['marketInfo.askingPrice'].$gte = filters.minPrice;
        if (filters.maxPrice) query['marketInfo.askingPrice'].$lte = filters.maxPrice;
      }

      // Determine sort order
      let sortCriteria = { 'marketInfo.listedAt': -1 }; // Default: newest first
      if (filters.sortBy === 'price-asc') {
        sortCriteria = { 'marketInfo.askingPrice': 1 }; // Cheapest first
      } else if (filters.sortBy === 'price-desc') {
        sortCriteria = { 'marketInfo.askingPrice': -1 }; // Most expensive first
      }

      const lands = await Land.find(query)
        .populate('currentOwner', 'fullName email')
        .limit(10)
        .sort(sortCriteria);

      if (lands.length === 0) {
        return {
          message: `I couldn't find any lands matching your criteria. ${filters.district ? `Try searching in nearby districts or ` : ''}adjust your price range.`,
          type: 'text'
        };
      }

      return {
        message: `Great! I found ${lands.length} propert${lands.length === 1 ? 'y' : 'ies'} for you${filters.sortBy === 'price-asc' ? ' (sorted by lowest price)' : filters.sortBy === 'price-desc' ? ' (sorted by highest price)' : ''}. Click "View Details" on any card below to see more information! 🏡`,
        type: 'search_results',
        data: { 
          lands: lands.map(l => ({ 
            id: l._id, 
            surveyNumber: l.surveyNumber, 
            price: l.marketInfo.askingPrice,
            village: l.village,
            district: l.district,
            state: l.state,
            area: l.area,
            landType: l.landType
          })) 
        }
      };

    } catch (error) {
      console.error('Search lands error:', error);
      return {
        message: "I encountered an error while searching. Please try again with different criteria.",
        type: 'error'
      };
    }
  }

  /**
   * Extract filters from natural language query
   */
  extractFilters(message) {
    const filters = {};

    // Check for cheap/expensive keywords to determine sorting
    if (message.includes('cheap') || message.includes('cheapest') || message.includes('affordable') || message.includes('budget')) {
      filters.sortBy = 'price-asc';
    } else if (message.includes('expensive') || message.includes('premium') || message.includes('luxury')) {
      filters.sortBy = 'price-desc';
    }

    // Extract land type
    const landTypes = ['agricultural', 'residential', 'commercial', 'industrial'];
    for (const type of landTypes) {
      if (message.includes(type)) {
        filters.landType = type;
        break;
      }
    }

    // Extract price range
    const priceMatch = message.match(/(\d+)\s*(lakh|lakhs|crore|crores|thousand|k|l|cr)/gi);
    if (priceMatch) {
      const prices = priceMatch.map(p => this.parsePrice(p));
      if (prices.length === 1) {
        filters.maxPrice = prices[0];
      } else if (prices.length >= 2) {
        filters.minPrice = Math.min(...prices);
        filters.maxPrice = Math.max(...prices);
      }
    }

    // Extract location (simple pattern matching)
    const locationWords = message.split(' ').filter(word => 
      word.length > 3 && 
      !['show', 'find', 'land', 'lands', 'under', 'above', 'between', 'near', 'cheap', 'cheapest'].includes(word)
    );
    
    // Common Indian states and cities
    const states = ['karnataka', 'maharashtra', 'tamil nadu', 'kerala', 'gujarat', 'rajasthan'];
    const cities = ['bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'mysore'];
    
    for (const word of locationWords) {
      if (states.some(state => word.includes(state.replace(' ', '')))) {
        filters.state = word;
      } else if (cities.some(city => word.includes(city))) {
        filters.district = word;
      }
    }

    return filters;
  }

  /**
   * Parse price from text to number
   */
  parsePrice(priceText) {
    const num = parseFloat(priceText.match(/[\d.]+/)[0]);
    const unit = priceText.toLowerCase();
    
    if (unit.includes('crore') || unit.includes('cr')) {
      return num * 10000000;
    } else if (unit.includes('lakh') || unit.includes('l')) {
      return num * 100000;
    } else if (unit.includes('thousand') || unit.includes('k')) {
      return num * 1000;
    }
    return num;
  }

  /**
   * Handle price inquiry queries
   */
  async handlePriceInquiry(message) {
    try {
      const filters = this.extractFilters(message);
      const query = { 'marketInfo.isForSale': true };
      
      if (filters.district) query.district = new RegExp(filters.district, 'i');
      if (filters.state) query.state = new RegExp(filters.state, 'i');
      if (filters.landType) query.landType = filters.landType.toUpperCase();

      const lands = await Land.find(query).select('marketInfo.askingPrice area landType district');
      
      if (lands.length === 0) {
        return {
          message: "I don't have enough data for that location. Try a different area or check our marketplace for available listings.",
          type: 'text'
        };
      }

      const prices = lands.map(l => l.marketInfo.askingPrice).filter(p => p > 0);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      const location = filters.district || filters.state || 'this area';
      
      return {
        message: `📊 Price Analysis for ${location}:\n\n` +
                `• Average Price: ₹${avgPrice.toLocaleString('en-IN')}\n` +
                `• Lowest Price: ₹${minPrice.toLocaleString('en-IN')}\n` +
                `• Highest Price: ₹${maxPrice.toLocaleString('en-IN')}\n` +
                `• Total Listings: ${lands.length}\n\n` +
                `Would you like to see properties in a specific price range?`,
        type: 'price_analysis',
        data: { avgPrice, minPrice, maxPrice, count: lands.length }
      };

    } catch (error) {
      console.error('Price inquiry error:', error);
      return {
        message: "I couldn't analyze prices right now. Please try again.",
        type: 'error'
      };
    }
  }

  /**
   * Handle recommendation queries
   */
  async handleRecommendation(message, userId) {
    try {
      // Get user's previous interactions if available
      const user = await User.findById(userId);
      
      // Find popular and well-priced lands
      const lands = await Land.find({ 'marketInfo.isForSale': true })
        .populate('currentOwner', 'fullName verificationStatus')
        .limit(5)
        .sort({ 'marketInfo.listedAt': -1 });

      if (lands.length === 0) {
        return {
          message: "There are no lands available for sale at the moment. Check back soon!",
          type: 'text'
        };
      }

      return {
        message: `🌟 Here are my top ${lands.length} recommendations based on verification status, features, and market value. Check out the cards below!`,
        type: 'search_results',
        data: { 
          lands: lands.map(l => ({ 
            id: l._id, 
            surveyNumber: l.surveyNumber, 
            price: l.marketInfo.askingPrice,
            village: l.village,
            district: l.district,
            state: l.state,
            area: l.area,
            landType: l.landType
          })) 
        }
      };

    } catch (error) {
      console.error('Recommendation error:', error);
      return {
        message: "I couldn't generate recommendations right now. Browse the marketplace to see available properties.",
        type: 'error'
      };
    }
  }

  /**
   * Handle location-based queries
   */
  async handleLocationQuery(message) {
    try {
      const filters = this.extractFilters(message);
      
      // Get unique locations with counts
      const locations = await Land.aggregate([
        { $match: { 'marketInfo.isForSale': true } },
        { $group: { 
          _id: { district: '$district', state: '$state' },
          count: { $sum: 1 },
          avgPrice: { $avg: '$marketInfo.askingPrice' }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      if (locations.length === 0) {
        return {
          message: "No locations found with available lands. Check back later!",
          type: 'text'
        };
      }

      const locationList = locations.map((loc, index) => 
        `${index + 1}. ${loc._id.district}, ${loc._id.state}\n   ` +
        `Available: ${loc.count} lands | Avg Price: ₹${Math.round(loc.avgPrice).toLocaleString('en-IN')}`
      ).join('\n\n');

      return {
        message: `📍 Popular Locations:\n\n${locationList}\n\nWould you like to see lands in any of these locations?`,
        type: 'location_list',
        data: { locations }
      };

    } catch (error) {
      console.error('Location query error:', error);
      return {
        message: "I couldn't fetch location data. Please try again.",
        type: 'error'
      };
    }
  }

  /**
   * Handle help queries
   */
  async handleHelp(message) {
    const helpTopics = {
      buy: "To buy land:\n1. Browse marketplace or search for properties\n2. Chat with the seller\n3. Make an offer\n4. Complete verification (if not done)\n5. Initiate buy request\n6. Admin approves the transaction\n7. Ownership transfers on blockchain",
      verify: "Verification process:\n1. Go to your profile\n2. Upload required documents (PAN, Aadhaar, etc.)\n3. Submit for admin review\n4. Wait for approval\n5. Once verified, you can claim land ownership",
      search: "Search tips:\n• Use filters for price, location, land type\n• Try: 'Show agricultural lands under 50 lakhs'\n• Ask: 'What's the average price in Bangalore?'\n• Request: 'Recommend good investment properties'",
      default: "I can help you with:\n• Finding lands (search, filter, recommend)\n• Price information and comparisons\n• Buying process guidance\n• Verification requirements\n• Location-based queries\n\nJust ask me anything!"
    };

    let topic = 'default';
    if (message.includes('buy') || message.includes('purchase')) topic = 'buy';
    else if (message.includes('verify') || message.includes('verification')) topic = 'verify';
    else if (message.includes('search') || message.includes('find')) topic = 'search';

    return {
      message: `📚 ${helpTopics[topic]}`,
      type: 'help'
    };
  }

  /**
   * Handle statistics queries
   */
  async handleStats(message) {
    try {
      const totalLands = await Land.countDocuments({ 'marketInfo.isForSale': true });
      const totalUsers = await User.countDocuments({ role: 'USER' });
      const totalTransactions = await LandTransaction.countDocuments();
      const pendingRequests = await BuyRequest.countDocuments({ status: 'PENDING_SELLER_CONFIRMATION' });

      return {
        message: `📈 Marketplace Statistics:\n\n` +
                `• Available Lands: ${totalLands}\n` +
                `• Registered Users: ${totalUsers}\n` +
                `• Completed Transactions: ${totalTransactions}\n` +
                `• Pending Buy Requests: ${pendingRequests}\n\n` +
                `The marketplace is active and growing!`,
        type: 'statistics',
        data: { totalLands, totalUsers, totalTransactions, pendingRequests }
      };

    } catch (error) {
      console.error('Stats error:', error);
      return {
        message: "I couldn't fetch statistics right now. Please try again.",
        type: 'error'
      };
    }
  }

  /**
   * Handle comparison queries
   */
  async handleComparison(message) {
    return {
      message: "To compare lands, please specify:\n• Two locations (e.g., 'Compare Bangalore vs Mysore')\n• Two land types (e.g., 'Compare agricultural vs residential')\n• Two specific properties by survey number",
      type: 'help'
    };
  }

  /**
   * Fallback handler - can integrate AI API here
   */
  async handleFallback(message, userId) {
    // Check if AI API is configured
    if (this.geminiEnabled && this.model) {
      try {
        const systemPrompt = `You are the PropChain Assistant, a specialized AI for the PropChain Blockchain Land Registry platform.
        Your goal is to help users understand land registration, property transactions, and use the platform's features.
        
        Platform Context:
        - It uses Ethereum blockchain (Smart Contracts) for ownership records.
        - Users must be verified (Aadhaar, PAN) to buy land.
        - Admin approves all transactions after seller/buyer confirmation.
        - Marketplace features: Search, List, Buy, Price Prediction (ML-based).
        
        Rules:
        - Be professional, helpful, and concise.
        - If asked about specific land data, refer them to use the "Search" feature.
        - If asked about legal advice, remind them you are an assistant and they should consult legal professionals.
        - Keep answers focused on the PropChain platform and Indian land registry context.
        
        User Question: ${message}`;

        const result = await this.model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        if (!text) throw new Error('Empty response from Gemini');

        return {
          message: text,
          type: 'ai_response'
        };
      } catch (error) {
        console.error('Gemini API error:', error.message);
        // If it's a quota or safety error, log it specifically
        if (error.message.includes('429') || error.message.includes('quota')) {
          console.error('Chatbot: Gemini API quota exceeded.');
        }
      }
    }

    // Rule-based fallback if Gemini is disabled or fails
    return {
      message: "I'm currently unable to access my advanced AI brain, but I can still help you with:\n" +
              "✓ Finding lands (search, filter, recommend)\n" +
              "✓ Price information and analysis\n" +
              "✓ Location-based queries\n" +
              "✓ Buying process guidance\n\n" +
              "What would you like to know?",
      type: 'fallback'
    };
  }

  /**
   * Format area for display
   */
  formatArea(area) {
    if (typeof area === 'object') {
      return `${area.acres || 0} Acres, ${area.guntas || 0} Guntas`;
    }
    return area || 'N/A';
  }

  /**
   * Handle AI price prediction queries
   */
  async handlePricePrediction(message, userId) {
    try {
      // Extract land ID or survey number from message (supports UUID format with hyphens)
      const landIdMatch = message.match(/land\s+([\w-]+)|survey\s+([\w-]+)|id\s+([\w-]+)/i);
      
      if (landIdMatch) {
        const landId = landIdMatch[1] || landIdMatch[2] || landIdMatch[3];
        
        // Try to find land by _id (MongoDB ObjectId), surveyNumber, or assetId
        let land = null;
        
        // First try as MongoDB ObjectId
        if (landId.match(/^[0-9a-fA-F]{24}$/)) {
          land = await Land.findById(landId);
        }
        
        // If not found, try surveyNumber
        if (!land) {
          land = await Land.findOne({ surveyNumber: landId });
        }
        
        // If still not found, try assetId
        if (!land) {
          land = await Land.findOne({ assetId: landId.toUpperCase() });
        }
        
        if (!land) {
          return {
            message: "I couldn't find that land. Please provide a valid land ID or ask me to search for lands first.",
            type: 'error'
          };
        }
        
        // Default coordinates for major districts if not available
        const districtCoordinates = {
          'Ernakulam': { lat: 9.9312, lng: 76.2673 },
          'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
          'Kozhikode': { lat: 11.2588, lng: 75.7804 },
          'Thrissur': { lat: 10.5276, lng: 76.2144 },
          'Bangalore': { lat: 12.9716, lng: 77.5946 },
          'Chennai': { lat: 13.0827, lng: 80.2707 },
          'Mumbai': { lat: 19.0760, lng: 72.8777 }
        };
        
        const defaultCoords = districtCoordinates[land.district] || { lat: 10.0, lng: 76.0 };
        
        // Prepare data for ML service
        const landData = {
          area_sqft: land.area.sqft || (land.area.acres * 43560) || 1000,
          latitude: land.coordinates?.latitude || defaultCoords.lat,
          longitude: land.coordinates?.longitude || defaultCoords.lng,
          district: land.district,
          state: land.state,
          land_type: land.landType,
          pincode: land.pincode || '000000'
        };
        
        // Call ML service
        const prediction = await predictLandPrice(landData);
        
        if (prediction) {
          const currentPrice = land.marketInfo?.askingPrice || 0;
          const priceDiff = currentPrice - prediction.predicted_price;
          const priceDiffPercent = currentPrice > 0 ? ((priceDiff / currentPrice) * 100).toFixed(1) : 0;
          
          return {
            message: `🤖 AI Price Prediction for ${land.surveyNumber}:\n\n` +
                    `• Predicted Value: ₹${Math.round(prediction.predicted_price).toLocaleString('en-IN')}\n` +
                    `• Price per Sqft: ₹${Math.round(prediction.price_per_sqft).toLocaleString('en-IN')}\n` +
                    `• Confidence: ${(prediction.confidence_score * 100).toFixed(0)}%\n` +
                    `• Price Range: ₹${Math.round(prediction.confidence_interval.min).toLocaleString('en-IN')} - ₹${Math.round(prediction.confidence_interval.max).toLocaleString('en-IN')}\n\n` +
                    (currentPrice > 0 ? 
                      `Current Asking Price: ₹${currentPrice.toLocaleString('en-IN')}\n` +
                      `${priceDiff > 0 ? '📈 Overpriced' : '📉 Underpriced'} by ₹${Math.abs(priceDiff).toLocaleString('en-IN')} (${Math.abs(priceDiffPercent)}%)\n\n` 
                      : '') +
                    `💡 Market Insights: ${prediction.market_insights?.market_activity || 'Active'} market with ${prediction.market_insights?.growth_rate || 8}% annual growth`,
            type: 'price_prediction',
            data: {
              prediction,
              land: {
                id: land._id,
                surveyNumber: land.surveyNumber,
                currentPrice
              }
            }
          };
        } else {
          // Fallback to simple estimation
          const estimatedPrice = this._estimatePrice(land);
          return {
            message: `💡 Estimated Price for ${land.surveyNumber}:\n\n` +
                    `Based on market averages in ${land.district}, the estimated value is around ₹${estimatedPrice.toLocaleString('en-IN')}.\n\n` +
                    `Note: This is a basic estimate. For AI-powered prediction, the ML service needs to be running.`,
            type: 'price_estimation'
          };
        }
      } else {
        // No land ID provided - try to extract details from natural language
        // Examples: "5 cent plot in Thrissur", "2 acre agricultural land in Kerala"
        
        // Extract area
        const areaMatch = message.match(/(\d+\.?\d*)\s*(cent|cents|acre|acres|sqft|sq\.?ft)/i);
        const area = areaMatch ? parseFloat(areaMatch[1]) : null;
        const areaUnit = areaMatch ? areaMatch[2].toLowerCase() : null;
        
        // Convert to sqft
        let areaSqft = 1000; // default
        if (area && areaUnit) {
          if (areaUnit.includes('cent')) {
            areaSqft = area * 435.6; // 1 cent = 435.6 sqft
          } else if (areaUnit.includes('acre')) {
            areaSqft = area * 43560; // 1 acre = 43560 sqft
          } else {
            areaSqft = area;
          }
        }
        
        // Extract location - search entire message for known districts
        const locations = ['ernakulam', 'thrissur', 'kozhikode', 'thiruvananthapuram', 'kannur', 
                          'bangalore', 'chennai', 'mumbai', 'delhi', 'pune', 'hyderabad'];
        let district = null;
        let state = 'Kerala'; // default
        
        const messageLower = message.toLowerCase();
        for (const loc of locations) {
          if (messageLower.includes(loc)) {
            district = loc.charAt(0).toUpperCase() + loc.slice(1);
            if (['bangalore', 'mysore'].includes(loc)) state = 'Karnataka';
            else if (['chennai', 'coimbatore'].includes(loc)) state = 'Tamil Nadu';
            else if (['mumbai', 'pune'].includes(loc)) state = 'Maharashtra';
            else if (loc === 'delhi') state = 'Delhi';
            else if (loc === 'hyderabad') state = 'Telangana';
            break;
          }
        }
        
        // Extract land type
        const landTypes = ['agricultural', 'residential', 'commercial', 'industrial'];
        let landType = 'RESIDENTIAL'; // default
        for (const type of landTypes) {
          if (message.toLowerCase().includes(type)) {
            landType = type.toUpperCase();
            break;
          }
        }
        
        if (!district) {
          return {
            message: "🤖 AI Price Prediction Available!\n\n" +
                    "I can predict land prices using machine learning!\n\n" +
                    "**Try asking:**\n" +
                    "• '5 cent plot in Thrissur'\n" +
                    "• '2 acre agricultural land in Ernakulam'\n" +
                    "• '1000 sqft residential plot in Bangalore'\n\n" +
                    "**Or search for a land first:**\n" +
                    "1. Search: 'Show lands in Kerala'\n" +
                    "2. Click 🤖 AI Price button on any land",
            type: 'help'
          };
        }
        
        // We have enough info to predict!
        const districtCoordinates = {
          'Ernakulam': { lat: 9.9312, lng: 76.2673 },
          'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
          'Kozhikode': { lat: 11.2588, lng: 75.7804 },
          'Thrissur': { lat: 10.5276, lng: 76.2144 },
          'Kannur': { lat: 11.8745, lng: 75.3704 },
          'Bangalore': { lat: 12.9716, lng: 77.5946 },
          'Chennai': { lat: 13.0827, lng: 80.2707 },
          'Mumbai': { lat: 19.0760, lng: 72.8777 }
        };
        
        const coords = districtCoordinates[district] || { lat: 10.0, lng: 76.0 };
        
        const landData = {
          area_sqft: areaSqft,
          latitude: coords.lat,
          longitude: coords.lng,
          district: district,
          state: state,
          land_type: landType,
          pincode: '000000'
        };
        
        // Call ML service with error handling
        let prediction = null;
        try {
          prediction = await predictLandPrice(landData);
        } catch (mlError) {
          console.log('ML service unavailable, using fallback estimation');
        }
        
        if (prediction && prediction.predicted_price) {
          console.log('Creating AI prediction response for:', area, areaUnit, district);
          const response = {
            message: `🤖 AI Price Prediction:

**Property:** ${area} ${areaUnit} ${landType.toLowerCase()} land in ${district}

• Predicted Value: ₹${Math.round(prediction.predicted_price).toLocaleString('en-IN')}
• Price per Sqft: ₹${Math.round(prediction.price_per_sqft).toLocaleString('en-IN')}
• Confidence: ${(prediction.confidence_score * 100).toFixed(0)}%
• Price Range: ₹${Math.round(prediction.confidence_interval.min).toLocaleString('en-IN')} - ₹${Math.round(prediction.confidence_interval.max).toLocaleString('en-IN')}

💡 Market Insights: ${prediction.market_insights?.market_activity || 'Active'} market with ${prediction.market_insights?.growth_rate || 8}% annual growth`,
            type: 'price_prediction',
            data: { prediction }
          };
          console.log('Response created:', JSON.stringify(response).substring(0, 200));
          return response;
        } else {
          // Fallback estimation
          const basePrices = { 'RESIDENTIAL': 3000, 'COMMERCIAL': 5000, 'AGRICULTURAL': 1500, 'INDUSTRIAL': 2500 };
          const basePrice = basePrices[landType] || 2000;
          const estimatedPrice = basePrice * areaSqft;
          
          return {
            message: `💡 Estimated Price:\n\n` +
                    `**Property:** ${area || '?'} ${areaUnit || 'units'} ${landType.toLowerCase()} land in ${district}\n\n` +
                    `Based on market averages, the estimated value is around ₹${estimatedPrice.toLocaleString('en-IN')}.\n\n` +
                    `Note: This is a basic estimate. For AI-powered prediction, ensure the ML service is running.`,
            type: 'price_estimation'
          };
        }
      }
    } catch (error) {
      console.error('Price prediction error:', error);
      return {
        message: "I encountered an error with price prediction. Please try again or use market price analysis instead.",
        type: 'error'
      };
    }
  }

  _estimatePrice(land) {
    // Simple fallback estimation
    const basePrices = {
      'RESIDENTIAL': 3000,
      'COMMERCIAL': 5000,
      'AGRICULTURAL': 1500,
      'INDUSTRIAL': 2500
    };
    const basePrice = basePrices[land.landType] || 2000;
    const area = land.area.sqft || (land.area.acres * 43560) || 1000;
    return basePrice * area;
  }
}

module.exports = new ChatbotService();
