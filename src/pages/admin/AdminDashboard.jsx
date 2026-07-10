import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users, Briefcase, CalendarDays, DollarSign,
  ArrowRight, Sparkles, Calendar, Eye, X, Database
} from 'lucide-react';

const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   icon: 'text-blue-400',   hoverBorder: 'hover:border-blue-500/40'   },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400', hoverBorder: 'hover:border-purple-500/40' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  icon: 'text-green-400',  hoverBorder: 'hover:border-green-500/40'  },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400',  icon: 'text-amber-400',  hoverBorder: 'hover:border-amber-500/40'  },
};

const quickActions = [
  { label: 'Add Category',     to: '/admin/categories',        icon: '＋', desc: 'Create a new service category'    },
  { label: 'Review Approvals', to: '/admin/provider-approval', icon: '✓', desc: 'Check pending provider requests'  },
  { label: 'View Reports',     to: '/admin/reports',           icon: '📊', desc: 'See platform analytics'           },
  { label: 'Manage Bookings',  to: '/admin/bookings',          icon: '📅', desc: 'Update booking statuses'          },
];

const statsList = [
  { label: 'Total Customers',   value: 0, icon: Users,       color: 'blue'   },
  { label: 'Service Providers', value: 0, icon: Briefcase,   color: 'purple' },
  { label: 'Total Bookings',    value: 0, icon: CalendarDays, color: 'green' },
  { label: 'Revenue',           value: 0, icon: DollarSign,  color: 'amber', prefix: '₹' },
];

const statusBadge = (status) => {
  const map = {
    Confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Pending:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Completed: 'bg-green-500/15 text-green-400 border-green-500/20',
    Cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return map[status] || 'bg-zinc-700/30 text-zinc-400 border-zinc-700';
};

const AdminDashboard = () => {
  const { showToast } = useOutletContext();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const handleActionClick = (actionName) => {
    showToast(`Quick action triggered: ${actionName}`, 'info');
  };

  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();

  // Compute first day of current month for calendar grid offset
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">

      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Dashboard <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Welcome back, Admin — overview of today's operational indicators.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Current Session Date</p>
          <p className="text-white text-sm font-bold mt-1">
            {today.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Backend integration notice */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-blue-400 text-xs font-semibold">
        <Database size={14} className="flex-shrink-0" />
        <span>Backend integration pending — all metrics will populate automatically once the API is connected.</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsList.map(({ label, value, icon: Icon, color, prefix = '' }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`rounded-3xl bg-[#0d1425]/40 border ${c.border} p-6 flex items-center gap-5 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group ${c.hoverBorder}`}>
              <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                <Icon size={24} className={c.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-white text-3xl font-black mt-1 leading-none tracking-tight">
                  {prefix}{value}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-medium italic">Backend integration pending</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Booking Trends Chart Placeholder */}
        <div className="lg:col-span-2 rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-base">Booking Trends &amp; Traffic</h2>
              <p className="text-zinc-500 text-xs mt-1">Monthly breakdown of bookings and verified transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-zinc-400 font-semibold">Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-[10px] text-zinc-400 font-semibold">Revenue</span>
              </div>
            </div>
          </div>

          {/* Empty chart area */}
          <div className="relative h-56 w-full mt-4 flex items-center justify-center rounded-2xl bg-[#090e1c]/40 border border-white/5">
            <div className="text-center">
              <Database size={32} className="mx-auto mb-3 text-zinc-700" />
              <p className="text-zinc-500 text-xs font-semibold">No data available</p>
              <p className="text-zinc-600 text-[10px] mt-1 italic">Backend integration pending</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebox */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl shadow-xl flex-1">
            <h2 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Quick Operations</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, to, icon, desc }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => handleActionClick(label)}
                  className="flex flex-col items-start p-4 rounded-2xl bg-[#090e1c]/80 hover:bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all duration-300 group text-left"
                >
                  <span className="text-lg mb-2 text-blue-400 bg-blue-500/10 w-8 h-8 rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-all">{icon}</span>
                  <p className="text-white text-xs font-bold">{label}</p>
                  <p className="text-zinc-500 text-[9px] mt-1 line-clamp-1">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar widget + Recent users & bookings row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Dynamic calendar widget */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <h3 className="text-white font-bold text-sm">Booking Calendar</h3>
              </div>
              <span className="text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {monthName} {year}
              </span>
            </div>

            {/* Calendar grid rendering */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mt-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-zinc-500 font-bold py-1">{day}</div>
              ))}

              {/* Empty days before start of month */}
              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} className="py-2.5 text-transparent">.</div>
              ))}

              {/* Render month days */}
              {[...Array(daysInMonth)].map((_, i) => {
                const dayNumber = i + 1;
                const isSelected = selectedCalendarDate === dayNumber;
                const isToday = dayNumber === today.getDate();

                return (
                  <button
                    key={dayNumber}
                    onClick={() => {
                      setSelectedCalendarDate(dayNumber);
                      showToast(`Viewing schedule for ${monthName} ${dayNumber}`, 'info');
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : isToday
                        ? 'text-blue-400 ring-1 ring-blue-500/40'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{dayNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Bookings Detail */}
          <div className="mt-6 pt-4 border-t border-white/5 text-left">
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              Bookings on {monthName} {selectedCalendarDate ?? '—'}
            </p>
            <div className="mt-2.5">
              <p className="text-zinc-500 text-xs py-3 italic">No bookings scheduled on this date.</p>
            </div>
          </div>
        </div>

        {/* Recent Bookings Panel */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="text-white font-bold text-sm">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0e1b]/40">
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="text-center px-6 py-3 text-zinc-500 text-xs font-bold uppercase tracking-wider">Inspect</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <Database size={28} className="mx-auto mb-2 text-zinc-700" />
                    <p className="text-zinc-500 text-xs">No data available</p>
                    <p className="text-zinc-600 text-[10px] mt-1 italic">Backend integration pending</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h2 className="text-white font-bold text-sm">New Registrations</h2>
            <Link to="/admin/customers" className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Database size={28} className="mb-2 text-zinc-700" />
            <p className="text-zinc-500 text-xs">No data available</p>
            <p className="text-zinc-600 text-[10px] mt-1 italic">Backend integration pending</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
