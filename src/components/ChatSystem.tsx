import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, DollarSign, Check, X, Trash2, MoreVertical } from 'lucide-react';
import { Chat } from '../types';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import io, { Socket } from 'socket.io-client';
import { useRef } from 'react';

const ChatSystem: React.FC = () => {
  const { auth } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => console.log('ChatSystem: Connected to socket'));

    newSocket.on('new-message', (data) => {
      console.log('ChatSystem: New message received:', data);
      // If the message belongs to the current selected chat, update details
      // We could also just append to messages but loadChatDetails is more thorough for status/offers
      if (selectedChat?._id === data.chatId) {
        loadChatDetails(data.chatId);
      }
      // Refresh chat list to show last message in sidebar
      loadChats();
    });

    newSocket.on('message-deleted', (data) => {
      if (selectedChat?._id === data.chatId) {
        loadChatDetails(data.chatId);
      }
    });

    newSocket.on('user-typing', (data) => {
      if (selectedChat?._id === data.chatId) {
        const currentUserId = auth.user?._id || auth.user?.id;
        if (String(data.userId) !== String(currentUserId)) {
          setOtherUserTyping(data.isTyping);
        }
      }
    });

    newSocket.on('chat-deleted', (data) => {
      if (selectedChat?._id === data.chatId) {
        setSelectedChat(null);
      }
      loadChats();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [selectedChat?._id]);

  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('join-chat', {
        chatId: selectedChat._id,
        userId: auth.user?.id
      });
    }
  }, [socket, selectedChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadChatDetails(selectedChat._id);
    }
  }, [selectedChat?._id]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyChats();
      setChats(response.chats);
    } catch (error: any) {
      setError(error.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const loadChatDetails = async (chatId: string) => {
    try {
      const response = await apiService.getChat(chatId);
      setSelectedChat(response.chat);
    } catch (error: any) {
      setError(error.message || 'Failed to load chat details');
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', {
        chatId: selectedChat._id,
        userId: auth.user?._id || auth.user?.id
      });
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      stopTyping();
    }, 1000);

    setTypingTimeout(timeout);
  };

  const stopTyping = () => {
    if (!socket || !selectedChat) return;

    setIsTyping(false);
    socket.emit('typing-stop', {
      chatId: selectedChat._id,
      userId: auth.user?._id || auth.user?.id
    });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      await apiService.sendMessage(selectedChat._id, {
        message: newMessage,
        messageType: 'TEXT'
      });
      setNewMessage('');
      // No need to call loadChatDetails here as socket will handle it
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    }
  };

  const handleMakeOffer = async () => {
    if (!selectedChat || !offerAmount) return;

    try {
      await apiService.makeOffer(selectedChat._id, parseFloat(offerAmount));
      setOfferAmount('');
      setShowOfferInput(false);
      loadChatDetails(selectedChat._id);
    } catch (error: any) {
      setError(error.message || 'Failed to make offer');
    }
  };

  const handleCounterOffer = async () => {
    if (!selectedChat || !offerAmount) return;

    try {
      await apiService.makeCounterOffer(selectedChat._id, parseFloat(offerAmount));
      setOfferAmount('');
      setShowOfferInput(false);
      loadChatDetails(selectedChat._id);
    } catch (error: any) {
      setError(error.message || 'Failed to make counter offer');
    }
  };

  const handleAcceptOffer = async () => {
    if (!selectedChat) return;

    try {
      await apiService.acceptOffer(selectedChat._id);
      loadChatDetails(selectedChat._id);
      loadChats(); // Refresh chat list
    } catch (error: any) {
      setError(error.message || 'Failed to accept offer');
    }
  };

  const handleInitiateTransaction = async () => {
    if (!selectedChat) return;

    try {
      await apiService.initiateLandTransaction(selectedChat._id);
      loadChatDetails(selectedChat._id);
    } catch (error: any) {
      setError(error.message || 'Failed to initiate transaction');
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent selecting the chat when clicking delete

    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteChat(chatId);
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
      }
      loadChats(); // Refresh the list
    } catch (error: any) {
      setError(error.message || 'Failed to delete chat');
    }
  };

  const handleDeleteMessage = async (chatId: string, messageId: string) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await apiService.deleteMessage(chatId, messageId);
      loadChatDetails(chatId);
    } catch (error: any) {
      setError(error.message || 'Failed to delete message');
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price || price === 0) {
      return '₹0';
    }
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'OFFER':
      case 'COUNTER_OFFER':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'ACCEPTANCE':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'REJECTION':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <MessageCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  const canMakeOffer = (chat: Chat) => {
    return chat.buyer?.id === auth.user?.id &&
      (!chat.currentOffer || chat.currentOffer.status !== 'PENDING');
  };

  const canMakeCounterOffer = (chat: Chat) => {
    return chat.seller?.id === auth.user?.id &&
      chat.currentOffer &&
      chat.currentOffer.status === 'PENDING' &&
      chat.currentOffer.offeredBy?.id !== auth.user?.id;
  };

  const canAcceptOffer = (chat: Chat) => {
    return chat.currentOffer &&
      chat.currentOffer.status === 'PENDING' &&
      chat.currentOffer.offeredBy?.id !== auth.user?.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat System</h1>
        <p className="mt-1 text-sm text-gray-500">
          Communicate with buyers and sellers
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Chat List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                >
                  <div className="flex justify-between items-start mb-2 group">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chat.landId.village}, {chat.landId.district}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleDeleteChat(e, chat._id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${chat.status === 'DEAL_AGREED' ? 'bg-green-100 text-green-800' :
                        chat.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-200' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {chat.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Asset ID: {chat.landId?.assetId || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {chat.buyer?.id === auth.user?.id ? 'Seller' : 'Buyer'}: {' '}
                    {chat.buyer?.id === auth.user?.id ? (chat.seller?.fullName || 'Unknown') : (chat.buyer?.fullName || 'Unknown')}
                  </p>
                  {chat.currentOffer && chat.currentOffer.amount && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Current Offer: {formatPrice(chat.currentOffer.amount)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedChat.landId.village}, {selectedChat.landId.district}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Asset ID: {selectedChat.landId?.assetId || 'N/A'} • {' '}
                      {selectedChat.buyer?.id === auth.user?.id ? 'Seller' : 'Buyer'}: {' '}
                      {selectedChat.buyer?.id === auth.user?.id ? (selectedChat.seller?.fullName || 'Unknown') : (selectedChat.buyer?.fullName || 'Unknown')}
                    </p>
                  </div>
                  {selectedChat.landId.marketInfo.askingPrice && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(selectedChat.landId.marketInfo.askingPrice)}
                      </p>
                      <p className="text-sm text-gray-500">Asking Price</p>
                    </div>
                  )}
                </div>

                {/* Current Offer Status */}
                {selectedChat.currentOffer && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Current Offer: {formatPrice(selectedChat.currentOffer.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          By: {selectedChat.currentOffer.offeredBy?.fullName || 'Unknown'} • Status: {selectedChat.currentOffer.status}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {canAcceptOffer(selectedChat) && (
                          <button
                            onClick={handleAcceptOffer}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                        )}
                        {canMakeCounterOffer(selectedChat) && (
                          <button
                            onClick={() => setShowOfferInput(true)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Counter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Deal Agreed Actions */}
                {selectedChat.status === 'DEAL_AGREED' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Deal Agreed! Price: {formatPrice(selectedChat.agreedPrice!)}
                        </p>
                        <p className="text-xs text-green-600">
                          Ready to initiate official transaction
                        </p>
                      </div>
                      <button
                        onClick={handleInitiateTransaction}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Initiate Transaction
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedChat.messages.map((message, index) => {
                  const isOwnMessage = message.sender?.id === auth.user?.id;
                  return (
                    <div
                      key={index}
                      className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isOwnMessage ? 'bg-blue-600 text-white ml-2' : 'bg-gray-400 text-white mr-2'
                          }`}>
                          {message.sender?.fullName ? message.sender.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* Message bubble */}
                        <div
                          className={`relative group max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-md shadow-sm'
                            : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                            }`}
                        >
                          {/* 3-dot menu for deletion (only for own messages) */}
                          {isOwnMessage && (
                            <div className="absolute top-1 right-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(selectedChat._id, (message as any)._id);
                                }}
                                className="p-1.5 opacity-40 group-hover:opacity-100 hover:bg-white/20 rounded-full transition-all flex items-center justify-center text-white"
                                title="Delete Message"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Message type icon and sender name */}
                          <div className="flex items-center mb-1 pr-6">
                            {getMessageTypeIcon(message.messageType)}
                            <span className="ml-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                              {message.sender?.fullName || 'Unknown'}
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed text-left">{message.message}</p>

                          {message.offerAmount && (
                            <p className="text-xs mt-1 font-medium">
                              Amount: {formatPrice(message.offerAmount)}
                            </p>
                          )}

                          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-emerald-100' : 'text-gray-500'
                            }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {otherUserTyping && (
                  <div className="flex mb-2 justify-start">
                    <div className="bg-white text-gray-600 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[#4154f1] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#4154f1] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-[#4154f1] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2 text-nowrap">typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Offer Input */}
              {showOfferInput && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Enter offer amount"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={canMakeCounterOffer(selectedChat) ? handleCounterOffer : handleMakeOffer}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      {canMakeCounterOffer(selectedChat) ? 'Counter' : 'Offer'}
                    </button>
                    <button
                      onClick={() => {
                        setShowOfferInput(false);
                        setOfferAmount('');
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                  {canMakeOffer(selectedChat) && (
                    <button
                      onClick={() => setShowOfferInput(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;