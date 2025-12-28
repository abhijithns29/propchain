require('dotenv').config({ path: '../.env' });
const fs = require('fs');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    fs.writeFileSync('models.txt', 'No API key found');
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.models) {
        const models = data.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name)
            .join('\n');
        fs.writeFileSync('models.txt', models);
        console.log('Models written to models.txt');
    } else {
        fs.writeFileSync('models.txt', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    fs.writeFileSync('models.txt', 'Error: ' + error.message);
  }
}

listModels();
