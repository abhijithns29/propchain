const express = require('express');
const router = express.Router();
const chatbotService = require('../utils/chatbotService');
const { auth } = require('../middleware/auth');

/**
 * @route   POST /api/chatbot/message
 * @desc    Process chatbot message and get AI response
 * @access  Private
 */
router.post('/message', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log('Chatbot message from user:', userId, ':', message);

    // Process message through chatbot service
    const response = await chatbotService.processMessage(message, userId, context);

    console.log('Sending response to frontend:', JSON.stringify(response).substring(0, 300));
    
    res.json({
      success: true,
      ...response,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/suggestions
 * @desc    Get contextual suggestions based on current page
 * @access  Private
 */
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { page } = req.query;
    
    const suggestions = chatbotService.getContextualSuggestions({ page });

    res.json({
      success: true,
      suggestions,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/chatbot/stats
 * @desc    Get quick marketplace statistics
 * @access  Private
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const response = await chatbotService.handleStats('stats');

    res.json({
      success: true,
      message: response.message,
      data: response.data,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

module.exports = router;
