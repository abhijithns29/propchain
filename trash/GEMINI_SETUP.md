# IMPORTANT: Add Gemini API Key to .env

To enable automated document verification, you need to add your Gemini API key to the `.env` file in the `server` directory.

## Steps:

1. Get your Gemini API key from: https://aistudio.google.com/app/apikey

2. Open `server/.env` file and add these lines:

```env
# Gemini AI for Document Verification
GEMINI_API_KEY=your_actual_api_key_here
AUTO_VERIFY_ENABLED=true
```

3. Replace `your_actual_api_key_here` with your actual API key from Google AI Studio

4. Restart the server for changes to take effect

## How it works:

- When a user submits verification documents, the Gemini AI will automatically:
  - Analyze uploaded images (PAN, Aadhaar, DL, Passport)
  - Extract text from documents using OCR
  - Compare extracted data with user-provided information
  - Auto-approve if everything matches (confidence >= 70%)
  - Auto-reject with detailed reasons if mismatches found
  - Flag for manual review if confidence is between 50-70%

- Admin can view AI decisions and manually override if needed
- All AI decisions are logged with confidence scores and reasoning
