import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Existing Pages
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import ProviderLogin from './pages/ProviderLogin';
import ProviderRegister from './pages/ProviderRegister';
import ForgotPassword from './pages/ForgotPassword';
import ProviderForgotPassword from './pages/ProviderForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';

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

import ServicesPage from './pages/ServicesPage';

// Inner app — needs useLocation so must be inside Router
const AppInner = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col selection:bg-[#D4AF37]/30 selection:text-white">

      {/* Shared Navbar — shown on all pages except admin */}
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow">
        <Routes>
          {/* Landing Page — default route */}
          <Route path="/" element={<LandingPage />} />

          {/* Customer Routes */}
          <Route path="/customer/login"           element={<CustomerLogin />} />
          <Route path="/customer/register"        element={<CustomerRegister />} />
          <Route path="/customer/forgot-password" element={<ForgotPassword />} />
          <Route path="/customer/verify-otp"       element={<VerifyOTP />} />
          <Route path="/customer/reset-password"   element={<ResetPassword />} />
          <Route path="/customer/dashboard"        element={<Navigate to="/services" replace />} />
          <Route path="/customer/services"         element={<Navigate to="/services" replace />} />

          {/* Provider Routes */}
          <Route path="/provider/login"            element={<ProviderLogin />} />
          <Route path="/provider/register"         element={<ProviderRegister />} />
          <Route path="/provider/forgot-password"  element={<ProviderForgotPassword />} />
          <Route path="/provider/verify-otp"       element={<VerifyOTP />} />
          <Route path="/provider/reset-password"   element={<ResetPassword />} />
          <Route path="/provider/dashboard"        element={<Navigate to="/services" replace />} />
          <Route path="/provider/services"         element={<Navigate to="/services" replace />} />

          {/* Public routes */}
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about"    element={<AboutPage />} />
          <Route path="/contact"  element={<ContactPage />} />
          <Route path="/terms"    element={<TermsPage />} />

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

          {/* Catch-all → back to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Shared Footer — shown on all pages except admin */}
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
