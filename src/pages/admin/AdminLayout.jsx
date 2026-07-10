import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Tag, Wrench,
  CalendarDays, Star, BarChart2, ChevronLeft, ChevronRight,
  Bell, Search, LogOut, Menu, X, ShieldCheck, Check, Sparkles, AlertTriangle, AlertCircle
} from 'lucide-react';

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
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [toasts, setToasts] = useState([]);
  const location = useLocation();
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Mock Notifications State
  const [notifications, setNotifications] = useState([]);

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full bg-[#080d1a] border-r border-white/5">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-white/5 flex-shrink-0 ${collapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/10">
          <ShieldCheck size={18} className="text-blue-400" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-none tracking-wide">Fixora</p>
            <p className="text-blue-400 text-[10px] font-bold tracking-widest uppercase mt-1">Admin Panel</p>
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
                ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-white border border-blue-500/20 shadow-md shadow-blue-500/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={18} className={`flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {!collapsed && <span className="text-sm font-semibold">{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: logout */}
      <div className="px-3 py-4 border-t border-white/5 flex-shrink-0">
        <Link
          to="/admin/login"
          onClick={() => {
            if (onNavClick) onNavClick();
            showToast('Successfully logged out.', 'info');
          }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-semibold">Logout</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070c18] flex relative overflow-hidden">

      {/* Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-full p-4 rounded-2xl border bg-[#0f172a]/95 border-white/10 shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-slide-in"
          >
            {toast.type === 'success' && <div className="p-1 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400"><Check size={16} /></div>}
            {toast.type === 'error' && <div className="p-1 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400"><AlertCircle size={16} /></div>}
            {toast.type === 'warning' && <div className="p-1 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400"><AlertTriangle size={16} /></div>}
            {toast.type === 'info' && <div className="p-1 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400"><Sparkles size={16} /></div>}

            <div className="flex-1 min-w-0">
              <p className="text-white text-xs leading-relaxed font-semibold">{toast.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-lg"
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
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col md:hidden">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070c18] relative z-10">

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[#070c18]/60 border-b border-white/5 backdrop-blur-xl flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider">Fixora</span>
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
                  className="w-36 sm:w-48 lg:w-60 bg-white/5 border border-white/10 text-xs text-white px-3 py-2 pr-8 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 placeholder-zinc-500 transition-all duration-300"
                />
                <Search size={14} className="absolute right-3 text-zinc-500 pointer-events-none" />
              </div>

              {/* Search results dropdown */}
              {showSearchResults && filteredSearch.length > 0 && (
                <div className="absolute right-0 top-11 w-64 bg-[#0d1527]/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-[99] backdrop-blur-xl">
                  <div className="px-3 py-1.5 border-b border-white/5">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Navigation Results</p>
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
                        className="flex flex-col px-3 py-2 rounded-xl text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white text-xs font-semibold">{item.label}</span>
                        <span className="text-zinc-500 text-[10px] mt-0.5">{item.category}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className={`relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors ${showNotifMenu ? 'bg-white/5 border-white/5 text-white' : ''}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </button>

              {/* Notifications panel dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 top-11 w-80 bg-[#0d1527]/95 border border-white/10 rounded-2xl shadow-2xl z-[99] overflow-hidden backdrop-blur-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0e172c]/40">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xs font-bold">Notifications</p>
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
                        className={`p-3 flex gap-2.5 items-start cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? 'bg-blue-600/[0.03]' : ''}`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" style={{ opacity: notif.read ? 0 : 1 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold leading-normal">{notif.text}</p>
                          <p className="text-zinc-500 text-[10px] mt-1">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin avatar */}
            <div className="flex items-center gap-2.5 border-l border-white/5 pl-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-lg shadow-blue-500/10">
                A
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-white text-xs font-bold leading-none">Admin</p>
                <p className="text-blue-400 text-[9px] font-bold uppercase tracking-wider mt-1">Super User</p>
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
