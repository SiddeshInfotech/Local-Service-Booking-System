import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, CheckSquare, Tag, Wrench,
  CalendarDays, Star, BarChart2, ChevronLeft, ChevronRight,
  Bell, Search, LogOut, Menu, X, ShieldCheck,
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
  const location = useLocation();

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`flex items-center gap-3 px-5 py-6 border-b border-zinc-800/60 flex-shrink-0 ${collapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-blue-400" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-none">Fixora</p>
            <p className="text-blue-400 text-[10px] font-semibold tracking-widest uppercase mt-0.5">Admin</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group ${active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={18} className={`flex-shrink-0 ${active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
              {active && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: logout */}
      <div className={`px-2 py-4 border-t border-zinc-800/60 flex-shrink-0`}>
        <Link
          to="/admin/login"
          onClick={onNavClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b111e] flex">

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-300 bg-[#0B1220] border-r border-zinc-800/80 ${collapsed ? 'w-[68px]' : 'w-60'
          }`}
      >
        <SidebarContent onNavClick={undefined} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#0B1220] border-r border-zinc-800/80 md:hidden">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-[#0B1220]/80 border-b border-zinc-800/80 backdrop-blur-sm flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-zinc-500">Admin</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-200 font-medium">
                {navItems.find((n) => n.path === location.pathname)?.label || 'Panel'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:flex items-center">
              <input
                type="text"
                placeholder="Quick search..."
                className="w-40 lg:w-52 bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-300 px-3 py-1.5 pr-8 rounded-lg outline-none focus:border-blue-500 placeholder-zinc-500 transition duration-300"
              />
              <Search size={13} className="absolute right-2.5 text-zinc-400 pointer-events-none" />
            </div>

            {/* Notifications */}
            <button className="relative p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <Bell size={18} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>

            {/* Admin avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                A
              </div>
              <div className="hidden lg:block">
                <p className="text-white text-xs font-semibold leading-none">Admin</p>
                <p className="text-zinc-500 text-[10px] mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
