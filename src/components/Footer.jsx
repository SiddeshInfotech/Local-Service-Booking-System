import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import fixoraLogo from '../assets/images/fixora_logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-primary-bg)] border-t border-[#D4AF37]/18 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center group w-max">
              <img
                src={fixoraLogo}
                alt="Fixora Logo"
                className="h-16 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
            </Link>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              Connect with top-rated local service professionals for plumbing, electrical, cleaning, carpentry, and home improvement needs.
            </p>
            {/* Social Links */}
            <div className="flex gap-4 mt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--color-secondary-bg)] border border-[#D4AF37]/18 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--color-secondary-bg)] border border-[#D4AF37]/18 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Twitter size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--color-secondary-bg)] border border-[#D4AF37]/18 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--color-secondary-bg)] border border-[#D4AF37]/18 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-300">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold text-sm uppercase tracking-wider mb-6">For Customers</h3>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link to="/customer/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Customer Login</Link>
              </li>
              <li>
                <Link to="/customer/register" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Customer Registration</Link>
              </li>
              <li>
                <Link to="/services" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Browse Services</Link>
              </li>
              <li>
                <Link to="/about" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/terms" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Terms &amp; Policies</Link>
              </li>
            </ul>
          </div>

          {/* Provider Links */}
          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold text-sm uppercase tracking-wider mb-6">For Providers</h3>
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link to="/provider/login" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Provider Login</Link>
              </li>
              <li>
                <Link to="/provider/register" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Provider Registration</Link>
              </li>
              <li>
                <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Business Resources</a>
              </li>
              <li>
                <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm transition-colors">Partner Program</a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-[var(--color-text-primary)] font-semibold text-sm uppercase tracking-wider mb-6">Contact Us</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-[#D4AF37] shrink-0 mt-0.5" size={16} />
                <span className="text-[var(--color-text-secondary)] text-sm">100 Service Plaza, Suite 400, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-[#D4AF37] shrink-0" size={16} />
                <span className="text-[var(--color-text-secondary)] text-sm">+1 (800) 555-0199</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-[#D4AF37] shrink-0" size={16} />
                <span className="text-[var(--color-text-secondary)] text-sm">support@fixora.com</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-[#D4AF37]/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[var(--color-text-secondary)] text-xs">
            &copy; {currentYear} Fixora Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/terms" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] text-xs transition-colors">Terms &amp; Policies</Link>
            <Link to="/terms" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] text-xs transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] text-xs transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
