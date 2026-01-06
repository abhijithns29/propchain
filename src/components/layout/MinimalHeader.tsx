import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const MinimalHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 group"
          >
            <motion.div
              whileHover={{ rotate: 5 }}
              className="h-10 w-10 bg-gradient-to-br from-[#4154f1] to-[#3346d8] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 transition-all"
            >
              <Home className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex flex-col items-start">
              <span className="text-lg font-bold bg-gradient-to-r from-[#012970] to-[#4154f1] bg-clip-text text-transparent">
                PropChain
              </span>
              <span className="text-[10px] text-gray-500 -mt-1">Land Registry</span>
            </div>
          </motion.button>

          {/* Back to Home Link */}
          <motion.button
            whileHover={{ x: -3, backgroundColor: "rgba(65, 84, 241, 0.05)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-[#4154f1] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
