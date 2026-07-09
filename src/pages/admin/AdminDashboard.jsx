import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users, Briefcase, CalendarDays, DollarSign,
  TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight,
  Star, Activity, Sparkles, Calendar, ChevronRight as ChevronIcon, Eye, Check, X
} from 'lucide-react';

const colorMap = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400', hoverBorder: 'hover:border-blue-500/40' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400', hoverBorder: 'hover:border-purple-500/40' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: 'text-green-400', hoverBorder: 'hover:border-green-500/40' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400', hoverBorder: 'hover:border-amber-500/40' },
};

const quickActions = [
  { label: 'Add Category', to: '/admin/categories', icon: '＋', desc: 'Create a new service category' },
  { label: 'Review Approvals', to: '/admin/provider-approval', icon: '✓', desc: 'Check pending provider requests' },
  { label: 'View Reports', to: '/admin/reports', icon: '📊', desc: 'See platform analytics' },
  { label: 'Manage Bookings', to: '/admin/bookings', icon: '📅', desc: 'Update booking statuses' },
];

const initialBookings = [
  { id: 'BK-1021', customer: 'Priya Sharma', service: 'Plumbing', provider: 'Raju Works', status: 'Confirmed', date: '09 Jul 2026', time: '10:00 AM', amount: '₹1,200' },
  { id: 'BK-1020', customer: 'Arjun Mehta', service: 'Electrician', provider: 'PowerFix Co.', status: 'Pending', date: '08 Jul 2026', time: '02:30 PM', amount: '₹800' },
  { id: 'BK-1019', customer: 'Sneha Patel', service: 'Cleaning', provider: 'CleanPro India', status: 'Completed', date: '07 Jul 2026', time: '11:15 AM', amount: '₹2,500' },
  { id: 'BK-1018', customer: 'Vikram Reddy', service: 'Carpentry', provider: 'WoodCraft Ltd', status: 'Cancelled', date: '06 Jul 2026', time: '04:00 PM', amount: '₹1,500' },
  { id: 'BK-1017', customer: 'Anita Joshi', service: 'Pest Control', provider: 'PestAway', status: 'Confirmed', date: '05 Jul 2026', time: '09:00 AM', amount: '₹3,200' },
];

const recentUsers = [
  { name: 'Priya Sharma', email: 'priya@email.com', type: 'Customer', joined: '09 Jul' },
  { name: 'Raju Works', email: 'raju@works.com', type: 'Provider', joined: '08 Jul' },
  { name: 'Arjun Mehta', email: 'arjun@email.com', type: 'Customer', joined: '08 Jul' },
  { name: 'CleanPro India', email: 'cp@cleanpro.com', type: 'Provider', joined: '07 Jul' },
  { name: 'Sneha Patel', email: 'sneha@email.com', type: 'Customer', joined: '07 Jul' },
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

const barData = [
  { month: 'Feb', bookings: 350, revenue: 240 },
  { month: 'Mar', bookings: 420, revenue: 310 },
  { month: 'Apr', bookings: 480, revenue: 380 },
  { month: 'May', bookings: 410, revenue: 290 },
  { month: 'Jun', bookings: 590, revenue: 470 },
  { month: 'Jul', bookings: 680, revenue: 540 },
];

const AnimatedCounter = ({ target, duration = 1000, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration]);

  const formatNumber = (num) => {
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    return num.toLocaleString();
  };

  return <span>{prefix}{formatNumber(count)}{suffix}</span>;
};

const AdminDashboard = () => {
  const { showToast } = useOutletContext();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 9)); // July 9, 2026
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(9); // 9th July
  const [bookings, setBookings] = useState(initialBookings);

  // Stats definition with raw values for animation
  const statsList = [
    { label: 'Total Customers', value: 3842, icon: Users, change: '+12%', up: true, color: 'blue' },
    { label: 'Service Providers', value: 486, icon: Briefcase, change: '+8%', up: true, color: 'purple' },
    { label: 'Total Bookings', value: 12304, icon: CalendarDays, change: '+21%', up: true, color: 'green' },
    { label: 'Revenue (Demo)', value: 840000, icon: DollarSign, change: '+14%', up: true, color: 'amber', prefix: '₹' },
  ];

  // Calendar bookings mock maps days in July 2026 to simple logs
  const calendarBookings = {
    5: [{ id: 'BK-1017', customer: 'Anita Joshi', time: '09:00 AM', status: 'Confirmed' }],
    6: [{ id: 'BK-1018', customer: 'Vikram Reddy', time: '04:00 PM', status: 'Cancelled' }],
    7: [{ id: 'BK-1019', customer: 'Sneha Patel', time: '11:15 AM', status: 'Completed' }],
    8: [{ id: 'BK-1020', customer: 'Arjun Mehta', time: '02:30 PM', status: 'Pending' }],
    9: [
      { id: 'BK-1021', customer: 'Priya Sharma', time: '10:00 AM', status: 'Confirmed' },
      { id: 'BK-1022', customer: 'Rohan Kapoor', time: '01:00 PM', status: 'Confirmed' }
    ],
    12: [{ id: 'BK-1023', customer: 'Meera Singh', time: '03:30 PM', status: 'Pending' }]
  };

  const handleActionClick = (actionName) => {
    showToast(`Quick action triggered: ${actionName}`, 'info');
  };

  const handleStatusChange = (id, newStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    showToast(`Booking ${id} status updated to ${newStatus}`, 'success');
  };

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
          <p className="text-white text-sm font-bold mt-1">Thursday, 09 July 2026</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsList.map(({ label, value, icon: Icon, change, up, color, prefix = '' }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`rounded-3xl bg-[#0d1425]/40 border ${c.border} p-6 flex items-center gap-5 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group ${c.hoverBorder}`}>
              <div className={`w-14 h-14 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                <Icon size={24} className={c.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-white text-3xl font-black mt-1 leading-none tracking-tight">
                  <AnimatedCounter target={value} prefix={prefix} />
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {change}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">vs last month</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Calendar row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bookings Bar Chart */}
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

          {/* SVG Custom Responsive Bar Chart with Hover effects & interactive values */}
          <div className="relative h-56 w-full mt-4 flex items-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-white/5">
              {[0, 25, 50, 75, 100].map((tick) => (
                <div key={tick} className="w-full flex items-center justify-between">
                  <div className="w-full border-t border-white/5" />
                </div>
              ))}
            </div>

            <div className="relative z-10 flex w-full h-full items-end justify-around px-2">
              {barData.map((d, index) => {
                const maxVal = 700;
                const bookingHeight = (d.bookings / maxVal) * 100;
                const revHeight = (d.revenue / maxVal) * 100;
                
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center justify-end h-full group px-2 max-w-[80px]">
                    
                    {/* Tooltip Overlay */}
                    {hoveredBar === index && (
                      <div className="absolute bottom-[80%] bg-[#080d19] border border-white/10 p-2.5 rounded-xl shadow-2xl text-[10px] z-50 text-left min-w-[120px] backdrop-blur-md animate-fade-in">
                        <p className="text-white font-bold mb-1">{d.month} 2026</p>
                        <p className="text-blue-400 font-semibold">Bookings: <span className="text-white font-medium">{d.bookings}</span></p>
                        <p className="text-purple-400 font-semibold">Volume: <span className="text-white font-medium">₹{d.revenue}K</span></p>
                      </div>
                    )}

                    <div 
                      className="w-full flex items-end justify-center gap-1.5 h-[75%] cursor-pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Bookings Bar */}
                      <div 
                        style={{ height: `${bookingHeight}%` }} 
                        className={`w-4 sm:w-5 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 group-hover:brightness-110 shadow-lg shadow-blue-500/10 ${hoveredBar === index ? 'scale-x-110' : ''}`}
                      />
                      {/* Revenue Bar */}
                      <div 
                        style={{ height: `${revHeight}%` }} 
                        className={`w-4 sm:w-5 rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-300 group-hover:brightness-110 shadow-lg shadow-purple-500/10 ${hoveredBar === index ? 'scale-x-110' : ''}`}
                      />
                    </div>
                    <span className="text-zinc-500 text-[10px] font-bold mt-2 tracking-wide uppercase">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions & Calendar Sidebox */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
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
              <span className="text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider">July 2026</span>
            </div>
            
            {/* Calendar grid rendering */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mt-3">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-zinc-500 font-bold py-1">{day}</div>
              ))}
              
              {/* Empty days in grid before start of July 2026 (Wednesday starts) */}
              {[...Array(3)].map((_, i) => (
                <div key={`empty-${i}`} className="py-2.5 text-transparent">.</div>
              ))}

              {/* Render July days */}
              {[...Array(31)].map((_, i) => {
                const dayNumber = i + 1;
                const hasBookings = calendarBookings[dayNumber] !== undefined;
                const isSelected = selectedCalendarDate === dayNumber;
                
                return (
                  <button
                    key={dayNumber}
                    onClick={() => {
                      setSelectedCalendarDate(dayNumber);
                      showToast(`Viewing schedule for July ${dayNumber}`, 'info');
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold relative transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{dayNumber}</span>
                    {hasBookings && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(96,165,250,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Bookings Detail list */}
          <div className="mt-6 pt-4 border-t border-white/5 text-left">
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Bookings on July {selectedCalendarDate}</p>
            <div className="mt-2.5 space-y-2">
              {calendarBookings[selectedCalendarDate] ? (
                calendarBookings[selectedCalendarDate].map(bk => (
                  <div key={bk.id} className="p-3 rounded-2xl bg-[#090e1c]/80 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-bold leading-none">{bk.customer}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{bk.time} • <span className="font-mono">{bk.id}</span></p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge(bk.status)}`}>
                      {bk.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-xs py-3 italic">No bookings scheduled on this date.</p>
              )}
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
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3.5 text-zinc-400 text-xs font-mono">{b.id}</td>
                    <td className="px-6 py-3.5 text-white text-xs font-bold">{b.customer}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button 
                        onClick={() => setSelectedBooking(b)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
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
          <div className="divide-y divide-white/5">
            {recentUsers.map((u) => (
              <div key={u.email} className="flex items-center gap-3.5 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md">
                  {u.name[0]}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-white text-xs font-bold truncate">{u.name}</p>
                  <p className="text-zinc-500 text-[10px] truncate mt-0.5">{u.email}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  u.type === 'Provider' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {u.type}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Detail Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <h3 className="text-white font-bold text-lg mb-1">Booking Investigation</h3>
            <p className="text-zinc-500 text-xs mb-6">Inspect status parameters for booking ID <span className="font-mono font-bold text-zinc-300">{selectedBooking.id}</span></p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Customer</span>
                  <p className="text-white text-xs font-bold mt-1">{selectedBooking.customer}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Provider Partner</span>
                  <p className="text-white text-xs font-bold mt-1">{selectedBooking.provider}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Service Category</span>
                  <p className="text-white text-xs font-bold mt-1">{selectedBooking.service}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Scheduled Date</span>
                  <p className="text-white text-xs font-bold mt-1">{selectedBooking.date} ({selectedBooking.time})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Booking Cost</span>
                  <p className="text-green-400 text-sm font-black mt-1">{selectedBooking.amount}</p>
                </div>
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">Current Status</span>
                  <div className="mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusBadge(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Modifiers inside investigation modal */}
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Change Status</span>
              <div className="flex gap-2">
                {['Confirmed', 'Completed', 'Cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      handleStatusChange(selectedBooking.id, st);
                      setSelectedBooking(prev => ({ ...prev, status: st }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      selectedBooking.status === st 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
