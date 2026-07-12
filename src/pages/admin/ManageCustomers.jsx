import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

const initialCustomers = [];

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageCustomers = () => {
  const { showToast } = useOutletContext();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

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
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Blocked' ? 'Active' : 'Blocked';
        showToast(`Customer "${c.name}" is now ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'warning');
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    setShowBlockConfirm(null);
  };

  const deleteCustomer = (id) => {
    const cust = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    showToast(`Customer "${cust.name}" has been deleted.`, 'error');
    setShowDeleteConfirm(null);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? editingCustomer : c));
    showToast(`Profile information updated for ${editingCustomer.name}`, 'success');
    setEditingCustomer(null);
  };

  // Filter & Sort logic
  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        c.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
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
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Manage Customers <Sparkles className="text-blue-400 w-5 h-5" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Audit credentials, profile parameters, and total booking values of registered customers.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white/5 border border-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 placeholder-zinc-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-2 flex items-center gap-1.5"><Filter size={13} /> Filter:</span>
          {['All', 'Active', 'Inactive', 'Blocked'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                filter === f
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-[#0a0e1b]/40">
                <th onClick={() => handleSort('id')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">#</th>
                <th onClick={() => handleSort('name')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">Customer</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th onClick={() => handleSort('location')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden lg:table-cell select-none">Location</th>
                <th onClick={() => handleSort('bookings')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden sm:table-cell select-none">Bookings</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-zinc-500 py-16 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">👤</span>
                      <span className="font-semibold">No customers registered yet.</span>
                      <span className="text-zinc-600 italic text-[10px]">Customer accounts will appear here once registered.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">
                          {c.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{c.name}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden md:table-cell">{c.phone}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden lg:table-cell">{c.location}</td>
                    <td className="px-6 py-4 text-zinc-300 text-xs hidden sm:table-cell font-mono">{c.bookings}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedCustomer(c)} 
                          title="View Log Profile" 
                          className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setEditingCustomer(c)} 
                          title="Edit Information" 
                          className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => setShowBlockConfirm(c)}
                          title={c.status === 'Blocked' ? 'Unblock Customer' : 'Block Customer'}
                          className={`p-2 rounded-xl text-zinc-400 hover:bg-white/5 transition-all cursor-pointer ${
                            c.status === 'Blocked' ? 'hover:text-green-400' : 'hover:text-red-400'
                          }`}
                        >
                          <ShieldAlert size={14} />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(c.id)} 
                          title="Delete Member" 
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

        {/* Pagination bar */}
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

      {/* Customer Detail Drawer/Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-lg bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{selectedCustomer.name}</h3>
            <p className="text-zinc-500 text-xs mb-5">System Ledger Profile Profile ID: {selectedCustomer.id}</p>

            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                <p className="text-zinc-500">Contact Email: <span className="text-white font-semibold ml-1">{selectedCustomer.email}</span></p>
                <p className="text-zinc-500">Phone Details: <span className="text-white font-semibold ml-1">{selectedCustomer.phone}</span></p>
                <p className="text-zinc-500">Location Base: <span className="text-white font-semibold ml-1">{selectedCustomer.location}</span></p>
                <p className="text-zinc-500">Member Since: <span className="text-white font-semibold ml-1">{selectedCustomer.joined}</span></p>
                <p className="text-zinc-500">System Status: <span className={`ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(selectedCustomer.status)}`}>{selectedCustomer.status}</span></p>
              </div>

              <div>
                <h4 className="text-white font-bold text-xs mb-3 uppercase tracking-wider text-zinc-400">Recent Booking Records</h4>
                {selectedCustomer.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomer.history.map(hist => (
                      <div key={hist.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="text-white font-bold">{hist.service} • <span className="text-zinc-400 font-normal">{hist.provider}</span></p>
                          <p className="text-[10px] text-zinc-500 mt-1">{hist.date} • <span className="font-mono">{hist.id}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">{hist.amount}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] border ${
                            hist.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>{hist.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic py-2">No historical transaction logs found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-md bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setEditingCustomer(null)} className="p-2 rounded-xl text-zinc-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Edit Information</h3>
            <p className="text-zinc-500 text-xs mb-5">Modify account configurations for customer registry ID {editingCustomer.id}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Phone Number</label>
                <input 
                  type="text" 
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Location Area</label>
                <input 
                  type="text" 
                  value={editingCustomer.location}
                  onChange={(e) => setEditingCustomer({...editingCustomer, location: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" 
                  required 
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-transparent border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/10">Save Parameters</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Block customer */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">{showBlockConfirm.status === 'Blocked' ? 'Unblock Customer?' : 'Block Customer?'}</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Are you sure you want to {showBlockConfirm.status === 'Blocked' ? 'restore access for' : 'suspend authentication privileges for'} <span className="text-white font-bold">{showBlockConfirm.name}</span>? They will {showBlockConfirm.status === 'Blocked' ? 'regain immediate login' : 'be immediately logged out and barred from booking'}.
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
                {showBlockConfirm.status === 'Blocked' ? 'Confirm Restore' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation: Delete customer */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Delete Customer Registry?</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Caution: This action is permanent. Deleting this database profile removes all historical logs, linked details, and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button 
                onClick={() => deleteCustomer(showDeleteConfirm)} 
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

export default ManageCustomers;
