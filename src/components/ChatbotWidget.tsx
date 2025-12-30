import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Loader, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type?: string;
    data?: any;
}

interface ChatbotWidgetProps {
    context?: {
        page?: string;
        landId?: string;
    };
    onNavigateToLand?: (landId: string) => void;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ context = {}, onNavigateToLand }) => {
    const { auth } = useAuth();
    const userId = auth.user?.id || 'guest';

    // Make storage keys unique per user
    const CHAT_STORAGE_KEY = `chatbot_messages_${userId}`;
    const CHAT_OPEN_KEY = `chatbot_is_open_${userId}`;

    const [isOpen, setIsOpen] = useState(() => {
        const saved = localStorage.getItem(CHAT_OPEN_KEY);
        return saved === 'true';
    });
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        // Load messages from localStorage on mount
        const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                // Convert timestamp strings back to Date objects
                return parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
            } catch (error) {
                console.error('Failed to parse saved messages:', error);
                return [];
            }
        }
        return [];
    });
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // Save chat open state
    useEffect(() => {
        localStorage.setItem(CHAT_OPEN_KEY, isOpen.toString());
    }, [isOpen]);

    // Load initial greeting only if no saved messages
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const greeting: Message = {
                id: 'greeting',
                text: "Hello! 👋 I'm your AI land registry assistant. I can help you find properties, check prices, and guide you through the buying process. What would you like to know?",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages([greeting]);
            loadSuggestions();
        } else if (isOpen && messages.length > 0) {
            // Just load suggestions if we have existing messages
            loadSuggestions();
        }
    }, [isOpen]);

    // Clear chat on logout
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // If token is removed (logout), clear chat
            if (e.key === 'token' && e.newValue === null) {
                localStorage.removeItem(CHAT_STORAGE_KEY);
                localStorage.removeItem(CHAT_OPEN_KEY);
                setMessages([]);
                setIsOpen(false);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Load contextual suggestions
    const loadSuggestions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/chatbot/suggestions', {
                headers: { Authorization: 'Bearer ' + token },
                params: { page: context.page }
            });
            if (response.data.success) {
                setSuggestions(response.data.suggestions);
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    };

    // Clear chat history
    const clearChat = () => {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        const greeting: Message = {
            id: 'greeting-' + Date.now(),
            text: "Chat cleared! How can I help you today? 😊",
            sender: 'bot',
            timestamp: new Date()
        };
        setMessages([greeting]);
        loadSuggestions();
    };

    // Send message to chatbot
    const sendMessage = async (messageText?: string) => {
        const text = messageText || inputMessage.trim();
        if (!text) return;

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            text,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/chatbot/message',
                { message: text, context },
                { headers: { Authorization: 'Bearer ' + token } }
            );

            if (response.data.success) {
                console.log('Chatbot response received:', response.data);
                const botMessage: Message = {
                    id: `bot-${Date.now()}`,
                    text: response.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: response.data.type,
                    data: response.data.data
                };
                console.log('Bot message created:', botMessage);
                setMessages(prev => [...prev, botMessage]);

                if (response.data.suggestions) {
                    setSuggestions(response.data.suggestions);
                }
            }
        } catch (error: any) {
            console.error('Chatbot error:', error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                text: error.response?.data?.message || "I'm having trouble right now. Please try again.",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 group"
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'}`}
                    style={{ maxHeight: '90vh' }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">AI Assistant</h3>
                                <p className="text-xs text-white/80">Always here to help</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearChat}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Clear chat"
                                title="Clear chat history"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    {!isMinimized && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.sender === 'user' ? (
                                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-sm">
                                                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                                <p className="text-xs mt-1 text-white/70">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="max-w-[85%] space-y-2">
                                                {/* Bot text message */}
                                                <div className="bg-slate-800 text-slate-100 shadow-md rounded-2xl rounded-bl-sm border border-slate-700 px-4 py-3">
                                                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                                    <p className="text-xs mt-1 text-slate-400">
                                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>

                                                {/* Land cards if search results */}
                                                {message.type === 'search_results' && message.data?.lands && message.data.lands.length > 0 && (
                                                    <div className="space-y-2 mt-2">
                                                        {message.data.lands.slice(0, 5).map((land: any, idx: number) => (
                                                            <div
                                                                key={land.id}
                                                                className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-3 hover:shadow-lg transition-all cursor-pointer"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-bold text-white text-sm">
                                                                            Survey #{land.surveyNumber}
                                                                        </h4>
                                                                        <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                                                                            📍 {land.village}, {land.district}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-sm font-bold text-emerald-300 bg-slate-950/80 px-2 py-1 rounded-lg">
                                                                        ₹{(land.price / 100000).toFixed(1)}L
                                                                    </span>
                                                                </div>

                                                                <div className="flex gap-2 mb-2 flex-wrap">
                                                                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full">
                                                                        {land.landType || 'N/A'}
                                                                    </span>
                                                                    {land.area && (
                                                                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full">
                                                                            {typeof land.area === 'object'
                                                                                ? `${land.area.acres || 0}A ${land.area.guntas || 0}G`
                                                                                : land.area}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-300 rounded-full">
                                                                        {land.state}
                                                                    </span>
                                                                </div>

                                                                <div className="flex gap-2 mt-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            // Navigate to land details using callback
                                                                            if (onNavigateToLand) {
                                                                                onNavigateToLand(land.id);
                                                                            }
                                                                        }}
                                                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all hover:scale-[1.02]"
                                                                    >
                                                                        📍 View Details
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            sendMessage(`Predict price for land ${land.id}`);
                                                                        }}
                                                                        className="flex-1 px-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all hover:scale-[1.02]"
                                                                    >
                                                                        🤖 AI Price
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {message.data.lands.length > 5 && (
                                                            <p className="text-xs text-gray-500 text-center mt-2">
                                                                + {message.data.lands.length - 5} more properties
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-800 rounded-2xl px-4 py-3 shadow-md border border-slate-700">
                                            <div className="flex items-center gap-2">
                                                <Loader className="w-4 h-4 animate-spin text-emerald-600" />
                                                <span className="text-sm text-slate-300">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggestions */}
                            {suggestions.length > 0 && !isLoading && (
                                <div className="px-4 py-2 bg-slate-900 border-t border-slate-800">
                                    <p className="text-xs text-slate-400 mb-2">Suggested questions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-200"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-4 bg-slate-900 border-t border-slate-800 rounded-b-2xl">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything..."
                                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder:text-slate-400"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                                        aria-label="Send message"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatbotWidget;
