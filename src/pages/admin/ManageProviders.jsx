import React, { useState } from 'react';
import { Search, Filter, Eye, Pencil, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const allProviders = [
  { id: 1,  name: 'Raju Works',       email: 'raju@works.com',       category: 'Plumbing',     rating: 4.7, reviews: 128, location: 'Mumbai',    status: 'Active',   joined: '10 Jan 2026' },
  { id: 2,  name: 'PowerFix Co.',     email: 'pf@powerfix.com',      category: 'Electrician',  rating: 4.5, reviews: 89,  location: 'Delhi',     status: 'Active',   joined: '22 Jan 2026' },
  { id: 3,  name: 'CleanPro India',   email: 'cp@cleanpro.com',      category: 'Cleaning',     rating: 4.8, reviews: 214, location: 'Bangalore', status: 'Active',   joined: '05 Feb 2026' },
  { id: 4,  name: 'WoodCraft Ltd',    email: 'wc@woodcraft.com',     category: 'Carpentry',    rating: 4.3, reviews: 56,  location: 'Chennai',   status: 'Inactive', joined: '18 Feb 2026' },
  { id: 5,  name: 'PestAway',         email: 'pa@pestaway.com',      category: 'Pest Control', rating: 4.6, reviews: 73,  location: 'Hyderabad', status: 'Active',   joined: '01 Mar 2026' },
  { id: 6,  name: 'CoolAir Services', email: 'ca@coolair.com',       category: 'AC Repair',    rating: 4.2, reviews: 41,  location: 'Pune',      status: 'Blocked',  joined: '14 Mar 2026' },
  { id: 7,  name: 'BrightPaint Co.',  email: 'bp@brightpaint.com',   category: 'Painting',     rating: 4.9, reviews: 162, location: 'Kolkata',   status: 'Active',   joined: '28 Mar 2026' },
  { id: 8,  name: 'SafeLock Pro',     email: 'sl@safelock.com',      category: 'Locksmith',    rating: 4.4, reviews: 38,  location: 'Jaipur',    status: 'Inactive', joined: '10 Apr 2026' },
];

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageProviders = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = allProviders.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Service Providers</h1>
        <p className="text-zinc-500 text-sm mt-1">View, search, and manage all registered service providers.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or category..."
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
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Provider</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Rating</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden xl:table-cell">Location</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-zinc-500 py-10 text-sm">No providers found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-4 text-zinc-500 text-xs">{p.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">{p.name}</p>
                          <p className="text-zinc-500 text-[10px]">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-white text-xs font-medium">{p.rating}</span>
                        <span className="text-zinc-500 text-[10px]">({p.reviews})</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden xl:table-cell">{p.location}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/60">
          <p className="text-zinc-500 text-xs">Showing {filtered.length} of {allProviders.length} providers</p>
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

export default ManageProviders;
