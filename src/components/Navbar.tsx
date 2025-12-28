import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Home, Settings, Shield, Database, ShoppingCart, MessageCircle, AlertCircle, QrCode, BarChart3, Key, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { auth, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // For admin users: separate primary and secondary items
  const primaryItems = auth.user?.role === 'ADMIN' 
    ? [
        { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
        { id: 'chats', label: 'Chats', icon: MessageCircle },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'admin', label: 'Admin Panel', icon: Settings },
      ]
    : [
        { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
        { id: 'chats', label: 'Chats', icon: MessageCircle },
        { id: 'qr-verify', label: 'QR Verify', icon: QrCode },
        { id: 'verification', label: 'Verification', icon: Shield },
        { id: 'two-factor', label: '2FA', icon: Key },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  const secondaryItems = auth.user?.role === 'ADMIN'
    ? [
        { id: 'land-database', label: 'Land Database', icon: Database },
        { id: 'qr-verify', label: 'QR Verify', icon: QrCode },
        { id: 'verification', label: 'Verification', icon: Shield },
        { id: 'two-factor', label: '2FA', icon: Key },
      ]
    : [];

  if (auth.user?.role === 'AUDITOR') {
    secondaryItems.push({ id: 'auditor', label: 'Audit Dashboard', icon: BarChart3 });
  }

  const handleTabClick = (tabId: string) => {
    try {
      setActiveTab(tabId);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error switching tab:', error);
    }
  };

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <nav className="rounded-2xl border backdrop-blur-xl bg-slate-900/70 border-white/10 shadow-lg shadow-slate-900/30 mb-8 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/40">
                <Home className="h-6 w-6 text-slate-950" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-semibold tracking-tight text-white leading-tight">
                  PropChain
                </span>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Blockchain Land Registry
                </p>
              </div>
              {auth.user?.role === 'ADMIN' && (
                <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/30">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {/* Primary Navigation Items */}
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-emerald-300' : ''}`} />
                  {item.label}
                  {item.id === 'verification' && auth.user?.verificationStatus === 'PENDING' && (
                    <AlertCircle className="h-3 w-3 ml-1 text-yellow-400" />
                  )}
                </button>
              );
            })}

            {/* More Dropdown (Admin only) */}
            {secondaryItems.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    secondaryItems.some(item => item.id === activeTab)
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  More
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-xl shadow-slate-900/50 py-2 z-[100] animate-fadeIn">
                    {secondaryItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-emerald-300' : 'text-slate-400'}`} />
                          {item.label}
                          {item.id === 'verification' && auth.user?.verificationStatus === 'PENDING' && (
                            <AlertCircle className="h-3 w-3 ml-auto text-yellow-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">
                {auth.user?.fullName}
              </p>
              <div className="flex items-center justify-end space-x-2">
                <p className="text-xs text-slate-400 capitalize">
                  {auth.user?.role === 'ADMIN' ? 'Administrator' : 'User'}
                </p>
                {auth.user?.verificationStatus === 'VERIFIED' && (
                  <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                )}
                {auth.user?.verificationStatus === 'PENDING' && (
                  <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden border-t border-slate-800/50 pt-2 pb-3">
          <div className="flex flex-wrap gap-2">
            {primaryItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;