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
                    className="fixed bottom-6 right-6 w-16 h-16 bg-[#4154f1] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 group"
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4154f1] rounded-full border-2 border-white animate-pulse"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'}`}
                    style={{ maxHeight: '90vh' }}
                >
                    {/* Header */}
                    <div className="bg-[#4154f1] text-white p-4 rounded-t-2xl flex items-center justify-between">
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
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.sender === 'user' ? (
                                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#4154f1] text-white rounded-br-sm shadow-md">
                                                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                                <p className="text-xs mt-1 text-white/70">
                                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="max-w-[85%] space-y-2">
                                                {/* Bot text message */}
                                                <div className="bg-white text-[#012970] shadow-md rounded-2xl rounded-bl-sm border border-gray-200 px-4 py-3">
                                                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                                    <p className="text-xs mt-1 text-gray-500">
                                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>

                                                {/* Land cards if search results */}
                                                {message.type === 'search_results' && message.data?.lands && message.data.lands.length > 0 && (
                                                    <div className="space-y-2 mt-2">
                                                        {message.data.lands.slice(0, 5).map((land: any, idx: number) => (
                                                            <div
                                                                key={land.id}
                                                                className="bg-white border border-blue-200 rounded-xl p-3 hover:shadow-lg hover:border-[#4154f1] transition-all cursor-pointer"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-bold text-[#012970] text-sm">
                                                                            Survey #{land.surveyNumber}
                                                                        </h4>
                                                                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                                                            📍 {land.village}, {land.district}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-sm font-bold text-[#4154f1] bg-blue-50 px-2 py-1 rounded-lg">
                                                                        ₹{(land.price / 100000).toFixed(1)}L
                                                                    </span>
                                                                </div>

                                                                <div className="flex gap-2 mb-2 flex-wrap">
                                                                    <span className="text-xs px-2 py-1 bg-blue-50 text-[#4154f1] rounded-full border border-blue-100">
                                                                        {land.landType || 'N/A'}
                                                                    </span>
                                                                    {land.area && (
                                                                        <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                                                                            {typeof land.area === 'object'
                                                                                ? `${land.area.acres || 0}A ${land.area.guntas || 0}G`
                                                                                : land.area}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
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
                                                                        className="flex-1 px-3 py-2 bg-[#4154f1] text-white text-xs font-bold rounded-lg hover:bg-[#3346d8] shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                                                                    >
                                                                        📍 View Details
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            sendMessage(`Predict price for land ${land.id}`);
                                                                        }}
                                                                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-all hover:scale-[1.02] border border-gray-200"
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
                                        <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <Loader className="w-4 h-4 animate-spin text-[#4154f1]" />
                                                <span className="text-sm text-gray-600">Thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>


                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything..."
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 text-[#012970] rounded-full focus:outline-none focus:ring-2 focus:ring-[#4154f1] focus:border-transparent text-sm placeholder:text-gray-400"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="p-3 bg-[#4154f1] text-white rounded-full hover:bg-[#3346d8] hover:shadow-lg shadow-md shadow-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
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
