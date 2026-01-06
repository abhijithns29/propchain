import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mt-16 border-t border-gray-200 bg-white text-gray-600"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:py-12 lg:px-8">
        <div className="space-y-3 max-w-sm">
          <p className="text-lg font-semibold text-[#012970]">PropChain</p>
          <p className="text-sm text-gray-600">
            A blockchain-powered land registry & marketplace for secure,
            transparent property transactions and instant ownership
            verification.
          </p>
          <span className="inline-flex items-center rounded-full bg-[#4154f1]/10 px-3 py-1 text-[11px] font-medium text-[#4154f1] border border-[#4154f1]/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#4154f1]" />
            Powered by Blockchain
          </span>
        </div>

        <div className="grid flex-1 gap-8 text-sm sm:grid-cols-3">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-[#4154f1] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-[#4154f1] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-[#4154f1] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Platform
            </h4>
            <ul className="space-y-2">
              <li className="text-gray-600">
                Immutable land records
              </li>
              <li className="text-gray-600">
                Smart-contract powered settlements
              </li>
              <li className="text-gray-600">
                Audit-ready ownership history
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Connect
            </h4>
            <div className="flex gap-3 text-gray-600">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:border-[#4154f1] hover:text-[#4154f1] transition-colors"
              >
                in
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:border-[#4154f1] hover:text-[#4154f1] transition-colors"
              >
                X
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white hover:border-[#4154f1] hover:text-[#4154f1] transition-colors"
              >
                Ⓣ
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} PropChain. All rights reserved.</p>
          <p className="text-[11px]">
            For demonstration purposes only. Not legal land registration
            advice.
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;








