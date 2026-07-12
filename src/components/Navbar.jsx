import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, Menu, X, ChevronDown } from 'lucide-react';
import fixoraLogo from '../assets/images/fixora_logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Services', path: '/services' },
    { name: 'Terms & Policy', path: '/terms' },
  ];

  const profileLinks = [
    { name: 'Customer Login', path: '/customer/login' },
    { name: 'Customer Register', path: '/customer/register' },
    { name: 'Provider Login', path: '/provider/login' },
    { name: 'Provider Register', path: '/provider/register' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0F1115]/95 border-b border-[#D4AF37]/18 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center group">
              <img
                src={fixoraLogo}
                alt="Fixora Logo"
                className="h-14 w-auto object-contain transition-opacity duration-300 group-hover:opacity-85"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-xs sm:text-sm font-medium tracking-wide transition-colors duration-300 ${
                  location.pathname === link.path || (link.path === '/' && location.pathname === '/customer/login')
                    ? 'text-[#D4AF37]'
                    : 'text-zinc-300 hover:text-[#F4C542]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Action: Search Box and Profile */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Pill Search Box */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search services..."
                className="w-48 lg:w-56 bg-[#1A1D23] border border-[#D4AF37]/18 text-xs text-zinc-300 px-4 py-2 pr-8 rounded-lg outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 placeholder-zinc-500 transition duration-300"
              />
              <Search size={14} className="absolute right-3 text-zinc-400 pointer-events-none" />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1D23] hover:bg-[#232831] text-zinc-300 hover:text-white transition duration-300 cursor-pointer focus:outline-none"
              >
                <User size={16} />
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-3 w-52 rounded-xl bg-[#1A1D23] border border-[#D4AF37]/18 p-2 shadow-2xl backdrop-blur-xl z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 border-b border-[#D4AF37]/10 mb-1">
                      <p className="text-[10px] text-[#B0B3B8] font-bold uppercase tracking-wider">Account Portal</p>
                    </div>
                    {profileLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-xs transition-colors ${
                          location.pathname === link.path
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                            : 'text-zinc-400 hover:text-white hover:bg-[#232831]'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search..."
                className="w-28 bg-[#1A1D23] border border-[#D4AF37]/18 text-xs text-zinc-300 px-3 py-1.5 pr-7 rounded-lg outline-none focus:border-[#D4AF37] placeholder-zinc-500"
              />
              <Search size={12} className="absolute right-2 text-zinc-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0F1115] border-t border-[#D4AF37]/18 px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'text-zinc-300 hover:text-white hover:bg-[#232831]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#D4AF37]/10 pt-4">
            <p className="px-3 text-xs text-[#B0B3B8] font-semibold uppercase tracking-wider mb-2">Portal Access</p>
            <div className="grid grid-cols-2 gap-2 px-3">
              <Link
                to="/customer/login"
                onClick={() => setIsOpen(false)}
                className="py-2.5 text-center text-xs font-medium bg-[#1A1D23] hover:bg-[#232831] rounded-xl text-zinc-300 transition-colors"
              >
                Customer Portal
              </Link>
              <Link
                to="/provider/login"
                onClick={() => setIsOpen(false)}
                className="py-2.5 text-center text-xs font-medium bg-[#D4AF37] hover:bg-[#F4C542] rounded-xl text-[#111111] transition-colors"
              >
                Provider Portal
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
