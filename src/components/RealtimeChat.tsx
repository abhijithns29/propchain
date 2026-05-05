import React, { useState, useEffect, useRef } from 'react';
import { Send, X, DollarSign, Check, X as XIcon, MoreVertical } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import io, { Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: string;
  message: string;
  messageType: string;
  timestamp: Date;
  isRead: boolean;
}

interface Chat {
  _id: string;
  landId: string;
  buyer: any;
  seller: any;
  messages: Message[];
  currentOffer?: any;
  status: string;
}

interface RealtimeChatProps {
  chatId?: string;
  landId?: string;
  recipientId?: string;
  recipientName?: string;
  onClose?: () => void;
  showHeader?: boolean;
  autoFillMessage?: string | null;
  onAutoFillUsed?: () => void;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  chatId,
  landId,
  recipientId,
  recipientName,
  onClose,
  showHeader = true,
  autoFillMessage,
  onAutoFillUsed
}) => {
  const { auth } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [currentOffer, setCurrentOffer] = useState<any>(null);
  const [buyRequestStatus, setBuyRequestStatus] = useState<'NONE' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'>('NONE');
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingChatRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle auto-fill message
  useEffect(() => {
    if (autoFillMessage && !newMessage.trim()) {
      setNewMessage(autoFillMessage);
      if (onAutoFillUsed) {
        onAutoFillUsed();
      }
    }
  }, [autoFillMessage, newMessage, onAutoFillUsed]);

  useEffect(() => {
    initializeSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [auth.user?.id]); // Only re-login if user changes

  // Use a Ref to keep track of the socket to avoid stale closures in listeners
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  const initializeSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('RealtimeChat: Connected to chat server');
    });

    newSocket.on('error', (error) => {
      console.error('RealtimeChat: Socket error:', error);
      setError(error.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  // Socket event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    // Remove existing listeners to avoid duplicates when chatId changes
    socket.off('new-message');
    socket.off('user-typing');
    socket.off('message-deleted');
    socket.off('chat-deleted');

    socket.on('new-message', (data) => {
      console.log('RealtimeChat: New message via socket:', data);

      // ONLY process messages for THIS chat
      if (data.chatId !== chatId) {
        console.log('RealtimeChat: Message for different chat, ignoring');
        return;
      }

      try {
        const currentUserId = auth.user?._id || auth.user?.id;
        const sender = data.message.sender;
        const messageSenderId = typeof sender === 'string' ? sender : (sender?._id || sender?.id);

        console.log('RealtimeChat: Comparing IDs:', { messageSenderId, currentUserId });

        // If message is from current user, replace the temporary message
        if (String(messageSenderId) === String(currentUserId)) {
          setMessages(prev => {
            const filteredMessages = prev.filter(msg =>
              msg && msg._id && !(msg._id.startsWith('temp-') && String(msg.sender) === String(currentUserId))
            );

            const messageExists = filteredMessages.some(msg => msg._id === data.message._id);
            if (!messageExists) {
              return [...filteredMessages, data.message];
            }
            return filteredMessages;
          });
        } else {
          setMessages(prev => {
            const messageExists = prev.some(msg => msg._id === data.message._id);
            if (!messageExists) {
              return [...prev, data.message];
            }
            return prev;
          });
        }

        // Update current offer if applicable
        if (data.message.messageType === 'OFFER' && data.message.offerAmount) {
          setCurrentOffer({
            amount: data.message.offerAmount,
            offeredBy: messageSenderId,
            status: 'PENDING'
          });
        } else if (data.message.messageType === 'ACCEPTANCE') {
          setCurrentOffer((prev: any) => prev ? { ...prev, status: 'ACCEPTED' } : null);
        } else if (data.message.messageType === 'REJECTION') {
          setCurrentOffer((prev: any) => prev ? { ...prev, status: 'REJECTED' } : null);
        }
      } catch (err) {
        console.error('RealtimeChat: Error handling new-message:', err);
      }
    });

    socket.on('user-typing', (data) => {
      if (data.chatId === chatId) {
        const currentUserId = auth.user?._id || auth.user?.id;
        if (String(data.userId) !== String(currentUserId)) {
          setOtherUserTyping(data.isTyping);
        }
      }
    });

    socket.on('message-deleted', (data) => {
      if (data.chatId === chatId) {
        console.log('RealtimeChat: Message deleted via socket:', data);
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    });

    socket.on('chat-deleted', (data) => {
      if (data.chatId === chatId) {
        console.log('RealtimeChat: Chat deleted via socket:', data);
        if (onClose) onClose();
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('message-deleted');
      socket.off('chat-deleted');
    };
  }, [socket, chatId, auth.user?._id, auth.user?.id]);

  useEffect(() => {
    if (socket && chatId) {
      joinChatRoom();
    }
  }, [socket, chatId]);

  const joinChatRoom = () => {
    const socket = socketRef.current;
    if (socket && chatId) {
      console.log('RealtimeChat: Joining room:', chatId);
      socket.emit('join-chat', {
        chatId: chatId,
        userId: auth.user?._id || auth.user?.id
      });
    }
  };

  const loadChat = async () => {
    // Prevent duplicate calls
    if (loadingChatRef.current) {
      console.log('loadChat already in progress, skipping...');
      return;
    }

    try {
      loadingChatRef.current = true;
      setLoading(true);
      let chatData;

      if (chatId) {
        // Load existing chat
        console.log('Loading existing chat:', chatId);
        chatData = await apiService.getChat(chatId);
      } else if (landId) {
        // Start new chat - only need landId, recipientId is optional
        console.log('Starting chat for landId:', landId);
        chatData = await apiService.startChat(landId);
      }

      console.log('Chat data received:', chatData);

      if (chatData && chatData.chat) {
        console.log('Chat object structure:', chatData.chat);
        console.log('Chat ID:', chatData.chat._id);
        console.log('Current offer from chat:', chatData.chat.currentOffer);
        setChat(chatData.chat);
        setMessages(chatData.chat.messages || []);

        // Set current offer if it exists
        if (chatData.chat.currentOffer) {
          setCurrentOffer(chatData.chat.currentOffer);
        } else {
          // Fallback: check if there's a recent offer message
          const recentOfferMessage = chatData.chat.messages
            ?.filter((msg: any) => msg.messageType === 'OFFER')
            ?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          if (recentOfferMessage && recentOfferMessage.offerAmount) {
            // Check if this offer hasn't been accepted or rejected yet
            const hasResponse = chatData.chat.messages?.some((msg: any) =>
              (msg.messageType === 'ACCEPTANCE' || msg.messageType === 'REJECTION') &&
              new Date(msg.timestamp).getTime() > new Date(recentOfferMessage.timestamp).getTime()
            );

            if (!hasResponse) {
              setCurrentOffer({
                amount: recentOfferMessage.offerAmount,
                offeredBy: recentOfferMessage.sender,
                status: 'PENDING'
              });
            }
          }
        }

        // Load existing buy request status
        await loadExistingBuyRequest(chatData.chat._id);
      } else {
        setError('No chat data received');
      }
    } catch (error: any) {
      console.error('Load chat error:', error);
      setError(error.message || 'Failed to load chat');
    } finally {
      setLoading(false);
      loadingChatRef.current = false;
    }
  };

  useEffect(() => {
    loadChat();
  }, [chatId, landId, recipientId]);

  const sendMessage = async () => {
    try {
      if (!newMessage.trim() || !socket || !chat) return;

      const chatId = chat._id;
      if (!chatId) {
        setError('Chat ID is missing');
        return;
      }

      const messageText = newMessage.trim();

      // Add message optimistically to UI immediately
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: auth.user?.id || '',
        message: messageText,
        messageType: 'TEXT' as const,
        timestamp: new Date(),
        isRead: false
      };

      setMessages(prev => {
        if (!Array.isArray(prev)) return [optimisticMessage];
        return [...prev, optimisticMessage];
      });
      setNewMessage('');
      stopTyping();

      console.log('Sending message to chat:', chatId);
      const messageData = {
        message: messageText,
        messageType: 'TEXT'
      };
      const response = await apiService.sendMessage(chatId, messageData);
      console.log('Message API response:', response);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
    }
  };

  // Offer functions
  const sendOffer = async () => {
    try {
      // Clear any previous errors
      setError('');

      if (!offerAmount.trim() || !chat) {
        setError('Please enter a valid amount and ensure chat is loaded');
        return;
      }

      const amount = parseFloat(offerAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount greater than 0');
        return;
      }

      if (amount < 1000) {
        setError('Minimum offer amount is ₹1,000');
        return;
      }

      const chatId = chat._id;
      if (!chatId) {
        setError('Chat ID is missing');
        return;
      }

      // Add offer message optimistically
      const optimisticOffer = {
        _id: `temp-offer-${Date.now()}`,
        sender: auth.user?.id || '',
        message: `Offered ₹${amount.toLocaleString()}`,
        messageType: 'OFFER' as const,
        timestamp: new Date(),
        isRead: false,
        offerAmount: amount
      };

      setMessages(prev => [...prev, optimisticOffer]);
      setOfferAmount('');
      setShowOfferInput(false);

      // Send offer via API endpoint
      console.log('Sending offer via API:', { chatId, amount });
      const response = await apiService.makeOffer(chatId, amount);
      console.log('Offer API response:', response);

      // Update current offer
      setCurrentOffer({
        amount,
        offeredBy: auth.user?.id,
        status: 'PENDING'
      });

    } catch (error: any) {
      console.error('Error sending offer:', error);
      setError(error.message || 'Failed to send offer');
    }
  };

  const respondToOffer = async (action: 'ACCEPT' | 'REJECT') => {
    try {
      console.log('respondToOffer called:', { action, socket: !!socket, chat: !!chat, currentOffer: !!currentOffer });

      if (!chat || !currentOffer) {
        console.log('Missing chat or currentOffer');
        return;
      }

      const chatId = chat._id;
      if (!chatId) {
        setError('Chat ID is missing');
        return;
      }

      const responseMessage = action === 'ACCEPT'
        ? `Accepted offer of ₹${currentOffer.amount?.toLocaleString() || '0'}`
        : `Rejected offer of ₹${currentOffer.amount?.toLocaleString() || '0'}`;

      // Add response message optimistically
      const optimisticResponse = {
        _id: `temp-response-${Date.now()}`,
        sender: auth.user?.id || '',
        message: responseMessage,
        messageType: action === 'ACCEPT' ? 'ACCEPTANCE' as const : 'REJECTION' as const,
        timestamp: new Date(),
        isRead: false
      };

      setMessages(prev => [...prev, optimisticResponse]);

      // Send response via API endpoint
      if (action === 'ACCEPT') {
        console.log('Accepting offer via API:', chatId);
        const response = await apiService.acceptOffer(chatId);
        console.log('Accept offer API response:', response);
      } else {
        // For rejection, we can use the regular message endpoint
        console.log('Rejecting offer via message API:', { chatId, responseMessage });
        const messageData = {
          message: responseMessage,
          messageType: 'REJECTION'
        };
        const response = await apiService.sendMessage(chatId, messageData);
        console.log('Reject offer API response:', response);
      }

      // Update current offer status
      setCurrentOffer((prev: any) => prev ? { ...prev, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' } : null);

    } catch (error: any) {
      console.error('Error responding to offer:', error);
      setError(error.message || 'Failed to respond to offer');
    }
  };

  const isBuyer = () => {
    return chat && auth.user?.id === chat.buyer._id;
  };

  const isSeller = () => {
    const isUserSeller = chat && auth.user?.id === chat.seller._id;
    console.log('isSeller check:', {
      chatExists: !!chat,
      authUserId: auth.user?.id,
      sellerId: chat?.seller?._id,
      isUserSeller
    });
    return isUserSeller;
  };

  // Buy request functions
  const initiateBuyRequest = async () => {
    try {
      if (!chat || !currentOffer) return;

      const chatId = chat._id;
      console.log('Initiating buy request:', {
        chatId,
        offerAmount: currentOffer.amount,
        landId: chat.landId,
        sellerId: chat.seller?._id,
        buyerId: chat.buyer?._id
      });

      // Call API to create buy request
      const requestData = {
        chatId,
        landId: typeof chat.landId === 'object' && chat.landId ? (chat.landId as any)._id : chat.landId,
        sellerId: chat.seller._id,
        buyerId: chat.buyer._id,
        agreedPrice: currentOffer.amount
      };

      console.log('Sending buy request with data:', requestData);
      const response = await apiService.createBuyRequest(requestData);
      console.log('Buy request created:', response);

      setBuyRequestStatus('PENDING');

      // Add message to chat
      const messageData = {
        message: `Buy request initiated for ₹${currentOffer.amount?.toLocaleString() || '0'}`,
        messageType: 'BUY_REQUEST'
      };
      console.log('Sending buy request message:', messageData);
      await apiService.sendMessage(chatId, messageData);

    } catch (error: any) {
      console.error('Error creating buy request:', error);

      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        // Buy request already exists, load it instead
        console.log('Buy request already exists, loading existing request...');
        await loadExistingBuyRequest(chatId || '');
        setError('Buy request already exists for this chat. Loading existing request...');
        setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
      } else {
        setError(error.message || 'Failed to initiate buy request');
      }
    }
  };

  const confirmBuyRequest = async () => {
    try {
      if (!chat) return;

      // Show 2FA modal
      console.log('Showing 2FA modal');
      setShowTwoFactorModal(true);
      setError('');

    } catch (error: any) {
      console.error('Error showing 2FA modal:', error);
      setError(error.message || 'Failed to open 2FA modal');
    }
  };

  const handleTwoFactorSubmit = async () => {
    try {
      if (!chat) return;

      // If 2FA code is empty, show error
      if (!twoFactorCode.trim()) {
        setError('Please enter a valid 2FA code');
        return;
      }

      const chatId = chat._id;
      console.log('Confirming buy request with 2FA:', chatId, twoFactorCode);

      // Call API to confirm buy request with 2FA code
      const response = await apiService.confirmBuyRequest(chatId, twoFactorCode);
      console.log('Buy request confirmed:', response);

      setBuyRequestStatus('CONFIRMED');
      setShowTwoFactorModal(false);
      setTwoFactorCode('');
      setError('');

    } catch (error: any) {
      console.error('Error confirming buy request:', error);

      // Handle specific 2FA errors
      if (error.message && error.message.includes('Invalid or expired')) {
        setError('Invalid or expired 2FA code. Please try again.');
        setTwoFactorCode(''); // Clear the invalid code
      } else {
        setError(error.message || 'Failed to confirm buy request');
      }
    }
  };

  const closeTwoFactorModal = () => {
    setShowTwoFactorModal(false);
    setTwoFactorCode('');
    setError('');
  };

  const loadExistingBuyRequest = async (chatId: string) => {
    try {
      console.log('Loading existing buy request for chat:', chatId);
      const response = await apiService.getBuyRequest(chatId);
      if (response.buyRequest) {
        console.log('Existing buy request found:', response.buyRequest);
        setBuyRequestStatus(response.buyRequest.status === 'PENDING_SELLER_CONFIRMATION' ? 'PENDING' :
          response.buyRequest.status === 'PENDING_ADMIN_APPROVAL' ? 'CONFIRMED' :
            response.buyRequest.status === 'APPROVED' ? 'COMPLETED' : 'NONE');
      }
    } catch (error: any) {
      // It's okay if no buy request exists yet
      console.log('No existing buy request found for chat:', chatId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing-start', {
        chatId: chatId,
        userId: auth.user?._id || auth.user?.id
      });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      stopTyping();
    }, 1000);

    setTypingTimeout(timeout);
  };

  const stopTyping = () => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    setIsTyping(false);
    socket.emit('typing-stop', {
      chatId: chatId,
      userId: auth.user?._id || auth.user?.id
    });

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chat || !window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await apiService.deleteMessage(chat._id, messageId);
      // Update local state to remove the message
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error: any) {
      console.error('Error deleting message:', error);
      setError(error.message || 'Failed to delete message');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getOtherUser = () => {
    if (!chat) return null;
    return auth.user?.id === chat.buyer._id ? chat.seller : chat.buyer;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Error fallback if chat failed to load completely
  if (error && !chat) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-center text-sm">Error: {error}</p>
        </div>
        <button
          onClick={() => {
            setError('');
            loadChat();
          }}
          className="px-4 py-2 bg-[#4154f1] text-white rounded-md hover:bg-[#3346d8] text-sm font-semibold shadow-md shadow-blue-500/40 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No chat found</p>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header - Only show if showHeader is true */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4154f1] to-[#3346d8] rounded-full flex items-center justify-center text-white font-semibold shadow-md shadow-blue-500/40">
              {otherUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-[#012970]">{otherUser?.fullName || recipientName}</h3>
              <p className="text-sm text-gray-500">
                {otherUser?.verificationStatus === 'VERIFIED' ? '✓ Verified' : 'Unverified'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">

          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && !showOfferInput && !showTwoFactorModal && (
        <div className="bg-red-50 p-3 border-b border-red-200 flex justify-between items-center z-10 relative">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={() => setError('')} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{
          maxHeight: 'calc(100vh - 250px)',
          minHeight: '300px',
          scrollbarWidth: 'thin'
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            // Ensure proper user ID comparison for message alignment
            const currentUserId = auth.user?.id;
            // Handle different sender formats - could be string, object with id, or object with _id
            let senderId;
            if (typeof message.sender === 'string') {
              senderId = message.sender;
            } else if (message.sender && typeof message.sender === 'object') {
              senderId = (message.sender as any)?.id || (message.sender as any)?._id || message.sender;
            } else {
              senderId = message.sender;
            }

            // Convert both to strings for comparison
            const currentUserIdStr = String(currentUserId);
            const senderIdStr = String(senderId);
            const isOwnMessage = currentUserIdStr === senderIdStr;

            return (
              <div
                key={message._id}
                className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {/* Message bubble */}
                <div
                  className={`relative group max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl shadow-lg transition-all ${message.messageType === 'OFFER'
                    ? isOwnMessage
                      ? 'bg-gradient-to-br from-[#4154f1] to-[#3346d8] text-white rounded-br-md shadow-blue-500/30'
                      : 'bg-white text-[#4154f1] rounded-bl-md border border-blue-100 shadow-sm'
                    : message.messageType === 'ACCEPTANCE'
                      ? isOwnMessage
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-md shadow-green-500/30'
                        : 'bg-white text-green-600 rounded-bl-md border border-green-200 shadow-sm'
                      : message.messageType === 'REJECTION'
                        ? isOwnMessage
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-md shadow-red-500/30'
                          : 'bg-white text-red-600 rounded-bl-md border border-red-200 shadow-sm'
                        : isOwnMessage
                          ? 'bg-gradient-to-br from-[#4154f1] to-[#3346d8] text-white rounded-br-md shadow-blue-500/30'
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-sm'
                    }`}
                  title={`Message from: ${isOwnMessage ? 'YOU (Right Side)' : 'OTHER (Left Side)'}`}
                >
                  {/* Delete menu for own messages */}
                  {isOwnMessage && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteMessage(message._id)}
                        className="p-1 hover:bg-black/10 rounded-full text-white/70 hover:text-white"
                        title="Delete message"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Offer message with special styling */}
                  {message.messageType === 'OFFER' && (
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-semibold">OFFER</span>
                    </div>
                  )}

                  {/* Acceptance message with special styling */}
                  {message.messageType === 'ACCEPTANCE' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-semibold">ACCEPTED</span>
                    </div>
                  )}

                  {/* Rejection message with special styling */}
                  {message.messageType === 'REJECTION' && (
                    <div className="flex items-center gap-2 mb-1">
                      <XIcon className="w-4 h-4" />
                      <span className="text-xs font-semibold">REJECTED</span>
                    </div>
                  )}

                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <p
                    className={`text-xs mt-1 text-right opacity-75 ${isOwnMessage
                      ? 'text-white'
                      : 'text-gray-500'
                      }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}

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
                <span className="text-xs text-gray-500 ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Offer Input Section */}
      {showOfferInput && isBuyer() && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => {
                setOfferAmount(e.target.value);
                setError(''); // Clear error when user types
              }}
              placeholder="Enter offer amount (₹)"
              className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-full focus:ring-2 focus:ring-[#4154f1] focus:border-transparent placeholder-gray-400"
              min="1000"
              step="0.01"
            />
            <button
              onClick={sendOffer}
              disabled={!offerAmount.trim() || isNaN(parseFloat(offerAmount)) || parseFloat(offerAmount) < 1000}
              className="px-4 py-2 bg-[#4154f1] text-white rounded-full hover:bg-[#3346d8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold shadow-md shadow-blue-500/40"
            >
              <DollarSign className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowOfferInput(false);
                setOfferAmount('');
                setError('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Minimum offer: ₹1,000</p>
        </div>
      )}

      {/* Current Offer Actions (for seller) */}
      {console.log('Offer actions debug:', {
        currentOffer: !!currentOffer,
        offerStatus: currentOffer?.status,
        isUserSeller: isSeller(),
        shouldShowActions: currentOffer && currentOffer.status === 'PENDING' && isSeller()
      })}
      {currentOffer && currentOffer.status === 'PENDING' && isSeller() && (
        <div className="p-4 border-t border-amber-200 bg-amber-50">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-700">
              <strong className="text-amber-700">₹{currentOffer.amount?.toLocaleString() || '0'}</strong> offer received
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => respondToOffer('ACCEPT')}
              className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-500 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md shadow-green-500/40"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={() => respondToOffer('REJECT')}
              className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md shadow-red-500/40"
            >
              <XIcon className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Buy Request Actions (for buyer after offer accepted) */}
      {currentOffer && currentOffer.status === 'ACCEPTED' && isBuyer() && buyRequestStatus === 'NONE' && (
        <div className="p-4 border-t border-teal-200 bg-teal-50">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-700">
              Offer accepted! Ready to proceed with purchase?
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={initiateBuyRequest}
              className="px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-500 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md shadow-teal-500/40"
            >
              <DollarSign className="w-4 h-4" />
              Initiate Buy Request
            </button>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to stop this transaction? This action cannot be undone.')) {
                  try {
                    const chatId = chat?._id || '';
                    await apiService.cancelBuyRequest(chatId, 'Buyer cancelled the transaction');
                    setBuyRequestStatus('NONE');
                    setCurrentOffer(null);
                    setError('');
                    // Add a message to chat
                    const messageData = {
                      message: 'Transaction cancelled by buyer',
                      messageType: 'SYSTEM'
                    };
                    await apiService.sendMessage(chatId, messageData);
                  } catch (error: any) {
                    console.error('Error cancelling transaction:', error);
                    setError(error.message || 'Failed to cancel transaction');
                  }
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-500/40"
              title="Stop the transaction"
            >
              <X className="w-4 h-4" />
              Stop the Transaction
            </button>
          </div>
        </div>
      )}

      {/* Buy Request Status (for seller) */}
      {buyRequestStatus === 'PENDING' && isSeller() && (
        <div className="p-4 border-t border-orange-200 bg-orange-50">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-700">
              <strong className="text-orange-600">Buy request pending</strong> your confirmation
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={confirmBuyRequest}
              className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md shadow-orange-500/40"
            >
              <Check className="w-4 h-4" />
              Confirm Buy Request
            </button>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {buyRequestStatus === 'CONFIRMED' && (
        <div className="p-4 border-t border-purple-200 bg-purple-50">
          <div className="text-center">
            <p className="text-sm text-gray-700">
              <strong className="text-purple-600">Transaction submitted</strong> to admin for approval
            </p>
          </div>
        </div>
      )}

      {/* Buy Request Already Exists */}
      {buyRequestStatus === 'PENDING' && isBuyer() && (
        <div className="p-4 border-t border-teal-200 bg-teal-50">
          <div className="text-center">
            <p className="text-sm text-gray-700">
              <strong className="text-teal-600">Buy request already exists</strong> and is pending seller confirmation
            </p>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          {/* Offer button for buyers - only show if no accepted offer */}
          {isBuyer() && !showOfferInput && (!currentOffer || currentOffer.status !== 'ACCEPTED') && (
            <button
              onClick={() => setShowOfferInput(true)}
              className="px-3 py-2 bg-[#4154f1] text-white rounded-full hover:bg-[#3346d8] transition-colors flex items-center justify-center font-semibold shadow-md shadow-blue-500/40"
              title="Make an offer"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-full focus:ring-2 focus:ring-[#4154f1] focus:border-transparent placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-[#4154f1] text-white rounded-full hover:bg-[#3346d8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-semibold shadow-md shadow-blue-500/40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2FA Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#012970] mb-4">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Please enter the 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) to confirm the buy request.
              </p>

              <div className="mb-6">
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTwoFactorSubmit();
                    }
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 bg-gray-50 text-gray-900 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
                  autoFocus
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={closeTwoFactorModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTwoFactorSubmit}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-400 transition-colors flex items-center gap-2 font-semibold shadow-md shadow-orange-500/40"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeChat;