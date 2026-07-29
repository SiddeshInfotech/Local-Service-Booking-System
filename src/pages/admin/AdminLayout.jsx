import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Tag, Wrench,
  CalendarDays, Star, BarChart2, ChevronLeft, ChevronRight,
  Bell, Search, LogOut, Menu, X, ShieldCheck, Check, Sparkles, AlertTriangle, AlertCircle, Sun, Moon
} from 'lucide-react';
import fixoraLogo from '../../assets/images/fixora_logo.png';
import { apiFetchAdmin, clearAuth, getAdmin } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Briefcase, label: 'Providers', path: '/admin/providers' },
  { icon: CheckSquare, label: 'Provider Approval', path: '/admin/provider-approval' },
  { icon: Tag, label: 'Categories', path: '/admin/categories' },
  { icon: Wrench, label: 'Services', path: '/admin/services' },
  { icon: CalendarDays, label: 'Bookings', path: '/admin/bookings' },
  { icon: Star, label: 'Reviews', path: '/admin/reviews' },
  { icon: BarChart2, label: 'Reports', path: '/admin/reports' },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [toasts, setToasts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Real Notifications State
  const [notifications, setNotifications] = useState([]);

  // Load notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiFetchAdmin('/api/notification');
        const data = await res.json();
        if (res.ok && data.status && Array.isArray(data.notifications)) {
          const mapped = data.notifications.map(n => ({
            id: n.notification_id,
            text: n.message || n.title,
            time: n.created_at ? new Date(n.created_at).toLocaleString() : '',
            read: !!n.is_read,
            type: n.notification_type === 'Alert' ? 'alert' : n.notification_type === 'Success' ? 'success' : n.notification_type === 'Warning' ? 'warning' : 'info',
          }));
          setNotifications(mapped);
        }
      } catch {
        // Notifications are non-critical — silently fail
      }
    };
    fetchNotifications();
  }, []);

  // Get admin info from localStorage
  const adminInfo = getAdmin();

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global search options matching pages
  const searchOptions = [
    { label: 'Platform Stats & Activities', path: '/admin/dashboard', category: 'Pages' },
    { label: 'Manage Customers', path: '/admin/customers', category: 'Pages' },
    { label: 'Manage Service Providers', path: '/admin/providers', category: 'Pages' },
    { label: 'Approve pending partners', path: '/admin/provider-approval', category: 'Pages' },
    { label: 'Service Categories Manager', path: '/admin/categories', category: 'Pages' },
    { label: 'System Services Catalogue', path: '/admin/services', category: 'Pages' },
    { label: 'Customer Bookings Registry', path: '/admin/bookings', category: 'Pages' },
    { label: 'Provider Reviews Moderation', path: '/admin/reviews', category: 'Pages' },
    { label: 'Business Reports & Charts', path: '/admin/reports', category: 'Pages' },
  ];

  const filteredSearch = searchQuery.trim() === '' ? [] : searchOptions.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const markAllAsRead = async () => {
    // Mark all as read via API (fire and forget)
    const unread = notifications.filter(n => !n.read);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    for (const n of unread) {
      try {
        await apiFetchAdmin(`/api/notification/${n.id}/read`, { method: 'PUT' });
      } catch { /* ignore */ }
    }
    showToast('All notifications marked as read', 'success');
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      // No admin-specific logout endpoint — just clear tokens
      if (refreshToken) {
        await apiFetchAdmin('/api/customer/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch(() => {});
      }
    } finally {
      clearAuth();
      navigate('/admin/login');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full bg-[var(--color-primary-bg)] border-r border-[var(--color-border-subtle)]">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-[var(--color-border-subtle)] flex-shrink-0 ${collapsed ? 'justify-center px-3' : ''}`}>
        <img
          src={fixoraLogo}
          alt="Fixora Logo"
          className="h-16 w-auto object-contain flex-shrink-0"
        />
        {!collapsed && (
          <div>
            <p className="text-[var(--color-text-primary)] font-bold text-sm leading-none tracking-wide">Fixora</p>
            <p className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mt-1">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${active
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-[var(--color-text-primary)] border border-blue-500/20 shadow-md shadow-blue-500/5'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] border border-transparent'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={18} className={`flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${active ? 'text-blue-400' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'}`} />
              {!collapsed && <span className="text-sm font-semibold">{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: logout */}
      <div className="px-3 py-4 border-t border-[var(--color-border-subtle)] flex-shrink-0">
        <button
          onClick={() => {
            if (onNavClick) onNavClick();
            handleLogout();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 cursor-pointer border-0 bg-transparent ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-primary-bg)] flex relative overflow-hidden">

      {/* Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full p-4 rounded-2xl border bg-[var(--color-secondary-bg)]/95 border-[var(--color-border-subtle)] shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-slide-in"
          >
            {toast.type === 'success' && <div className="p-1 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400"><Check size={16} /></div>}
            {toast.type === 'error' && <div className="p-1 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400"><AlertCircle size={16} /></div>}
            {toast.type === 'warning' && <div className="p-1 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400"><AlertTriangle size={16} /></div>}
            {toast.type === 'info' && <div className="p-1 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400"><Sparkles size={16} /></div>}

            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-text-primary)] text-xs leading-relaxed font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-0.5 rounded-lg"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-500 ease-out ${collapsed ? 'w-[68px]' : 'w-64'}`}
      >
        <SidebarContent onNavClick={undefined} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--color-modal-overlay)] backdrop-blur-md md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col md:hidden">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-primary-bg)] relative z-10">

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[var(--color-primary-bg)]/60 border-b border-[var(--color-border-subtle)] backdrop-blur-xl flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] transition-colors border border-transparent hover:border-[var(--color-border-subtle)]"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">Fixora</span>
              <span className="text-zinc-700">/</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">
                {navItems.find((n) => n.path === location.pathname)?.label || 'Panel'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex items-center" ref={searchRef}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchQuery}
                  onFocus={() => setShowSearchResults(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  className="w-36 sm:w-48 lg:w-60 bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] px-3 py-2 pr-8 rounded-xl outline-none focus:border-blue-500/50 focus:bg-[var(--color-overlay-hover)] placeholder-zinc-500 transition-all duration-300"
                />
                <Search size={14} className="absolute right-3 text-[var(--color-text-secondary)] pointer-events-none" />
              </div>

              {/* Search results dropdown */}
              {showSearchResults && filteredSearch.length > 0 && (
                <div className="absolute right-0 top-11 w-64 bg-[var(--color-secondary-bg)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-2 z-[99] backdrop-blur-xl">
                  <div className="px-3 py-1.5 border-b border-[var(--color-border-subtle)]">
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Navigation Results</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto mt-1 space-y-0.5">
                    {filteredSearch.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="flex flex-col px-3 py-2 rounded-xl text-left hover:bg-[var(--color-overlay-subtle)] transition-colors"
                      >
                        <span className="text-[var(--color-text-primary)] text-xs font-semibold">{item.label}</span>
                        <span className="text-[var(--color-text-secondary)] text-[10px] mt-0.5">{item.category}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] border border-transparent hover:border-[var(--color-border-subtle)] transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className={`relative p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] border border-transparent hover:border-[var(--color-border-subtle)] transition-colors ${showNotifMenu ? 'bg-[var(--color-overlay-subtle)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)]' : ''}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </button>

              {/* Notifications panel dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 top-11 w-80 bg-[var(--color-secondary-bg)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl z-[99] overflow-hidden backdrop-blur-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)]">
                    <div className="flex items-center gap-2">
                      <p className="text-[var(--color-text-primary)] text-xs font-bold">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} New</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                          showToast('Notification read: ' + notif.text.substring(0, 20) + '...', 'info');
                        }}
                        className={`p-3 flex gap-2.5 items-start cursor-pointer hover:bg-[var(--color-overlay-subtle)] transition-colors ${!notif.read ? 'bg-blue-600/[0.03]' : ''}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" style={{ opacity: notif.read ? 0 : 1 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--color-text-primary)] text-xs font-semibold leading-normal">{notif.text}</p>
                          <p className="text-[var(--color-text-secondary)] text-[10px] mt-1">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin avatar */}
            <div className="flex items-center gap-2.5 border-l border-[var(--color-border-subtle)] pl-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[var(--color-text-primary)] text-xs font-black flex-shrink-0 shadow-lg shadow-blue-500/10">
                {adminInfo?.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[var(--color-text-primary)] text-xs font-bold leading-none">{adminInfo?.full_name || 'Admin'}</p>
                <p className="text-blue-400 text-[9px] font-bold uppercase tracking-wider mt-1">{adminInfo?.role || 'Super User'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet context={{ showToast }} />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
