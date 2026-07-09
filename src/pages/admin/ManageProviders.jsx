import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Eye, Pencil, Trash2, Star, ChevronLeft, ChevronRight, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

const initialProviders = [
  { id: 1,  name: 'Raju Works',       email: 'raju@works.com',       category: 'Plumbing',     rating: 4.7, reviews: 128, location: 'Mumbai',    status: 'Active',   joined: '10 Jan 2026', details: { bio: 'Expert residential plumbing works with 8+ years experience.', ratingBreakdown: { 5: 98, 4: 20, 3: 8, 2: 2, 1: 0 }, sampleReviews: [{ reviewer: 'Amit K.', comment: 'Prompt service and fixed the leak quickly.', rating: 5 }, { reviewer: 'Sonia G.', comment: 'Good plumbing work, slightly expensive.', rating: 4 }] } },
  { id: 2,  name: 'PowerFix Co.',     email: 'pf@powerfix.com',      category: 'Electrician',  rating: 4.5, reviews: 89,  location: 'Delhi',     status: 'Active',   joined: '22 Jan 2026', details: { bio: 'Certified electrical contractors specializing in home wiring & appliances.', ratingBreakdown: { 5: 60, 4: 20, 3: 5, 2: 4, 1: 0 }, sampleReviews: [{ reviewer: 'Ramesh R.', comment: 'Found the short circuit in minutes.', rating: 5 }] } },
  { id: 3,  name: 'CleanPro India',   email: 'cp@cleanpro.com',      category: 'Cleaning',     rating: 4.8, reviews: 214, location: 'Bangalore', status: 'Active',   joined: '05 Feb 2026', details: { bio: 'Deep cleaning solutions for villas, apartments, and corporate offices.', ratingBreakdown: { 5: 180, 4: 24, 3: 6, 2: 4, 1: 0 }, sampleReviews: [{ reviewer: 'Pooja T.', comment: 'Superb cleaning! Highly recommend.', rating: 5 }] } },
  { id: 4,  name: 'WoodCraft Ltd',    email: 'wc@woodcraft.com',     category: 'Carpentry',    rating: 4.3, reviews: 56,  location: 'Chennai',   status: 'Inactive', joined: '18 Feb 2026', details: { bio: 'Custom woodwork, furniture design, repairs and installations.', ratingBreakdown: { 5: 30, 4: 15, 3: 8, 2: 3, 1: 0 }, sampleReviews: [] } },
  { id: 5,  name: 'PestAway',         email: 'pa@pestaway.com',      category: 'Pest Control', rating: 4.6, reviews: 73,  location: 'Hyderabad', status: 'Active',   joined: '01 Mar 2026', details: { bio: 'Eco-friendly pest eradication and preventive barrier treatments.', ratingBreakdown: { 5: 50, 4: 15, 3: 6, 2: 2, 1: 0 }, sampleReviews: [] } },
  { id: 6,  name: 'CoolAir Services', email: 'ca@coolair.com',       category: 'AC Repair',    rating: 4.2, reviews: 41,  location: 'Pune',      status: 'Blocked',  joined: '14 Mar 2026', details: { bio: 'Air conditioning repairs, refilling, gas checks and cooling optimizations.', ratingBreakdown: { 5: 20, 4: 15, 3: 3, 2: 2, 1: 1 }, sampleReviews: [] } },
  { id: 7,  name: 'BrightPaint Co.',  email: 'bp@brightpaint.com',   category: 'Painting',     rating: 4.9, reviews: 162, location: 'Kolkata',   status: 'Active',   joined: '28 Mar 2026', details: { bio: 'Wall painting, textures, waterproofing and premium color consultations.', ratingBreakdown: { 5: 145, 4: 12, 3: 5, 2: 0, 1: 0 }, sampleReviews: [] } },
  { id: 8,  name: 'SafeLock Pro',     email: 'sl@safelock.com',      category: 'Locksmith',    rating: 4.4, reviews: 38,  location: 'Jaipur',    status: 'Inactive', joined: '10 Apr 2026', details: { bio: '24/7 emergency lockouts, duplicates, smart lock installation.', ratingBreakdown: { 5: 22, 4: 10, 3: 4, 2: 2, 1: 0 }, sampleReviews: [] } },
];

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageProviders = () => {
  const { showToast } = useOutletContext();
  const [providers, setProviders] = useState(initialProviders);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All'); // 'All' | '4.5' | '4.8'
  const [sortField, setSortField] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const itemsPerPage = 5;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleBlockStatus = (id) => {
    setProviders(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Blocked' ? 'Active' : 'Blocked';
        showToast(`Provider "${p.name}" is now ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'warning');
        return { ...p, status: nextStatus };
      }
      return p;
    }));
    setShowBlockConfirm(null);
  };

  const deleteProvider = (id) => {
    const prov = providers.find(p => p.id === id);
    setProviders(prev => prev.filter(p => p.id !== id));
    showToast(`Provider "${prov.name}" deleted successfully.`, 'error');
    setShowDeleteConfirm(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setProviders(prev => prev.map(p => p.id === editingProvider.id ? editingProvider : p));
    showToast(`Profile changes saved for ${editingProvider.name}`, 'success');
    setEditingProvider(null);
  };

  // Filter & Sort
  const filtered = providers.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.category.toLowerCase().includes(search.toLowerCase()) ||
                        p.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
    
    let matchRating = true;
    if (ratingFilter === '4.5') matchRating = p.rating >= 4.5;
    if (ratingFilter === '4.8') matchRating = p.rating >= 4.8;

    return matchSearch && matchFilter && matchRating;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Manage Service Providers <Sparkles className="text-blue-400 w-5 h-5" />
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Regulate professional registrations, service category mappings, verification flags, and aggregate metrics.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, category, or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white/5 border border-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 placeholder-zinc-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Status filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5"><Filter size={12} /> Status:</span>
            {['All', 'Active', 'Inactive', 'Blocked'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  filter === f
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                    : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-1">Rating:</span>
            {['All', '4.5', '4.8'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setRatingFilter(f);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1 ${
                  ratingFilter === f
                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                    : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {f === 'All' ? 'All Ratings' : `${f}+`}
                <Star size={11} className={ratingFilter === f ? 'fill-purple-400 text-purple-400' : 'text-zinc-500'} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-[#0a0e1b]/40">
                <th onClick={() => handleSort('id')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">#</th>
                <th onClick={() => handleSort('name')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">Provider</th>
                <th onClick={() => handleSort('category')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden md:table-cell select-none">Category</th>
                <th onClick={() => handleSort('rating')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden lg:table-cell select-none">Rating</th>
                <th onClick={() => handleSort('location')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden xl:table-cell select-none">Location</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-zinc-500 py-12 text-xs italic">No providers match search filters.</td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{p.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">
                          {p.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{p.name}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 font-semibold text-xs">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-white font-bold">{p.rating}</span>
                        <span className="text-zinc-500 text-[10px]">({p.reviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden xl:table-cell">{p.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedProvider(p)} 
                          title="View Business Profile" 
                          className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setEditingProvider(p)} 
                          title="Edit Information" 
                          className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => setShowBlockConfirm(p)}
                          title={p.status === 'Blocked' ? 'Unblock Provider' : 'Block Provider'}
                          className={`p-2 rounded-xl text-zinc-400 hover:bg-white/5 transition-all cursor-pointer ${
                            p.status === 'Blocked' ? 'hover:text-green-400' : 'hover:text-red-400'
                          }`}
                        >
                          <ShieldAlert size={14} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(p.id)} 
                          title="Remove Provider" 
                          className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        >
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-zinc-500 text-xs">Showing {(currentPage-1)*itemsPerPage+1} - {Math.min(currentPage*itemsPerPage, sorted.length)} of {sorted.length} records</p>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i+1}
                  onClick={() => setCurrentPage(i+1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === i+1
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {i+1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Provider Details Overlay */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-lg bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSelectedProvider(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{selectedProvider.name}</h3>
            <p className="text-zinc-500 text-xs mb-5">Verified Partner Directory ID: {selectedProvider.id}</p>

            <div className="space-y-5">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                <p className="text-zinc-500 font-semibold uppercase text-[9px] tracking-wider">Bio details</p>
                <p className="text-zinc-300 mb-2 italic">"{selectedProvider.details.bio}"</p>
                <div className="border-t border-white/5 pt-2 space-y-1.5">
                  <p className="text-zinc-500">Service Area Category: <span className="text-white font-bold ml-1">{selectedProvider.category}</span></p>
                  <p className="text-zinc-500">Email Reference: <span className="text-white font-bold ml-1">{selectedProvider.email}</span></p>
                  <p className="text-zinc-500">Base Location: <span className="text-white font-bold ml-1">{selectedProvider.location}</span></p>
                  <p className="text-zinc-500">Registration Date: <span className="text-white font-bold ml-1">{selectedProvider.joined}</span></p>
                  <p className="text-zinc-500">Rating Index: <span className="text-white font-bold ml-1">{selectedProvider.rating} ★ ({selectedProvider.reviews} feedback records)</span></p>
                </div>
              </div>

              {/* Feedback Reviews List */}
              <div>
                <h4 className="text-white font-bold text-xs mb-3 uppercase tracking-wider text-zinc-400">Sample Customer Feedbacks</h4>
                {selectedProvider.details.sampleReviews.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProvider.details.sampleReviews.map((rev, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-white font-bold">{rev.reviewer}</p>
                          <div className="flex items-center gap-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-zinc-400 leading-relaxed italic">"{rev.comment}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic py-1">No verified customer reviews logged in this range.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-md bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setEditingProvider(null)} className="p-2 rounded-xl text-zinc-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Edit Provider Profile</h3>
            <p className="text-zinc-500 text-xs mb-5">Change parameters for database registration ID {editingProvider.id}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Business Name</label>
                <input 
                  type="text" 
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({...editingProvider, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Business Email</label>
                <input 
                  type="email" 
                  value={editingProvider.email}
                  onChange={(e) => setEditingProvider({...editingProvider, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Service Category</label>
                <input 
                  type="text" 
                  value={editingProvider.category}
                  onChange={(e) => setEditingProvider({...editingProvider, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Location Base</label>
                <input 
                  type="text" 
                  value={editingProvider.location}
                  onChange={(e) => setEditingProvider({...editingProvider, location: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingProvider(null)} className="px-4 py-2 bg-transparent border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/10">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Block provider */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">{showBlockConfirm.status === 'Blocked' ? 'Unblock Provider?' : 'Block Provider?'}</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Are you sure you want to {showBlockConfirm.status === 'Blocked' ? 'restore platform listing for' : 'suspend platform listing and operations for'} <span className="text-white font-bold">{showBlockConfirm.name}</span>? They will {showBlockConfirm.status === 'Blocked' ? 'regain immediate job offers' : 'be logged out immediately and hidden from search listing'}.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBlockConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button 
                onClick={() => toggleBlockStatus(showBlockConfirm.id)} 
                className={`px-5 py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg ${
                  showBlockConfirm.status === 'Blocked' 
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/10' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/10'
                }`}
              >
                {showBlockConfirm.status === 'Blocked' ? 'Confirm Unblock' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation: Delete provider */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Delete Provider Profile?</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Are you sure you want to permanently delete this provider profile? Deletion will remove all associated service histories, reviews, credentials and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button 
                onClick={() => deleteProvider(showDeleteConfirm)} 
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/10"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageProviders;
