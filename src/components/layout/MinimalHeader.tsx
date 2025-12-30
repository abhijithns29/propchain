import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

const MinimalHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 group"
          >
            <div className="h-8 w-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/40 transition-transform group-hover:scale-105">
              <Home className="h-4 w-4 text-slate-950" />
            </div>
            <span className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
              PropChain
            </span>
          </button>

          {/* Back to Home Link */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
