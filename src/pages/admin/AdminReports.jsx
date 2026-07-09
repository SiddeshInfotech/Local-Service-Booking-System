import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign, Users, Briefcase, CalendarDays, Download, TrendingUp, Sparkles, Loader2, ArrowRight, ArrowUpRight, Search } from 'lucide-react';

// Monthly report data variations based on range
const rangesData = {
  'Last 30 Days': {
    stats: [
      { label: 'Total Revenue', value: '₹1,86,000', sub: '+18% vs last month', icon: DollarSign, color: 'green' },
      { label: 'Total Bookings', value: '2,840', sub: '+24% vs last month', icon: CalendarDays, color: 'blue' },
      { label: 'Active Customers', value: '3,842', sub: '+12% this month', icon: Users, color: 'purple' },
      { label: 'Active Providers', value: '486', sub: '+8% this month', icon: Briefcase, color: 'amber' },
    ],
    monthlyBookings: [
      { m: 'Week 1', v: 420 }, { m: 'Week 2', v: 550 }, { m: 'Week 3', v: 630 }, { m: 'Week 4', v: 880 },
    ],
    userGrowth: [38, 45, 52, 65, 82, 91, 110, 132],
    categoryRevenue: [
      { name: 'Plumbing', pct: 30, color: '#3b82f6', amount: '₹55,800' },
      { name: 'Electrician', pct: 25, color: '#8b5cf6', amount: '₹46,500' },
      { name: 'Cleaning', pct: 20, color: '#10b981', amount: '₹37,200' },
      { name: 'Carpentry', pct: 15, color: '#f59e0b', amount: '₹27,900' },
      { name: 'Others', pct: 10, color: '#6b7280', amount: '₹18,600' },
    ],
    summary: [
      { m: 'Week 4', b: 880, u: 52, r: '₹58,000' },
      { m: 'Week 3', b: 630, u: 40, r: '₹41,000' },
      { m: 'Week 2', b: 550, u: 28, r: '₹36,000' },
      { m: 'Week 1', b: 420, u: 12, r: '₹27,000' },
    ]
  },
  'Last 7 Days': {
    stats: [
      { label: 'Total Revenue', value: '₹48,200', sub: '+5% vs last week', icon: DollarSign, color: 'green' },
      { label: 'Total Bookings', value: '620', sub: '+12% vs last week', icon: CalendarDays, color: 'blue' },
      { label: 'Active Customers', value: '1,204', sub: '+4% this week', icon: Users, color: 'purple' },
      { label: 'Active Providers', value: '312', sub: '+2% this week', icon: Briefcase, color: 'amber' },
    ],
    monthlyBookings: [
      { m: 'Mon', v: 75 }, { m: 'Tue', v: 88 }, { m: 'Wed', v: 95 }, { m: 'Thu', v: 110 },
      { m: 'Fri', v: 120 }, { m: 'Sat', v: 85 }, { m: 'Sun', v: 47 }
    ],
    userGrowth: [10, 15, 22, 28, 35, 41, 48, 55],
    categoryRevenue: [
      { name: 'Plumbing', pct: 32, color: '#3b82f6', amount: '₹15,424' },
      { name: 'Electrician', pct: 28, color: '#8b5cf6', amount: '₹13,496' },
      { name: 'Cleaning', pct: 18, color: '#10b981', amount: '₹8,676' },
      { name: 'Carpentry', pct: 12, color: '#f59e0b', amount: '₹5,784' },
      { name: 'Others', pct: 10, color: '#6b7280', amount: '₹4,820' },
    ],
    summary: [
      { m: 'Thu, 09 Jul', b: 110, u: 8, r: '₹8,560' },
      { m: 'Wed, 08 Jul', b: 95, u: 6, r: '₹7,400' },
      { m: 'Tue, 07 Jul', b: 88, u: 7, r: '₹6,800' },
      { m: 'Mon, 06 Jul', b: 75, u: 5, r: '₹5,800' },
    ]
  },
  'Year-to-Date': {
    stats: [
      { label: 'Total Revenue', value: '₹8,42,000', sub: '+14% YTD', icon: DollarSign, color: 'green' },
      { label: 'Total Bookings', value: '12,304', sub: '+21% YTD', icon: CalendarDays, color: 'blue' },
      { label: 'Active Customers', value: '3,842', sub: '+12% YTD', icon: Users, color: 'purple' },
      { label: 'Active Providers', value: '486', sub: '+8% YTD', icon: Briefcase, color: 'amber' },
    ],
    monthlyBookings: [
      { m: 'Jan', v: 420 }, { m: 'Feb', v: 550 }, { m: 'Mar', v: 630 }, { m: 'Apr', v: 480 },
      { m: 'May', v: 710 }, { m: 'Jun', v: 880 }, { m: 'Jul', v: 950 },
    ],
    userGrowth: [38, 45, 52, 58, 65, 74, 82, 91],
    categoryRevenue: [
      { name: 'Plumbing', pct: 28, color: '#3b82f6', amount: '₹2,35,760' },
      { name: 'Electrician', pct: 22, color: '#8b5cf6', amount: '₹1,85,240' },
      { name: 'Cleaning', pct: 20, color: '#10b981', amount: '₹1,68,400' },
      { name: 'Carpentry', pct: 12, color: '#f59e0b', amount: '₹1,01,040' },
      { name: 'Others', pct: 18, color: '#6b7280', amount: '₹1,51,560' },
    ],
    summary: [
      { m: 'July YTD', b: 950, u: 82, r: '₹1,86,000' },
      { m: 'June YTD', b: 880, u: 74, r: '₹1,72,000' },
      { m: 'May YTD', b: 710, u: 65, r: '₹1,39,000' },
      { m: 'April YTD', b: 480, u: 58, r: '₹94,000' },
    ]
  }
};

const colorMap = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', val: 'text-green-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', val: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', val: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', val: 'text-amber-400' },
};

// Build conic-gradient string for donut/pie charts
const buildPieGradient = (slices) => {
  let cum = 0;
  return slices.map(({ pct, color }) => {
    const start = cum;
    cum += pct;
    return `${color} ${start}% ${cum}%`;
  }).join(', ');
};

const AdminReports = () => {
  const { showToast } = useOutletContext();
  const [selectedRange, setSelectedRange] = useState('Year-to-Date');
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const activeData = rangesData[selectedRange];
  const pieGradient = buildPieGradient(activeData.categoryRevenue);

  const handleExport = () => {
    setIsExporting(true);
    showToast('Preparing PDF/Excel format configurations...', 'info');
    setTimeout(() => {
      setIsExporting(false);
      showToast('Export successful! Check downloads folder.', 'success');
    }, 2000);
  };

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">
      
      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Dashboard &amp; Reports <Sparkles className="text-blue-400 w-5 h-5" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Platform analytics and commercial metrics overview.</p>
        </div>

        {/* Date Filter controls */}
        <div className="flex items-center gap-2 bg-[#0d1425]/40 p-1.5 border border-white/5 rounded-2xl">
          {['Last 7 Days', 'Last 30 Days', 'Year-to-Date'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setSelectedRange(range);
                showToast(`Filter applied: ${range}`, 'info');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRange === range
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/15 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Export Report</span>
            </>
          )}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {activeData.stats.map(({ label, value, sub, icon: Icon, color }) => {
          const c = colorMap[color];
          return (
            <div key={label} className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl hover:border-white/10 transition-all duration-300 shadow-md">
              <div className={`w-11 h-11 rounded-2xl ${c.bg} border border-white/5 flex items-center justify-center mb-4`}>
                <Icon size={20} className={c.icon} />
              </div>
              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-black mt-1 ${c.val}`}>{value}</p>
              <p className="text-green-400 text-xs mt-3 flex items-center gap-1.5 font-semibold">
                <TrendingUp size={12} /> {sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar chart: Bookings */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-white font-bold text-sm">Volume Diagnostics</h2>
            <p className="text-zinc-500 text-xs mt-1">Bookings traffic volume - {selectedRange}</p>
          </div>
          <div className="flex items-end gap-2.5 h-44 mt-6">
            {activeData.monthlyBookings.map(({ m, v }) => {
              const maxVal = Math.max(...activeData.monthlyBookings.map(d => d.v));
              const heightPct = (v / maxVal) * 100;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-zinc-400 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-[#080d19] px-1 rounded border border-white/5 mb-1">{v}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600/90 to-blue-400 transition-all duration-300 group-hover:brightness-110 shadow-lg shadow-blue-500/10 cursor-pointer"
                    style={{ height: `${heightPct * 0.75}%` }}
                  />
                  <span className="text-zinc-500 text-[10px] font-bold mt-1 uppercase">{m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Line / Area chart: User Growth with tooltip tracker */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold text-sm">User Acquisition</h2>
              <p className="text-zinc-500 text-xs mt-1">Total newly registered members (YTD)</p>
            </div>
            {hoveredPoint !== null && (
              <div className="bg-[#080d19] border border-white/10 px-2 py-1 rounded-xl text-[9px] text-zinc-300">
                Data Index {hoveredPoint}: <span className="text-purple-400 font-bold">{activeData.userGrowth[hoveredPoint]} users</span>
              </div>
            )}
          </div>
          
          <div className="relative h-44 mt-6">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0 border-t border-white/5"
                style={{ bottom: `${pct}%` }}
              />
            ))}
            {/* SVG line */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <polygon
                points={[
                  ...activeData.userGrowth.map((v, i) => `${(i / (activeData.userGrowth.length - 1)) * 100}%,${100 - (v / 150) * 100}%`),
                  '100%,100%', '0%,100%',
                ].join(' ')}
                fill="url(#lineGrad)"
                className="transition-all duration-500"
              />
              {/* Line */}
              <polyline
                points={activeData.userGrowth.map((v, i) => `${(i / (activeData.userGrowth.length - 1)) * 100}%,${100 - (v / 150) * 100}%`).join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
              {/* Dots */}
              {activeData.userGrowth.map((v, i) => {
                const cx = `${(i / (activeData.userGrowth.length - 1)) * 100}%`;
                const cy = `${100 - (v / 150) * 100}%`;
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={hoveredPoint === i ? "6" : "4"}
                    fill="#8b5cf6"
                    stroke="#0b111e"
                    strokeWidth="2"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer transition-all duration-200 hover:scale-125"
                  />
                );
              })}
            </svg>
          </div>
          {/* Labels */}
          <div className="flex justify-between mt-3 px-1">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'].slice(0, activeData.userGrowth.length).map((m) => (
              <span key={m} className="text-zinc-500 text-[10px] font-bold uppercase">{m}</span>
            ))}
          </div>
        </div>

      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut chart: Category revenue */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row gap-8 items-center">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Donut circle container */}
            <div
              className="w-full h-full rounded-full transition-all duration-500 shadow-xl"
              style={{ background: `conic-gradient(${pieGradient})` }}
            />
            {/* Center cutout */}
            <div className="absolute w-[70%] h-[70%] rounded-full bg-[#0d1527] flex flex-col justify-center items-center p-2 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Category</span>
              <span className="text-white text-xs font-bold mt-1 text-center truncate w-full">
                {hoveredCategory !== null ? activeData.categoryRevenue[hoveredCategory].name : 'Overall'}
              </span>
              <span className="text-blue-400 text-xs font-black mt-0.5">
                {hoveredCategory !== null ? `${activeData.categoryRevenue[hoveredCategory].pct}%` : '100%'}
              </span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col gap-2.5 w-full text-left">
            <h2 className="text-white font-bold text-sm">Revenue by Category</h2>
            <p className="text-zinc-500 text-xs mb-2">Distribution of earnings per service type</p>
            <div className="space-y-2">
              {activeData.categoryRevenue.map(({ name, pct, color, amount }, index) => (
                <div 
                  key={name} 
                  onMouseEnter={() => setHoveredCategory(index)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl border border-transparent transition-colors cursor-pointer ${hoveredCategory === index ? 'bg-white/5 border-white/5' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-zinc-300 text-xs font-semibold">{name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400 text-xs font-bold">{amount}</span>
                    <span className="text-blue-400 text-xs font-bold">{pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-white font-bold text-sm">Timeline Breakdowns</h2>
            <p className="text-zinc-500 text-xs mt-1">Calculated operational breakdowns - {selectedRange}</p>
          </div>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0e1b]/40">
                  <th className="text-left px-4 py-3 text-zinc-500 font-bold uppercase tracking-wider">Interval</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-bold uppercase tracking-wider">Bookings</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-bold uppercase tracking-wider">New Users</th>
                  <th className="text-right px-4 py-3 text-zinc-500 font-bold uppercase tracking-wider">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {activeData.summary.map(({ m, b, u, r }) => (
                  <tr key={m} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-bold">{m}</td>
                    <td className="px-4 py-3 text-zinc-400 font-semibold">{b}</td>
                    <td className="px-4 py-3 text-zinc-400 font-semibold">{u}</td>
                    <td className="px-4 py-3 text-green-400 font-black text-right">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-4 text-right">
            <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider flex items-center justify-end gap-1.5">
              Live Audited Ledger <ArrowRight size={10} />
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminReports;
