import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const WelcomeBanner: React.FC = () => {
  const { auth } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user is new (account created within last 7 days)
    if (auth.user?.createdAt) {
      const accountAge = Date.now() - new Date(auth.user.createdAt).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      // Check if banner was previously dismissed
      const dismissed = localStorage.getItem('welcomeBannerDismissed');
      
      if (accountAge < sevenDays && !dismissed) {
        setIsVisible(true);
      }
    }
  }, [auth.user]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 backdrop-blur-xl p-4 shadow-lg animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white mb-1">
            Welcome to PropChain, {auth.user?.fullName?.split(' ')[0] || 'there'}! 👋
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            Here's how to get started with secure land transactions on the blockchain:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 font-semibold text-[10px]">
                1
              </span>
              <div>
                <p className="font-medium text-white">Complete Your Profile</p>
                <p className="text-slate-400">Add contact info and verify identity</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 font-semibold text-[10px]">
                2
              </span>
              <div>
                <p className="font-medium text-white">Browse Marketplace</p>
                <p className="text-slate-400">Explore verified land listings</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-300 font-semibold text-[10px]">
                3
              </span>
              <div>
                <p className="font-medium text-white">Start Transacting</p>
                <p className="text-slate-400">Chat with sellers and make offers</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeBanner;
