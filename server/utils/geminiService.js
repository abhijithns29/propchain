const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiVerificationService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize the Gemini AI service
   */
  initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.warn('⚠️  GEMINI_API_KEY not found. Auto-verification will be disabled.');
        return false;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-flash-latest (Gemini 1.5 Flash) which has higher rate limits
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest'
      });
      this.initialized = true;
      console.log('✅ Gemini AI service initialized for document verification');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
      return false;
    }
  }

  /**
   * Helper function to retry API calls on 429/503 errors
   */
  async retryWithBackoff(fn, retries = 3, initialDelay = 60000) {
    let currentDelay = initialDelay;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        // Check if error is 429 (Too Many Requests) or 503 (Service Unavailable)
        const isRateLimit = error.message.includes('429') || 
                            error.message.includes('Too Many Requests') ||
                            error.message.includes('503');
        
        if (i === retries - 1 || !isRateLimit) {
          throw error;
        }

        console.log(`⚠️  Rate limit hit. Retrying in ${currentDelay/1000}s... (Attempt ${i + 1}/${retries})`);
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        // Exponential backoff
        currentDelay *= 2;
      }
    }
  }

  /**
   * Convert file to base64 for Gemini API
   */  
  fileToGenerativePart(filePath, mimeType) {
    return {
      inlineData: {
        data: fs.readFileSync(filePath).toString('base64'),
        mimeType
      }
    };
  }

  /**
   * Analyze PAN Card
   */
  async analyzePANCard(filePath, userProvidedPAN) {
    try {
      const mimeType = this.getMimeType(filePath);
      const imagePart = this.fileToGenerativePart(filePath, mimeType);

      const prompt = `You are an expert document verification AI. Analyze this PAN card image and extract the following information:

1. PAN Number (format: ABCDE1234F)
2. Name on the card
3. Father's Name
4. Date of Birth
5. Document quality (clear/blurry/damaged)

User provided PAN: ${userProvidedPAN}

Please respond in JSON format:
{
  "extractedPAN": "extracted PAN number or null if not found",
  "name": "name on card",
  "fatherName": "father's name",
  "dob": "date of birth",
  "quality": "clear/blurry/damaged",
  "isValid": true/false,
  "matches": true/false (does extracted PAN match user provided PAN),
  "confidence": 0-100,
  "issues": ["list of issues found"]
}

Be strict in validation. If the image is unclear, blurry, or the PAN number doesn't match exactly, mark it as invalid.`;

      const result = await this.retryWithBackoff(() => this.model.generateContent([prompt, imagePart]));
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing PAN card:', error);
      return {
        extractedPAN: null,
        isValid: false,
        matches: false,
        confidence: 0,
        issues: ['Failed to analyze document: ' + error.message]
      };
    }
  }

  /**
   * Analyze Aadhaar Card
   */
  async analyzeAadhaarCard(filePath, userProvidedAadhaar) {
    try {
      const mimeType = this.getMimeType(filePath);
      const imagePart = this.fileToGenerativePart(filePath, mimeType);

      // Mask Aadhaar for privacy (show only last 4 digits)
      const maskedAadhaar = userProvidedAadhaar.replace(/\d(?=\d{4})/g, 'X');

      const prompt = `You are an expert document verification AI. Analyze this Aadhaar card image and extract the following information:

1. Aadhaar Number (12 digits, may be partially masked)
2. Name on the card
3. Date of Birth
4. Gender
5. Document quality (clear/blurry/damaged)

User provided Aadhaar (last 4 digits): ${userProvidedAadhaar.slice(-4)}

Please respond in JSON format:
{
  "extractedAadhaar": "extracted Aadhaar number or last 4 digits",
  "name": "name on card",
  "dob": "date of birth",
  "gender": "Male/Female",
  "quality": "clear/blurry/damaged",
  "isValid": true/false,
  "matches": true/false (does the last 4 digits match),
  "confidence": 0-100,
  "issues": ["list of issues found"]
}

Be strict in validation. If the image is unclear, blurry, or the visible digits don't match, mark it as invalid.`;

      const result = await this.retryWithBackoff(() => this.model.generateContent([prompt, imagePart]));
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing Aadhaar card:', error);
      return {
        extractedAadhaar: null,
        isValid: false,
        matches: false,
        confidence: 0,
        issues: ['Failed to analyze document: ' + error.message]
      };
    }
  }

  /**
   * Analyze Driving License
   */
  async analyzeDrivingLicense(filePath, userProvidedDL) {
    try {
      const mimeType = this.getMimeType(filePath);
      const imagePart = this.fileToGenerativePart(filePath, mimeType);

      const prompt = `You are an expert document verification AI. Analyze this Driving License image and extract:

1. License Number
2. Name on the license
3. Date of Birth
4. Document quality (clear/blurry/damaged)

User provided DL Number: ${userProvidedDL}

Please respond in JSON format:
{
  "extractedDL": "extracted DL number or null",
  "name": "name on license",
  "dob": "date of birth",
  "quality": "clear/blurry/damaged",
  "isValid": true/false,
  "matches": true/false,
  "confidence": 0-100,
  "issues": ["list of issues found"]
}`;

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing Driving License:', error);
      return {
        extractedDL: null,
        isValid: false,
        matches: false,
        confidence: 0,
        issues: ['Failed to analyze document: ' + error.message]
      };
    }
  }

  /**
   * Analyze Passport
   */
  async analyzePassport(filePath, userProvidedPassport) {
    try {
      const mimeType = this.getMimeType(filePath);
      const imagePart = this.fileToGenerativePart(filePath, mimeType);

      const prompt = `You are an expert document verification AI. Analyze this Passport image and extract:

1. Passport Number
2. Name on the passport
3. Date of Birth
4. Nationality
5. Document quality (clear/blurry/damaged)

User provided Passport Number: ${userProvidedPassport}

Please respond in JSON format:
{
  "extractedPassport": "extracted passport number or null",
  "name": "name on passport",
  "dob": "date of birth",
  "nationality": "nationality",
  "quality": "clear/blurry/damaged",
  "isValid": true/false,
  "matches": true/false,
  "confidence": 0-100,
  "issues": ["list of issues found"]
}`;

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing Passport:', error);
      return {
        extractedPassport: null,
        isValid: false,
        matches: false,
        confidence: 0,
        issues: ['Failed to analyze document: ' + error.message]
      };
    }
  }

  /**
   * Verify all submitted documents
   */
  async verifyDocuments(documents) {
    if (!this.initialized) {
      return {
        success: false,
        decision: 'MANUAL_REVIEW',
        reasoning: 'AI verification service not available. Manual review required.',
        confidence: 0
      };
    }

    const results = {
      documents: [],
      allValid: true,
      overallConfidence: 0,
      issues: []
    };

    try {
      // Analyze each document
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        // Add delay of 12 seconds between requests to avoid rate limits (5 RPM = 1 req/12s)
        if (i > 0) {
          console.log('⏳ Waiting 12 seconds before next document analysis to respect rate limits...');
          await new Promise(resolve => setTimeout(resolve, 12000));
        }

        let analysis = null;

        switch (doc.type) {
          case 'PAN':
            analysis = await this.analyzePANCard(doc.filePath, doc.userProvided);
            break;
          case 'AADHAAR':
            analysis = await this.analyzeAadhaarCard(doc.filePath, doc.userProvided);
            break;
          case 'DL':
            analysis = await this.analyzeDrivingLicense(doc.filePath, doc.userProvided);
            break;
          case 'PASSPORT':
            analysis = await this.analyzePassport(doc.filePath, doc.userProvided);
            break;
        }

        if (analysis) {
          results.documents.push({
            type: doc.type,
            analysis
          });

          if (!analysis.isValid || !analysis.matches) {
            results.allValid = false;
            results.issues.push(...(analysis.issues || []));
          }
        }
      }

      // Calculate overall confidence
      const confidences = results.documents.map(d => d.analysis.confidence || 0);
      results.overallConfidence = confidences.length > 0 
        ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
        : 0;

      // Make decision
      if (results.allValid && results.overallConfidence >= 70) {
        return {
          success: true,
          decision: 'APPROVED',
          reasoning: 'All documents verified successfully. Information matches user-provided data.',
          confidence: results.overallConfidence,
          details: results
        };
      } else if (results.overallConfidence < 50 || results.issues.length > 3) {
        return {
          success: true,
          decision: 'REJECTED',
          reasoning: this.generateRejectionReason(results),
          confidence: results.overallConfidence,
          details: results
        };
      } else {
        return {
          success: true,
          decision: 'MANUAL_REVIEW',
          reasoning: 'Some issues detected. Manual review recommended for final decision.',
          confidence: results.overallConfidence,
          details: results
        };
      }
    } catch (error) {
      console.error('Error in document verification:', error);
      return {
        success: false,
        decision: 'MANUAL_REVIEW',
        reasoning: 'Error during verification: ' + error.message,
        confidence: 0
      };
    }
  }

  /**
   * Generate detailed rejection reason
   */
  generateRejectionReason(results) {
    const reasons = [];

    results.documents.forEach(doc => {
      if (!doc.analysis.isValid || !doc.analysis.matches) {
        const docType = doc.type;
        if (doc.analysis.issues && doc.analysis.issues.length > 0) {
          reasons.push(`${docType}: ${doc.analysis.issues.join(', ')}`);
        } else if (!doc.analysis.matches) {
          reasons.push(`${docType}: Provided information does not match document`);
        } else {
          reasons.push(`${docType}: Document validation failed`);
        }
      }
    });

    if (reasons.length === 0) {
      return 'Document quality or information mismatch detected. Please resubmit with clear, valid documents.';
    }

    return 'Verification failed: ' + reasons.join('; ') + '. Please resubmit with correct documents.';
  }

  /**
   * Get MIME type from file path
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// Create singleton instance
const geminiService = new GeminiVerificationService();

module.exports = geminiService;
