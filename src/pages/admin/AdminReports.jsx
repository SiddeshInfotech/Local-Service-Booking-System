import React from 'react';
import { DollarSign, Users, Briefcase, CalendarDays, Download, TrendingUp } from 'lucide-react';

// Dummy chart data
const monthlyBookings = [
  { m: 'Jan', v: 42 }, { m: 'Feb', v: 55 }, { m: 'Mar', v: 63 }, { m: 'Apr', v: 48 },
  { m: 'May', v: 71 }, { m: 'Jun', v: 88 }, { m: 'Jul', v: 95 },
];

const userGrowth = [38, 45, 52, 58, 65, 74, 82, 91];

const categoryRevenue = [
  { name: 'Plumbing',    pct: 28, color: '#3b82f6' },
  { name: 'Electrician', pct: 22, color: '#8b5cf6' },
  { name: 'Cleaning',    pct: 20, color: '#10b981' },
  { name: 'Carpentry',   pct: 12, color: '#f59e0b' },
  { name: 'Others',      pct: 18, color: '#6b7280' },
];

// Build conic-gradient string for pie chart
const buildPieGradient = (slices) => {
  let cum = 0;
  return slices.map(({ pct, color }) => {
    const start = cum;
    cum += pct;
    return `${color} ${start}% ${cum}%`;
  }).join(', ');
};

const statCards = [
  { label: 'Total Revenue (Demo)', value: '₹8,42,000', sub: '+14% this month',  icon: DollarSign,   color: 'green'  },
  { label: 'Total Bookings',       value: '12,304',    sub: '+21% this month',  icon: CalendarDays, color: 'blue'   },
  { label: 'Active Customers',     value: '3,842',     sub: '+12% this month',  icon: Users,        color: 'purple' },
  { label: 'Active Providers',     value: '486',       sub: '+8% this month',   icon: Briefcase,    color: 'amber'  },
];

const colorMap = {
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  val: 'text-green-400' },
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   val: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', val: 'text-purple-400' },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  icon: 'text-amber-400',  val: 'text-amber-400' },
};

const AdminReports = () => {
  const pieGradient = buildPieGradient(categoryRevenue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard &amp; Reports</h1>
          <p className="text-zinc-500 text-sm mt-1">Platform analytics and performance overview (dummy data).</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div key={label} className={`rounded-2xl bg-[#131b2e]/50 border ${c.border} p-5`}>
              <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-3`}>
                <Icon size={20} className={c.icon} />
              </div>
              <p className="text-zinc-400 text-xs">{label}</p>
              <p className={`text-2xl font-black mt-0.5 ${c.val}`}>{value}</p>
              <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                <TrendingUp size={11} /> {sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Bar chart: Bookings */}
        <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5">
          <h2 className="text-white font-semibold text-sm mb-1">Monthly Bookings</h2>
          <p className="text-zinc-500 text-xs mb-4">Booking volume by month — 2026</p>
          <div className="flex items-end gap-2 h-40">
            {monthlyBookings.map(({ m, v }) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-zinc-400 text-[10px] font-medium">{v}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400 transition-all hover:from-blue-600 hover:to-blue-300"
                  style={{ height: `${(v / 100) * 100}%` }}
                />
                <span className="text-zinc-500 text-[10px]">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line chart: User growth */}
        <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5">
          <h2 className="text-white font-semibold text-sm mb-1">User Growth</h2>
          <p className="text-zinc-500 text-xs mb-4">Monthly new registrations — 2026</p>
          <div className="relative h-40">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-zinc-800/50"
                style={{ bottom: `${pct}%` }}
              />
            ))}
            {/* SVG line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <polygon
                points={[
                  ...userGrowth.map((v, i) => `${(i / (userGrowth.length - 1)) * 100}%,${100 - v}%`),
                  '100%,100%', '0%,100%',
                ].join(' ')}
                fill="url(#lineGrad)"
              />
              {/* Line */}
              <polyline
                points={userGrowth.map((v, i) => `${(i / (userGrowth.length - 1)) * 100}%,${100 - v}%`).join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dots */}
              {userGrowth.map((v, i) => (
                <circle
                  key={i}
                  cx={`${(i / (userGrowth.length - 1)) * 100}%`}
                  cy={`${100 - v}%`}
                  r="4"
                  fill="#8b5cf6"
                  stroke="#0b111e"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
          {/* Labels */}
          <div className="flex justify-between mt-2">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'].map((m) => (
              <span key={m} className="text-zinc-500 text-[10px]">{m}</span>
            ))}
          </div>
        </div>

      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pie chart: Category revenue */}
        <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5 flex flex-col sm:flex-row gap-6 items-center">
          <div>
            <h2 className="text-white font-semibold text-sm mb-1">Revenue by Category</h2>
            <p className="text-zinc-500 text-xs mb-4">Distribution of earnings per service type</p>
            <div
              className="w-36 h-36 rounded-full flex-shrink-0"
              style={{ background: `conic-gradient(${pieGradient})` }}
            />
          </div>
          <div className="flex flex-col gap-2">
            {categoryRevenue.map(({ name, pct, color }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-zinc-300 text-xs">{name}</span>
                <span className="ml-auto text-zinc-400 text-xs font-semibold pl-4">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly summary table */}
        <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5">
          <h2 className="text-white font-semibold text-sm mb-1">Monthly Summary</h2>
          <p className="text-zinc-500 text-xs mb-4">Key metrics per month (2026)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="text-left py-2 text-zinc-500 font-semibold">Month</th>
                  <th className="text-left py-2 text-zinc-500 font-semibold">Bookings</th>
                  <th className="text-left py-2 text-zinc-500 font-semibold">New Users</th>
                  <th className="text-left py-2 text-zinc-500 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { m: 'January',  b: 42, u: 38, r: '₹82,000' },
                  { m: 'February', b: 55, u: 45, r: '₹1,08,000' },
                  { m: 'March',    b: 63, u: 52, r: '₹1,24,000' },
                  { m: 'April',    b: 48, u: 58, r: '₹94,000' },
                  { m: 'May',      b: 71, u: 65, r: '₹1,39,000' },
                  { m: 'June',     b: 88, u: 74, r: '₹1,72,000' },
                  { m: 'July',     b: 95, u: 82, r: '₹1,86,000' },
                ].map(({ m, b, u, r }) => (
                  <tr key={m} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="py-2.5 text-white">{m}</td>
                    <td className="py-2.5 text-zinc-300">{b}</td>
                    <td className="py-2.5 text-zinc-300">{u}</td>
                    <td className="py-2.5 text-green-400 font-semibold">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;
