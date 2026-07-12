import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import fixoraLogo from '../assets/images/fixora_logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F1115] border-t border-[#D4AF37]/18 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center group w-max">
              <img
                src={fixoraLogo}
                alt="Fixora Logo"
                className="h-10 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
            </Link>
            <p className="text-[#B0B3B8] text-sm leading-relaxed">
              Connect with top-rated local service professionals for plumbing, electrical, cleaning, carpentry, and home improvement needs.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-[#1A1D23] border border-[#D4AF37]/18 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[#1A1D23] border border-[#D4AF37]/18 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Twitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[#1A1D23] border border-[#D4AF37]/18 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[#1A1D23] border border-[#D4AF37]/18 flex items-center justify-center text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Customer Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">For Customers</h3>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link to="/customer/login" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Customer Login</Link>
              </li>
              <li>
                <Link to="/customer/register" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Customer Registration</Link>
              </li>
              <li>
                <Link to="/services" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Browse Services</Link>
              </li>
              <li>
                <a href="#" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Safety Guidelines</a>
              </li>
            </ul>
          </div>

          {/* Provider Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">For Providers</h3>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link to="/provider/login" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Provider Login</Link>
              </li>
              <li>
                <Link to="/provider/register" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Provider Registration</Link>
              </li>
              <li>
                <a href="#" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Business Resources</a>
              </li>
              <li>
                <a href="#" className="text-[#B0B3B8] hover:text-white text-sm transition-colors">Partner Program</a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">Contact Us</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-[#D4AF37] shrink-0 mt-0.5" size={16} />
                <span className="text-[#B0B3B8] text-sm">100 Service Plaza, Suite 400, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-[#D4AF37] shrink-0" size={16} />
                <span className="text-[#B0B3B8] text-sm">+1 (800) 555-0199</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-[#D4AF37] shrink-0" size={16} />
                <span className="text-[#B0B3B8] text-sm">support@fixora.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="border-t border-[#D4AF37]/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-xs">
            &copy; {currentYear} Fixora Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-xs transition-colors">Privacy Policy</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-400 text-xs transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
