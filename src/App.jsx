import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Button from './components/Button';

// Existing Pages
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import ProviderLogin from './pages/ProviderLogin';
import ProviderRegister from './pages/ProviderRegister';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCustomers from './pages/admin/ManageCustomers';
import ManageProviders from './pages/admin/ManageProviders';
import ProviderApproval from './pages/admin/ProviderApproval';
import ManageCategories from './pages/admin/ManageCategories';
import ManageServices from './pages/admin/ManageServices';
import ManageBookings from './pages/admin/ManageBookings';
import ViewReviews from './pages/admin/ViewReviews';
import AdminReports from './pages/admin/AdminReports';

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

// Inner app — needs useLocation so must be inside Router
const AppInner = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-blue-600 selection:text-white">

      {/* Main Navbar — hidden on all admin pages */}
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow">
        <Routes>
          {/* Redirect root to Customer Login */}
          <Route path="/" element={<Navigate to="/customer/login" replace />} />

          {/* Customer Routes */}
          <Route path="/customer/login"     element={<CustomerLogin />} />
          <Route path="/customer/register"  element={<CustomerRegister />} />
          <Route path="/customer/dashboard" element={<PlaceholderPage title="Customer Dashboard" description="Your bookings, history, and profile settings will appear here." />} />

          {/* Provider Routes */}
          <Route path="/provider/login"     element={<ProviderLogin />} />
          <Route path="/provider/register"  element={<ProviderRegister />} />
          <Route path="/provider/dashboard" element={<PlaceholderPage title="Provider Dashboard" description="Manage your services, bookings, and customers from your provider portal." />} />

          {/* Navbar placeholder routes */}
          <Route path="/services" element={<PlaceholderPage title="Services" description="Explore our list of high-quality local services. Find electricians, cleaners, builders, and designers suited to your project needs." />} />
          <Route path="/about"    element={<PlaceholderPage title="About Us" description="Fixora is on a mission to simplify home service bookings. By verifying trades and protecting customer transactions, we deliver peace of mind." />} />
          <Route path="/contact"  element={<PlaceholderPage title="Contact Support" description="Have questions? Get in touch with our helpdesk. Our support agents are here to assist with billing, verification, or service issues." />} />
          <Route path="/terms"    element={<PlaceholderPage title="Terms & Policy" description="Read our safety rules, terms of operations, and privacy protections designed to keep homeowners and local partners secure." />} />

          {/* Admin Login (standalone — no sidebar layout) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Panel (all pages share AdminLayout with sidebar) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"         element={<AdminDashboard />} />
            <Route path="customers"         element={<ManageCustomers />} />
            <Route path="providers"         element={<ManageProviders />} />
            <Route path="provider-approval" element={<ProviderApproval />} />
            <Route path="categories"        element={<ManageCategories />} />
            <Route path="services"          element={<ManageServices />} />
            <Route path="bookings"          element={<ManageBookings />} />
            <Route path="reviews"           element={<ViewReviews />} />
            <Route path="reports"           element={<AdminReports />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/customer/login" replace />} />
        </Routes>
      </main>

      {/* Footer — hidden on all admin pages */}
      {!isAdminRoute && <Footer />}

    </div>
  );
};

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
