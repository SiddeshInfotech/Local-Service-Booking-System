import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, CalendarDays, DollarSign,
  TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight,
  Star, Activity,
} from 'lucide-react';

const stats = [
  { label: 'Total Customers', value: '3,842', icon: Users, change: '+12%', up: true, color: 'blue' },
  { label: 'Service Providers', value: '486', icon: Briefcase, change: '+8%', up: true, color: 'purple' },
  { label: 'Total Bookings', value: '12,304', icon: CalendarDays, change: '+21%', up: true, color: 'green' },
  { label: 'Revenue (Demo)', value: '₹8.4L', icon: DollarSign, change: '-3%', up: false, color: 'amber' },
];

const colorMap = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', badge: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', badge: 'text-purple-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', badge: 'text-green-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', badge: 'text-amber-400' },
};

const recentBookings = [
  { id: 'BK-1021', customer: 'Priya Sharma', service: 'Plumbing', provider: 'Raju Works', status: 'Confirmed', date: '09 Jul 2026' },
  { id: 'BK-1020', customer: 'Arjun Mehta', service: 'Electrician', provider: 'PowerFix Co.', status: 'Pending', date: '08 Jul 2026' },
  { id: 'BK-1019', customer: 'Sneha Patel', service: 'Cleaning', provider: 'CleanPro India', status: 'Completed', date: '07 Jul 2026' },
  { id: 'BK-1018', customer: 'Vikram Reddy', service: 'Carpentry', provider: 'WoodCraft Ltd', status: 'Cancelled', date: '06 Jul 2026' },
  { id: 'BK-1017', customer: 'Anita Joshi', service: 'Pest Control', provider: 'PestAway', status: 'Confirmed', date: '05 Jul 2026' },
];

const recentUsers = [
  { name: 'Priya Sharma', email: 'priya@email.com', type: 'Customer', joined: '09 Jul' },
  { name: 'Raju Works', email: 'raju@works.com', type: 'Provider', joined: '08 Jul' },
  { name: 'Arjun Mehta', email: 'arjun@email.com', type: 'Customer', joined: '08 Jul' },
  { name: 'CleanPro India', email: 'cp@cleanpro.com', type: 'Provider', joined: '07 Jul' },
  { name: 'Sneha Patel', email: 'sneha@email.com', type: 'Customer', joined: '07 Jul' },
];

const quickActions = [
  { label: 'Add Category', to: '/admin/categories', icon: '＋', desc: 'Create a new service category' },
  { label: 'Review Approvals', to: '/admin/provider-approval', icon: '✓', desc: 'Check pending provider requests' },
  { label: 'View Reports', to: '/admin/reports', icon: '📊', desc: 'See platform analytics' },
  { label: 'Manage Bookings', to: '/admin/bookings', icon: '📅', desc: 'Update booking statuses' },
];

const statusBadge = (status) => {
  const map = {
    Confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Completed: 'bg-green-500/15 text-green-400 border-green-500/20',
    Cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
  };
  return map[status] || 'bg-zinc-700/30 text-zinc-400 border-zinc-700';
};

// Simple CSS bar chart data
const barData = [
  { month: 'Feb', val: 55 }, { month: 'Mar', val: 68 }, { month: 'Apr', val: 74 },
  { month: 'May', val: 61 }, { month: 'Jun', val: 88 }, { month: 'Jul', val: 95 },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Welcome back, Admin — here's what's happening on Fixora.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, change, up, color }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`rounded-2xl bg-[#131b2e]/50 border ${c.border} p-5 flex items-center gap-4 backdrop-blur-sm`}>
              <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
                <Icon size={22} className={c.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-400 text-xs font-medium truncate">{label}</p>
                <p className="text-white text-2xl font-bold leading-tight">{value}</p>
                <p className={`text-xs font-semibold mt-0.5 ${up ? 'text-green-400' : 'text-red-400'}`}>
                  {change} this month
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Quick Actions row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bookings Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-sm">Booking Trends</h2>
              <p className="text-zinc-500 text-xs mt-0.5">Monthly bookings (Demo)</p>
            </div>
            <Activity size={16} className="text-blue-400" />
          </div>
          <div className="flex items-end gap-2 h-36">
            {barData.map(({ month, val }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-500 transition-all duration-500 hover:from-blue-600 hover:to-blue-400"
                  style={{ height: `${val}%` }}
                />
                <span className="text-zinc-500 text-[10px]">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {quickActions.map(({ label, to, icon, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/70 border border-zinc-800/60 hover:border-blue-500/30 transition-all duration-200 group"
              >
                <span className="text-lg leading-none w-6 text-center">{icon}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold">{label}</p>
                  <p className="text-zinc-500 text-[10px] truncate">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-blue-400 ml-auto flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent Bookings */}
        <div className="lg:col-span-3 rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
            <h2 className="text-white font-semibold text-sm">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/40">
                  <th className="text-left px-5 py-3 text-zinc-500 text-xs font-medium">ID</th>
                  <th className="text-left px-5 py-3 text-zinc-500 text-xs font-medium">Customer</th>
                  <th className="text-left px-5 py-3 text-zinc-500 text-xs font-medium hidden sm:table-cell">Service</th>
                  <th className="text-left px-5 py-3 text-zinc-500 text-xs font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-3 text-zinc-400 text-xs font-mono">{b.id}</td>
                    <td className="px-5 py-3 text-white text-xs">{b.customer}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs hidden sm:table-cell">{b.service}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-2 rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
            <h2 className="text-white font-semibold text-sm">New Users</h2>
            <Link to="/admin/customers" className="text-blue-400 text-xs hover:text-blue-300 transition-colors flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {recentUsers.map((u) => (
              <div key={u.email} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-900/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-medium truncate">{u.name}</p>
                  <p className="text-zinc-500 text-[10px] truncate">{u.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${u.type === 'Provider' ? 'bg-purple-500/15 text-purple-400' : 'bg-blue-500/15 text-blue-400'
                  }`}>
                  {u.type}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
