import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 inset-x-0 z-40"
    >
      <div
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          isScrolled ? 'py-2' : 'py-3'
        }`}
      >
        <nav
          className={`flex items-center justify-between rounded-2xl border backdrop-blur-xl bg-slate-900/70 border-white/10 shadow-lg transition-all duration-300 ${
            isScrolled ? 'shadow-emerald-500/10' : 'shadow-slate-900/30'
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/40">
              <span className="text-lg font-black tracking-tight">L</span>
            </div>
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight">
                PropChain
              </p>
              <p className="text-[11px] text-slate-300">
                Blockchain Land Registry
              </p>
            </div>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.to ||
                (link.to !== '/' &&
                  location.pathname.startsWith(link.to));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-emerald-300'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-emerald-500/10"
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-2 pr-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 transition hover:bg-emerald-400"
            >
              <span>Get Started</span>
            </button>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

export default Navbar;








