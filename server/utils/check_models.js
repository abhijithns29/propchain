require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: older SDKs might verify this differently, but let's try getting a model and querying, 
    // or just checking if there is a list method exposed on the main class or via a manager.
    // The current SDK doesn't expose listModels directly on the top-level class usually, 
    // it's often a separate ModelManager or similar.
    // Actually, looking at SDK docs, listModels usually requires `makeRequest` or using the REST API directly if not exposed.
    // However, for node SDK, it might not be straightforward to "list" models without a manager.
    // Let's try a direct fetch to the API using the key to be simpler and environment agnostic for the SDK details.
    
    // Using fetch for direct API call
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
        console.log('Available Models:');
        data.models.forEach(m => {
            if(m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                console.log(`- ${m.name}`);
            }
        });
    } else {
        console.log('No models found or error:', data);
    }

  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
