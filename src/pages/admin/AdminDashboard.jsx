import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users, Briefcase, CalendarDays, DollarSign,
  ArrowRight, Sparkles, Calendar, Loader2
} from 'lucide-react';
import { apiFetchAdmin } from '../../api';

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

const statusBadge = (status) => {
  const map = {
    Confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Pending:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Completed: 'bg-green-500/15 text-green-400 border-green-500/20',
    Cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return map[status] || 'bg-[var(--color-zinc-700)]/30 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]';
};

const userStatusBadge = (status) => {
  if (status === 'Active') return 'bg-green-500/15 text-green-400 border-green-500/20';
  if (status === 'Pending') return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  return 'bg-red-500/15 text-red-400 border-red-500/20';
};

const AdminDashboard = () => {
  const { showToast } = useOutletContext();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Live stats state
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentProviders, setRecentProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, recentRes] = await Promise.all([
          apiFetchAdmin('/api/admin/stats'),
          apiFetchAdmin('/api/admin/dashboard/recent'),
        ]);

        const statsData = await statsRes.json();
        const recentData = await recentRes.json();

        if (statsRes.ok && statsData.status) {
          setStats(statsData.stats);
        }
        if (recentRes.ok && recentData.status) {
          setRecentBookings(recentData.recent_bookings || []);
          setRecentCustomers(recentData.recent_customers || []);
          setRecentProviders(recentData.recent_providers || []);
        }
      } catch {
        showToast('Failed to load dashboard data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const statsList = [
    { label: 'Total Customers',   value: stats?.total_customers   ?? '—', icon: Users,       color: 'blue'   },
    { label: 'Service Providers', value: stats?.total_providers   ?? '—', icon: Briefcase,   color: 'purple' },
    { label: 'Total Bookings',    value: stats?.total_bookings    ?? '—', icon: CalendarDays, color: 'green' },
    { label: 'Revenue',           value: stats?.total_revenue != null ? `₹${Number(stats.total_revenue).toLocaleString('en-IN')}` : '—', icon: DollarSign, color: 'amber' },
  ];

  // Combine recent customers and providers for registrations panel
  const recentRegistrations = [
    ...recentCustomers.map(c => ({ ...c, _type: 'Customer', id: c.customer_id })),
    ...recentProviders.map(p => ({ ...p, _type: 'Provider', id: p.provider_id })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">

      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            Dashboard <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Welcome back, Admin — overview of today's operational indicators.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">Current Session Date</p>
          <p className="text-[var(--color-text-primary)] text-sm font-bold mt-1">
            {today.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsList.map(({ label, value, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`rounded-3xl bg-[var(--color-card-bg)] border ${c.border} p-6 flex items-center gap-5 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group ${c.hoverBorder}`}>
              <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                <Icon size={24} className={c.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wider">{label}</p>
                {loading ? (
                  <Loader2 size={20} className={`mt-2 animate-spin ${c.text}`} />
                ) : (
                  <p className="text-[var(--color-text-primary)] text-3xl font-black mt-1 leading-none tracking-tight">
                    {value}
                  </p>
                )}
                {!loading && stats?.pending_providers != null && label === 'Service Providers' && (
                  <p className="text-xs text-amber-400 mt-1 font-semibold">{stats.pending_providers} pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Booking Trends Chart Placeholder */}
        <div className="lg:col-span-2 rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-6 backdrop-blur-xl flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[var(--color-text-primary)] font-bold text-base">Booking Trends &amp; Traffic</h2>
              <p className="text-[var(--color-text-secondary)] text-xs mt-1">Monthly breakdown of bookings and verified transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-[var(--color-text-secondary)] font-semibold">Bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-[10px] text-[var(--color-text-secondary)] font-semibold">Revenue</span>
              </div>
            </div>
          </div>

          {/* Simple stats bars based on real data */}
          <div className="relative h-56 w-full mt-4 flex flex-col items-center justify-center rounded-2xl bg-[var(--color-secondary-bg)]/40 border border-[var(--color-border-subtle)] gap-4 px-8">
            {loading ? (
              <Loader2 size={28} className="animate-spin text-blue-400" />
            ) : stats ? (
              <>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                    <span>Bookings</span>
                    <span className="text-blue-400 font-bold">{stats.total_bookings}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-zinc-800)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (stats.total_bookings / Math.max(stats.total_bookings, 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                    <span>Revenue</span>
                    <span className="text-purple-400 font-bold">₹{Number(stats.total_revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-zinc-800)] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.total_revenue > 0 ? 70 : 0}%` }} />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                    <span>Providers</span>
                    <span className="text-green-400 font-bold">{stats.total_providers}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-zinc-800)] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (stats.total_providers / Math.max(stats.total_providers, 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                    <span>Customers</span>
                    <span className="text-amber-400 font-bold">{stats.total_customers}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-zinc-800)] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (stats.total_customers / Math.max(stats.total_customers, 1)) * 100)}%` }} />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[var(--color-text-secondary)] text-xs">No data available</p>
            )}
          </div>
        </div>

        {/* Quick Actions Sidebox */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-6 backdrop-blur-xl shadow-xl flex-1">
            <h2 className="text-[var(--color-text-primary)] font-bold text-sm mb-4 tracking-wide uppercase">Quick Operations</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, to, icon, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-start p-4 rounded-2xl bg-[var(--color-secondary-bg)] hover:bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] hover:border-blue-500/30 transition-all duration-300 group text-left"
                >
                  <span className="text-lg mb-2 text-blue-400 bg-blue-500/10 w-8 h-8 rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-all">{icon}</span>
                  <p className="text-[var(--color-text-primary)] text-xs font-bold">{label}</p>
                  <p className="text-[var(--color-text-secondary)] text-[9px] mt-1 line-clamp-1">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar widget + Recent users & bookings row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Dynamic calendar widget */}
        <div className="rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                <h3 className="text-[var(--color-text-primary)] font-bold text-sm">Booking Calendar</h3>
              </div>
              <span className="text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {monthName} {year}
              </span>
            </div>

            {/* Calendar grid rendering */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mt-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-[var(--color-text-secondary)] font-bold py-1">{day}</div>
              ))}

              {[...Array(firstDayOfMonth)].map((_, i) => (
                <div key={`empty-${i}`} className="py-2.5 text-transparent">.</div>
              ))}

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
                        ? 'bg-blue-600 text-[var(--color-text-primary)] shadow-lg shadow-blue-500/20'
                        : isToday
                        ? 'text-blue-400 ring-1 ring-blue-500/40'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)]'
                    }`}
                  >
                    <span>{dayNumber}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] text-left">
            <p className="text-[var(--color-text-secondary)] text-[10px] uppercase font-bold tracking-wider">
              Bookings on {monthName} {selectedCalendarDate ?? '—'}
            </p>
            <div className="mt-2.5">
              <p className="text-[var(--color-text-secondary)] text-xs py-3 italic">No bookings scheduled on this date.</p>
            </div>
          </div>
        </div>

        {/* Recent Bookings Panel */}
        <div className="rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-[var(--color-text-primary)] font-bold text-sm">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)]">
                  <th className="text-left px-6 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">ID</th>
                  <th className="text-left px-6 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <Loader2 size={24} className="mx-auto animate-spin text-blue-400" />
                    </td>
                  </tr>
                ) : recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <p className="text-[var(--color-text-secondary)] text-xs">No recent bookings</p>
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.booking_id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-overlay-subtle)] transition-colors">
                      <td className="px-6 py-3 text-[var(--color-text-secondary)] text-xs font-mono">#{b.booking_number || b.booking_id}</td>
                      <td className="px-6 py-3 text-[var(--color-text-primary)] text-xs font-semibold truncate max-w-[120px]">{b.customer_name}</td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge(b.booking_status)}`}>
                          {b.booking_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-[var(--color-text-primary)] font-bold text-sm">New Registrations</h2>
            <Link to="/admin/customers" className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-400" />
            </div>
          ) : recentRegistrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <p className="text-[var(--color-text-secondary)] text-xs">No recent registrations</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {recentRegistrations.map((u) => (
                <div key={`${u._type}-${u.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-[var(--color-overlay-subtle)] transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-primary)] text-xs font-black flex-shrink-0 ${u._type === 'Provider' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                    {u.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--color-text-primary)] text-xs font-semibold truncate">{u.full_name}</p>
                    <p className="text-[var(--color-text-secondary)] text-[10px]">{u._type} · {u.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${userStatusBadge(u.status)}`}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
