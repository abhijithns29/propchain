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
      className="mt-16 border-t border-slate-800/60 bg-slate-950/80 text-slate-300"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:py-12 lg:px-8">
        <div className="space-y-3 max-w-sm">
          <p className="text-lg font-semibold text-white">PropChain</p>
          <p className="text-sm text-slate-400">
            A blockchain-powered land registry & marketplace for secure,
            transparent property transactions and instant ownership
            verification.
          </p>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/20">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Powered by Blockchain
          </span>
        </div>

        <div className="grid flex-1 gap-8 text-sm sm:grid-cols-3">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Platform
            </h4>
            <ul className="space-y-2">
              <li className="text-slate-400">
                Immutable land records
              </li>
              <li className="text-slate-400">
                Smart-contract powered settlements
              </li>
              <li className="text-slate-400">
                Audit-ready ownership history
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Connect
            </h4>
            <div className="flex gap-3 text-slate-400">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 hover:border-emerald-500/60 hover:text-emerald-300 transition-colors"
              >
                in
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 hover:border-emerald-500/60 hover:text-emerald-300 transition-colors"
              >
                X
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 hover:border-emerald-500/60 hover:text-emerald-300 transition-colors"
              >
                Ⓣ
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
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








