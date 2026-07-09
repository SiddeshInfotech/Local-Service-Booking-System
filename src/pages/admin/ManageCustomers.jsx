import React, { useState } from 'react';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const allCustomers = [
  { id: 1,  name: 'Priya Sharma',    email: 'priya@email.com',   phone: '+91 98765 43210', location: 'Mumbai',    bookings: 8,  status: 'Active',    joined: '12 Jan 2026' },
  { id: 2,  name: 'Arjun Mehta',     email: 'arjun@email.com',   phone: '+91 87654 32109', location: 'Delhi',     bookings: 3,  status: 'Active',    joined: '20 Feb 2026' },
  { id: 3,  name: 'Sneha Patel',     email: 'sneha@email.com',   phone: '+91 76543 21098', location: 'Ahmedabad', bookings: 12, status: 'Active',    joined: '05 Mar 2026' },
  { id: 4,  name: 'Vikram Reddy',    email: 'vikram@email.com',  phone: '+91 65432 10987', location: 'Hyderabad', bookings: 1,  status: 'Inactive',  joined: '18 Mar 2026' },
  { id: 5,  name: 'Anita Joshi',     email: 'anita@email.com',   phone: '+91 54321 09876', location: 'Pune',      bookings: 5,  status: 'Active',    joined: '02 Apr 2026' },
  { id: 6,  name: 'Rohan Kapoor',    email: 'rohan@email.com',   phone: '+91 43210 98765', location: 'Bangalore', bookings: 7,  status: 'Blocked',   joined: '15 Apr 2026' },
  { id: 7,  name: 'Meera Singh',     email: 'meera@email.com',   phone: '+91 32109 87654', location: 'Chennai',   bookings: 4,  status: 'Active',    joined: '28 Apr 2026' },
  { id: 8,  name: 'Kiran Nair',      email: 'kiran@email.com',   phone: '+91 21098 76543', location: 'Kochi',     bookings: 2,  status: 'Inactive',  joined: '10 May 2026' },
  { id: 9,  name: 'Deepak Kumar',    email: 'deepak@email.com',  phone: '+91 10987 65432', location: 'Kolkata',   bookings: 9,  status: 'Active',    joined: '22 May 2026' },
  { id: 10, name: 'Pooja Agarwal',   email: 'pooja@email.com',   phone: '+91 09876 54321', location: 'Jaipur',    bookings: 6,  status: 'Active',    joined: '03 Jun 2026' },
];

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageCustomers = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = allCustomers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Customers</h1>
        <p className="text-zinc-500 text-sm mt-1">View, search, and manage all registered customers.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-zinc-500 flex-shrink-0" />
          {['All', 'Active', 'Inactive', 'Blocked'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
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
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Location</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden sm:table-cell">Bookings</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden xl:table-cell">Joined</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-zinc-500 py-10 text-sm">No customers found.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-4 text-zinc-500 text-xs">{c.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">{c.name}</p>
                          <p className="text-zinc-500 text-[10px]">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden md:table-cell">{c.phone}</td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden lg:table-cell">{c.location}</td>
                    <td className="px-5 py-4 text-zinc-300 text-xs hidden sm:table-cell">{c.bookings}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden xl:table-cell">{c.joined}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button title="View" className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button title="Edit" className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button title="Delete" className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60">
          <p className="text-zinc-500 text-xs">Showing {filtered.length} of {allCustomers.length} customers</p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/20">1</span>
            <button className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCustomers;
