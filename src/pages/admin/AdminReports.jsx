import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign, Users, Briefcase, CalendarDays, Download, TrendingUp, Sparkles, Loader2, ArrowRight, ArrowUpRight, Search } from 'lucide-react';

// Monthly report data — zeroed until backend integration
const rangesData = {
  'Last 30 Days': {
    stats: [
      { label: 'Total Revenue', value: '₹0', sub: 'No data yet', icon: DollarSign, color: 'green' },
      { label: 'Total Bookings', value: '0', sub: 'No data yet', icon: CalendarDays, color: 'blue' },
      { label: 'Active Customers', value: '0', sub: 'No data yet', icon: Users, color: 'purple' },
      { label: 'Active Providers', value: '0', sub: 'No data yet', icon: Briefcase, color: 'amber' },
    ],
    monthlyBookings: [],
    userGrowth: [],
    categoryRevenue: [],
    summary: [],
  },
  'Last 7 Days': {
    stats: [
      { label: 'Total Revenue', value: '₹0', sub: 'No data yet', icon: DollarSign, color: 'green' },
      { label: 'Total Bookings', value: '0', sub: 'No data yet', icon: CalendarDays, color: 'blue' },
      { label: 'Active Customers', value: '0', sub: 'No data yet', icon: Users, color: 'purple' },
      { label: 'Active Providers', value: '0', sub: 'No data yet', icon: Briefcase, color: 'amber' },
    ],
    monthlyBookings: [],
    userGrowth: [],
    categoryRevenue: [],
    summary: [],
  },
  'Year-to-Date': {
    stats: [
      { label: 'Total Revenue', value: '₹0', sub: 'No data yet', icon: DollarSign, color: 'green' },
      { label: 'Total Bookings', value: '0', sub: 'No data yet', icon: CalendarDays, color: 'blue' },
      { label: 'Active Customers', value: '0', sub: 'No data yet', icon: Users, color: 'purple' },
      { label: 'Active Providers', value: '0', sub: 'No data yet', icon: Briefcase, color: 'amber' },
    ],
    monthlyBookings: [],
    userGrowth: [],
    categoryRevenue: [],
    summary: [],
  },
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
            {activeData.monthlyBookings.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                <span className="text-2xl mb-2">📊</span>
                <p className="text-xs font-semibold text-zinc-500">No reports available.</p>
                <p className="text-[10px] italic text-zinc-600 mt-1">Data will populate after backend integration.</p>
              </div>
            ) : activeData.monthlyBookings.map(({ m, v }) => {
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
          {activeData.categoryRevenue.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-10 text-zinc-600">
              <span className="text-2xl mb-2">🍩</span>
              <p className="text-xs font-semibold text-zinc-500">No reports available.</p>
              <p className="text-[10px] italic text-zinc-600 mt-1">Revenue breakdown will appear after integration.</p>
            </div>
          ) : (
            <>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div
                  className="w-full h-full rounded-full transition-all duration-500 shadow-xl"
                  style={{ background: `conic-gradient(${pieGradient})` }}
                />
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
            </>
          )}
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
                {activeData.summary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-zinc-600">
                      <p className="text-xs font-semibold text-zinc-500">No reports available.</p>
                      <p className="text-[10px] italic mt-1">Timeline data will appear after backend integration.</p>
                    </td>
                  </tr>
                ) : activeData.summary.map(({ m, b, u, r }) => (
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
