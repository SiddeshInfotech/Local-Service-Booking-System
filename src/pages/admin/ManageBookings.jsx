import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, XCircle, ChevronDown } from 'lucide-react';

const allBookings = [
  { id: 'BK-1021', customer: 'Priya Sharma',  customerEmail: 'priya@email.com',  provider: 'Raju Works',       service: 'Pipe Leak Repair',   date: '09 Jul 2026', time: '10:00 AM', amount: 499,  status: 'Confirmed'  },
  { id: 'BK-1020', customer: 'Arjun Mehta',   customerEmail: 'arjun@email.com',  provider: 'PowerFix Co.',     service: 'Switchboard Repair',  date: '08 Jul 2026', time: '02:00 PM', amount: 299,  status: 'Pending'    },
  { id: 'BK-1019', customer: 'Sneha Patel',   customerEmail: 'sneha@email.com',  provider: 'CleanPro India',   service: 'Full Home Cleaning',  date: '07 Jul 2026', time: '09:00 AM', amount: 999,  status: 'Completed'  },
  { id: 'BK-1018', customer: 'Vikram Reddy',  customerEmail: 'vikram@email.com', provider: 'WoodCraft Ltd',    service: 'Furniture Assembly',  date: '06 Jul 2026', time: '11:30 AM', amount: 599,  status: 'Cancelled'  },
  { id: 'BK-1017', customer: 'Anita Joshi',   customerEmail: 'anita@email.com',  provider: 'PestAway',         service: 'Termite Treatment',   date: '05 Jul 2026', time: '03:00 PM', amount: 1299, status: 'Confirmed'  },
  { id: 'BK-1016', customer: 'Rohan Kapoor',  customerEmail: 'rohan@email.com',  provider: 'BrightPaint Co.', service: 'Interior Wall Paint', date: '04 Jul 2026', time: '08:00 AM', amount: 1499, status: 'Completed'  },
  { id: 'BK-1015', customer: 'Meera Singh',   customerEmail: 'meera@email.com',  provider: 'Raju Works',       service: 'Drain Unclogging',    date: '03 Jul 2026', time: '01:00 PM', amount: 399,  status: 'Completed'  },
  { id: 'BK-1014', customer: 'Deepak Kumar',  customerEmail: 'deepak@email.com', provider: 'CleanPro India',   service: 'Bathroom Deep Clean', date: '02 Jul 2026', time: '11:00 AM', amount: 499,  status: 'Pending'    },
];

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const statusStyle = (s) => ({
  Confirmed:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Pending:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Completed:  'bg-green-500/15 text-green-400 border-green-500/20',
  Cancelled:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageBookings = () => {
  const [bookings, setBookings] = useState(allBookings);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = bookings.filter((b) => {
    const matchSearch = b.customer.toLowerCase().includes(search.toLowerCase()) ||
                        b.id.toLowerCase().includes(search.toLowerCase()) ||
                        b.service.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || b.status === filter;
    return matchSearch && matchFilter;
  });

  const updateStatus = (id, newStatus) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
  };

  const cancelBooking = (id) => updateStatus(id, 'Cancelled');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Bookings</h1>
        <p className="text-zinc-500 text-sm mt-1">View, filter, update and cancel service bookings.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, customer or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-zinc-500 flex-shrink-0" />
          {['All', ...STATUS_OPTIONS].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex-shrink-0 ${
                filter === f
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-[#0B1220]/40">
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">ID</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Provider</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Service</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden xl:table-cell">Date</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-zinc-500 py-10">No bookings found.</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-4 text-zinc-400 text-xs font-mono">{b.id}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-white text-xs font-medium">{b.customer}</p>
                        <p className="text-zinc-500 text-[10px]">{b.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden md:table-cell">{b.provider}</td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden lg:table-cell">{b.service}</td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden xl:table-cell">
                      <div>{b.date}</div>
                      <div className="text-zinc-600">{b.time}</div>
                    </td>
                    <td className="px-5 py-4 text-white text-xs font-semibold">₹{b.amount}</td>
                    <td className="px-5 py-4">
                      <div className="relative group inline-block">
                        <select
                          value={b.status}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          className={`pl-2.5 pr-5 py-1 rounded-full text-[10px] font-semibold border appearance-none cursor-pointer bg-transparent ${statusStyle(b.status)}`}
                        >
                          {STATUS_OPTIONS.map((o) => <option key={o} value={o} className="bg-[#0B1220] text-white">{o}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button title="View" className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Eye size={14} />
                        </button>
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button onClick={() => cancelBooking(b.id)} title="Cancel" className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60">
          <p className="text-zinc-500 text-xs">Showing {filtered.length} of {bookings.length} bookings</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><ChevronLeft size={15} /></button>
            <span className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/20">1</span>
            <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBookings;
