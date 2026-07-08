import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Button from './components/Button';

// Pages
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import ProviderLogin from './pages/ProviderLogin';
import ProviderRegister from './pages/ProviderRegister';

// A premium interactive placeholder component for non-login pages
const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="min-h-[calc(100vh-280px)] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="glass-card rounded-3xl p-8 sm:p-12 max-w-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
        <h1 className="text-4xl font-black text-white mb-4">
          Fixora <span className="text-blue-500">{title}</span>
        </h1>
        <p className="text-zinc-400 text-base leading-relaxed mb-8">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/customer/login">
            <Button variant="primary" className="w-full sm:w-auto">Customer Login</Button>
          </Link>
          <Link to="/provider/login">
            <Button variant="secondary" className="w-full sm:w-auto">Provider Portal</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white flex flex-col selection:bg-blue-600 selection:text-white">

        {/* Navigation header visible across all pages */}
        <Navbar />

        {/* Main section wrapper */}
        <main className="flex-grow">
          <Routes>
            {/* Redirect root path to Customer Login */}
            <Route path="/" element={<Navigate to="/customer/login" replace />} />

            {/* Customer Routes */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />

            {/* Provider Routes */}
            <Route path="/provider/login" element={<ProviderLogin />} />
            <Route path="/provider/register" element={<ProviderRegister />} />

            {/* Navbar placeholder routes */}
            <Route
              path="/services"
              element={
                <PlaceholderPage
                  title="Services"
                  description="Explore our list of high-quality local services. Find electricians, cleaners, builders, and designers suited to your project needs."
                />
              }
            />
            <Route
              path="/about"
              element={
                <PlaceholderPage
                  title="About Us"
                  description="Fixora is on a mission to simplify home service bookings. By verifying trades and protecting customer transactions, we deliver peace of mind."
                />
              }
            />
            <Route
              path="/contact"
              element={
                <PlaceholderPage
                  title="Contact Support"
                  description="Have questions? Get in touch with our helpdesk. Our support agents are here to assist with billing, verification, or service issues."
                />
              }
            />
            <Route
              path="/terms"
              element={
                <PlaceholderPage
                  title="Terms & Policy"
                  description="Read our safety rules, terms of operations, and privacy protections designed to keep homeowners and local partners secure."
                />
              }
            />

            {/* Catch-all redirect to Customer Login */}
            <Route path="*" element={<Navigate to="/customer/login" replace />} />
          </Routes>
        </main>

        {/* Universal Footer */}
        <Footer />

      </div>
    </Router>
  );
}

export default App;
