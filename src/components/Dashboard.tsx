import React, { useState, useEffect } from "react";
import {
  Shield,
  QrCode,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import apiService from "../services/api";
import Navbar from "./Navbar";
import TransactionHistory from "./TransactionHistory";
import AdminPanel from "./AdminPanel";
import UserProfile from "./UserProfile";
import UserVerification from "./UserVerification";
import LandDatabase from "./LandDatabase";
import LandMarketplace from "./LandMarketplace";
import RealtimeChat from "./RealtimeChat";
import { Chat } from "../types";
import QRScanner from "./QRScanner";
import TwoFactorAuth from "./TwoFactorAuth";
import AuditorDashboard from "./AuditorDashboard";
import OnboardingChecklist from "./onboarding/OnboardingChecklist";
import WelcomeBanner from "./onboarding/WelcomeBanner";
import ChatbotWidget from "./ChatbotWidget";
import io, { Socket } from 'socket.io-client';
import { useRef } from 'react';

interface DashboardProps {
  onNavigateToLand?: (landId: string) => void;
  initialTab?: string;
  initialSelectedChatId?: string;
  chatNavigation?: { landId: string, sellerId: string, isFirstChat?: boolean, activeTab?: string };
  onClearChatNavigation?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToLand, initialTab, initialSelectedChatId, chatNavigation, onClearChatNavigation }) => {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState(
    initialTab || (auth.user?.role === "ADMIN" ? "land-database" : "marketplace")
  );
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [error, setError] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [autoFillMessage, setAutoFillMessage] = useState<string | null>(null);
  const [pendingChat, setPendingChat] = useState<{ landId: string, recipientId: string, recipientName: string } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Update activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Redirect non-admin users away from land-database tab
  useEffect(() => {
    if (activeTab === "land-database" && auth.user?.role !== "ADMIN") {
      setActiveTab("marketplace");
    }
  }, [activeTab, auth.user?.role]);

  // Load chats when chats tab is selected
  useEffect(() => {
    if (activeTab === "chats") {
      loadChats();
    } else {
      // Clear selected chat when leaving chats tab to prevent confusion
      setSelectedChat(null);
    }
  }, [activeTab]);

  // Socket initialization for Dashboard
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    newSocket.on('connect', () => {
      console.log('Dashboard: Connected to socket');
      if (auth.user?.id) {
        // We might want a personal room for the user to receive multi-chat updates
        // For now, new-message events are broadcasted to the chat room
      }
    });

    newSocket.on('new-message', (data) => {
      console.log('Dashboard: New message received:', data);

      // 1. Update the chat list (sidebar)
      setChats(prev => {
        return prev.map(chat => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              messages: [...(chat.messages || []), data.message],
              updatedAt: new Date().toISOString()
            };
          }
          return chat;
        });
      });

      // 2. Update selectedChat if it's the current one
      setSelectedChat(prev => {
        if (prev && prev._id === data.chatId) {
          // Check for duplicates to prevent race conditions
          const messageExists = (prev.messages || []).some(m => m._id === data.message._id);
          if (messageExists) return prev;

          return {
            ...prev,
            messages: [...(prev.messages || []), data.message],
            updatedAt: new Date().toISOString()
          };
        }
        return prev;
      });
    });

    newSocket.on('message-deleted', (data) => {
      console.log('Dashboard: Message deleted received:', data);
      setChats(prev => {
        return prev.map(chat => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              messages: (chat.messages || []).filter(msg => msg._id !== data.messageId)
            };
          }
          return chat;
        });
      });
    });

    newSocket.on('chat-deleted', (data) => {
      console.log('Dashboard: Chat deleted received:', data);
      setChats(prev => prev.filter(c => c._id !== data.chatId));
      if (selectedChat?._id === data.chatId) {
        setSelectedChat(null);
      }
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.disconnect();
    };
  }, [selectedChat?._id, auth.user?.id]);

  // Join rooms for all user's chats to receive updates
  useEffect(() => {
    if (socket && chats.length > 0) {
      chats.forEach(chat => {
        socket.emit('join-chat', {
          chatId: chat._id,
          userId: auth.user?.id
        });
      });
    }
  }, [socket, chats.length]);

  // Handle chat navigation and active tab changes
  useEffect(() => {
    if (chatNavigation) {
      // Set the active tab first
      if (chatNavigation.activeTab) {
        setActiveTab(chatNavigation.activeTab);
      }

      // If we have land and seller info, try to find the specific chat
      if (chatNavigation.landId && chatNavigation.sellerId && chats.length > 0) {
        const chatToSelect = chats.find(chat =>
          chat.landId?._id === chatNavigation.landId &&
          (chat.seller?.id === chatNavigation.sellerId || chat.buyer?.id === chatNavigation.sellerId)
        );

        if (chatToSelect) {
          // Found existing chat, select it
          setSelectedChat(chatToSelect);
          setPendingChat(null);
        } else {
          // No existing chat found, set up pending chat
          setSelectedChat(null);
          setAutoFillMessage("I am interested, can I get more info?");

          // We need to get the land details to get the recipient name
          // For now, set a placeholder and let RealtimeChat handle it
          setPendingChat({
            landId: chatNavigation.landId,
            recipientId: chatNavigation.sellerId,
            recipientName: 'Seller' // Will be updated when land details are loaded
          });
        }

        if (onClearChatNavigation) {
          onClearChatNavigation();
        }
      } else if (chatNavigation.activeTab && onClearChatNavigation) {
        // Just switching tabs without specific chat
        onClearChatNavigation();
      }
    }
  }, [chats, chatNavigation, onClearChatNavigation]);

  // Load selected chat from localStorage or initial prop on component mount
  useEffect(() => {
    if (chats.length > 0 && !chatNavigation) {
      const chatIdToSelect = initialSelectedChatId || localStorage.getItem('selectedChatId');
      if (chatIdToSelect) {
        const chatToSelect = chats.find(chat => chat._id === chatIdToSelect);
        if (chatToSelect) {
          setSelectedChat(chatToSelect);
          setActiveTab("chats");
        }
      }
    }
  }, [chats, initialSelectedChatId, chatNavigation]);

  // Save selected chat to localStorage
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem('selectedChatId', selectedChat._id);
    } else {
      localStorage.removeItem('selectedChatId');
    }
  }, [selectedChat]);

  const loadChats = async () => {
    try {
      setChatsLoading(true);
      setError("");
      console.log("Loading chats for user:", auth.user?.id);
      const response = await apiService.getMyChats();
      console.log("Chat API response:", response);

      // Handle different response structures
      let chatsData = [];
      if (response && response.chats) {
        chatsData = response.chats;
      } else if (Array.isArray(response)) {
        chatsData = response;
      } else if (response && Array.isArray(response.data)) {
        chatsData = response.data;
      }

      console.log("Processed chats data:", chatsData);
      setChats(chatsData);
    } catch (error: any) {
      console.error("Error loading chats:", error);
      setError(error.message || "Failed to load chats");
    } finally {
      setChatsLoading(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleBackToChatList = () => {
    setSelectedChat(null);
    setPendingChat(null);
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent selecting the chat when clicking delete

    if (!window.confirm('Are you sure you want to delete this conversation? This will delete the entire chat history for you.')) {
      return;
    }

    try {
      await apiService.deleteChat(chatId);
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
      }
      // Update local state immediately
      setChats(prev => prev.filter(c => c._id !== chatId));
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      setError(error.message || 'Failed to delete chat');
    }
  };




  const renderContent = () => {
    switch (activeTab) {
      case "land-database":
        return auth.user?.role === "ADMIN" ? (
          <LandDatabase />
        ) : (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#012970] mb-2">
                Access Restricted
              </h2>
              <p className="text-gray-600">
                The Land Database is only accessible to administrators.
              </p>
            </div>
          </div>
        );
      case "marketplace":
        return (
          <div className="space-y-6">
            <WelcomeBanner />
            <OnboardingChecklist onNavigate={setActiveTab} />
            <LandMarketplace onNavigateToLand={onNavigateToLand} />
          </div>
        );
      case "chats":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#012970]">Chat System</h1>
              <p className="mt-1 text-sm text-gray-600">
                Communicate with buyers and sellers
              </p>
            </div>

            {/* WhatsApp-like Chat Layout */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-[700px] flex">
              {/* Left Sidebar - Chat List */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-[#012970]">Conversations</h2>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                  {chatsLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4154f1]"></div>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center">
                      <p className="text-red-400 mb-4 text-sm">{error}</p>
                      <button
                        onClick={loadChats}
                        className="px-3 py-1 bg-[#4154f1] text-white rounded-md hover:bg-[#3346d8] text-sm font-semibold shadow-md shadow-blue-500/40 transition"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : chats.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="mb-3">
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">No conversations yet</h3>
                      <p className="text-xs text-gray-500 mb-3">
                        Start a conversation from the marketplace.
                      </p>
                      <button
                        onClick={() => setActiveTab("marketplace")}
                        className="text-xs px-3 py-1 bg-[#4154f1] text-white rounded-md hover:bg-[#3346d8] font-semibold shadow-md shadow-blue-500/40 transition"
                      >
                        Go to Marketplace
                      </button>
                    </div>
                  ) : (
                    <div>
                      {chats
                        .filter((chat, index, self) =>
                          index === self.findIndex((c) => c._id === chat._id)
                        )
                        .map((chat) => {
                          // Always show the other user (receiver), not the current user

                          // Ensure proper string comparison for user IDs
                          const currentUserId = auth.user?.id;
                          // Handle both id and _id fields for buyer
                          const buyerId = chat.buyer?.id || chat.buyer?._id;
                          const otherUser = buyerId === currentUserId ? chat.seller : chat.buyer;
                          const lastMessage = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
                          const isActive = selectedChat?._id === chat._id;

                          return (
                            <div
                              key={chat._id}
                              onClick={() => handleChatSelect(chat)}
                              className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${isActive ? 'bg-blue-50 border-l-4 border-l-[#4154f1]' : ''
                                }`}
                            >
                              <div className="flex items-start space-x-3">
                                {/* Avatar */}
                                <div className="w-12 h-12 bg-gradient-to-br from-[#4154f1] to-[#3346d8] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-md shadow-blue-500/30">
                                  {otherUser?.fullName?.charAt(0) || 'U'}
                                </div>

                                {/* Chat Info */}
                                <div className="flex-1 min-w-0 group relative pr-8">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium text-gray-900 truncate">
                                      {otherUser?.fullName || 'Unknown User'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => handleDeleteChat(e, chat._id)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Conversation"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chat.status === 'DEAL_AGREED' ? 'bg-blue-100 text-[#4154f1]' :
                                        chat.status === 'ACTIVE' ? 'bg-blue-100 text-[#4154f1]' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                        {chat.status === 'DEAL_AGREED' ? 'Deal' : 'Active'}
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-sm text-gray-600 mb-1 truncate">
                                    {chat.landId?.village}, {chat.landId?.district}
                                  </p>

                                  {lastMessage && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {lastMessage.messageType === 'OFFER' ? '💰 Offer' :
                                        lastMessage.messageType === 'ACCEPTANCE' ? '✅ Accepted' :
                                          lastMessage.messageType === 'REJECTION' ? '❌ Rejected' :
                                            lastMessage.message}
                                    </p>
                                  )}

                                  {chat.currentOffer && chat.currentOffer.amount && (
                                    <p className="text-xs font-medium text-[#4154f1] mt-1">
                                      ₹{(chat.currentOffer.amount / 100000).toFixed(1)}L
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Chat Area */}
              <div className="flex-1 flex flex-col">
                {(selectedChat || pendingChat) ? (
                  <div className="flex-1 flex flex-col bg-gray-50/50">
                    {/* Chat Header - Same as Marketplace */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-[#012970]">
                        {selectedChat ? (() => {
                          // Get current user ID
                          const currentUserId = auth.user?.id;
                          // Get buyer ID (handle both id and _id)
                          const buyerId = selectedChat.buyer?.id || selectedChat.buyer?._id;
                          // Determine other user
                          const otherUser = buyerId === currentUserId ? selectedChat.seller : selectedChat.buyer;
                          return `Chat with ${otherUser?.fullName || 'User'}`;
                        })() :
                          `Start Chat with ${pendingChat?.recipientName || 'Seller'}`
                        }
                      </h2>
                      <button
                        onClick={handleBackToChatList}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      {selectedChat ? (
                        <RealtimeChat
                          chatId={selectedChat._id}
                          onClose={handleBackToChatList}
                          showHeader={false}
                          autoFillMessage={autoFillMessage}
                          onAutoFillUsed={() => setAutoFillMessage(null)}
                        />
                      ) : pendingChat ? (
                        <RealtimeChat
                          landId={pendingChat.landId}
                          recipientId={pendingChat.recipientId}
                          recipientName={pendingChat.recipientName}
                          onClose={handleBackToChatList}
                          showHeader={false}
                          autoFillMessage={autoFillMessage}
                          onAutoFillUsed={() => setAutoFillMessage(null)}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                      <p className="text-gray-500">
                        Choose a conversation from the list to start chatting
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "transactions":
        return <TransactionHistory />;
      case "profile":
        return <UserProfile onNavigateToLand={onNavigateToLand} />;
      case "admin":
        return auth.user?.role === "ADMIN" ? (
          <AdminPanel />
        ) : null;
      case "auditor":
        return auth.user?.role === "AUDITOR" ? <AuditorDashboard /> : null;
      case "verification":
        return <UserVerification />;
      case "two-factor":
        return <TwoFactorAuth />;
      case "qr-verify":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#012970]">
                  QR Code Verification
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Scan QR codes to verify land ownership and authenticity
                </p>
              </div>
              <button
                onClick={() => setShowQRScanner(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-2xl shadow-lg shadow-blue-500/40 text-sm font-semibold text-white bg-[#4154f1] hover:bg-[#3346d8] transition-colors"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </button>
            </div>

            {/* How It Works Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* How It Works */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#012970] mb-4 flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-[#4154f1]" />
                  How It Works
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[#4154f1] font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Click Scan QR Code</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Open your device camera to scan land certificates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[#4154f1] font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Scan the QR Code</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Point your camera at the QR code on the land document
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-[#4154f1] font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">View Results</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Instantly see ownership details and verification status
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#012970] mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-[#4154f1]" />
                  Benefits
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#4154f1] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Instant Verification:</span> Get results in seconds
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#4154f1] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Fraud Prevention:</span> Verify authenticity on-chain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#4154f1] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Complete History:</span> View full ownership trail
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#4154f1] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Secure & Private:</span> Blockchain-backed verification
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-transparent p-0 shadow-none border-0 animate-fadeIn">
          {renderContent()}
        </div>
      </main>

      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Chatbot Widget */}
      <ChatbotWidget onNavigateToLand={onNavigateToLand} />
    </div>
  );
};

export default Dashboard;
