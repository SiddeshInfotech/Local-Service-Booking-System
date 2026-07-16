import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageCustomers = () => {
  const { showToast } = useOutletContext();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState('customer_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 5;

  // Fetch customers from backend
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdmin('/api/admin/customers');
      const data = await res.json();
      if (res.ok && data.status) {
        setCustomers(data.customers || []);
      } else {
        showToast(data.message || 'Failed to load customers.', 'error');
      }
    } catch {
      showToast('Server error. Could not load customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const toggleBlockStatus = async (id) => {
    const cust = customers.find(c => c.customer_id === id);
    if (!cust) return;
    const isBlocked = cust.status === 'Blocked';
    const endpoint = isBlocked
      ? `/api/admin/customer/${id}/unblock`
      : `/api/admin/customer/${id}/suspend`;
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(endpoint, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status) {
        const nextStatus = isBlocked ? 'Active' : 'Blocked';
        setCustomers(prev => prev.map(c => c.customer_id === id ? { ...c, status: nextStatus } : c));
        showToast(`Customer "${cust.full_name}" is now ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'warning');
      } else {
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    } finally {
      setActionLoading(false);
      setShowBlockConfirm(null);
    }
  };

  const deleteCustomer = async (id) => {
    const cust = customers.find(c => c.customer_id === id);
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/customer/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.status) {
        setCustomers(prev => prev.filter(c => c.customer_id !== id));
        showToast(`Customer "${cust?.full_name}" has been deleted.`, 'error');
      } else {
        showToast(data.message || 'Delete failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/customer/${editingCustomer.customer_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editingCustomer.full_name,
          phone: editingCustomer.phone,
          city: editingCustomer.city,
          address: editingCustomer.address,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setCustomers(prev => prev.map(c => c.customer_id === editingCustomer.customer_id ? editingCustomer : c));
        showToast(`Profile updated for ${editingCustomer.full_name}`, 'success');
        setEditingCustomer(null);
      } else {
        showToast(data.message || 'Update failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort
  const filtered = customers.filter((c) => {
    const matchSearch =
      (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';
    if (typeof valA === 'string') return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortAsc ? valA - valB : valB - valA;
  });

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
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white/5 border border-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 placeholder-zinc-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-2 flex items-center gap-1.5"><Filter size={13} /> Filter:</span>
          {['All', 'Active', 'Inactive', 'Blocked'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
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
                <th onClick={() => handleSort('customer_id')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">#</th>
                <th onClick={() => handleSort('full_name')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">Customer</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th onClick={() => handleSort('city')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden lg:table-cell select-none">City</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Loader2 size={28} className="mx-auto animate-spin text-blue-400" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-zinc-500 py-16 text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">👤</span>
                      <span className="font-semibold">No customers found.</span>
                      <span className="text-zinc-600 italic text-[10px]">Customer accounts will appear here once registered.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.customer_id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{c.customer_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">
                          {(c.full_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{c.full_name}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden lg:table-cell">{c.city || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          title="View Profile"
                          className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setEditingCustomer({ ...c })}
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
                          onClick={() => setShowDeleteConfirm(c.customer_id)}
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
            <p className="text-zinc-500 text-xs">Showing {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, sorted.length)} of {sorted.length} records</p>
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-lg bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{selectedCustomer.full_name}</h3>
            <p className="text-zinc-500 text-xs mb-5">System Profile · ID: {selectedCustomer.customer_id}</p>

            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                <p className="text-zinc-500">Email: <span className="text-white font-semibold ml-1">{selectedCustomer.email}</span></p>
                <p className="text-zinc-500">Phone: <span className="text-white font-semibold ml-1">{selectedCustomer.phone || '—'}</span></p>
                <p className="text-zinc-500">City: <span className="text-white font-semibold ml-1">{selectedCustomer.city || '—'}</span></p>
                <p className="text-zinc-500">State: <span className="text-white font-semibold ml-1">{selectedCustomer.state || '—'}</span></p>
                <p className="text-zinc-500">Address: <span className="text-white font-semibold ml-1">{selectedCustomer.address || '—'}</span></p>
                <p className="text-zinc-500">Member Since: <span className="text-white font-semibold ml-1">{selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString() : '—'}</span></p>
                <p className="text-zinc-500">Last Login: <span className="text-white font-semibold ml-1">{selectedCustomer.last_login ? new Date(selectedCustomer.last_login).toLocaleString() : '—'}</span></p>
                <p className="text-zinc-500">Email Verified: <span className="text-white font-semibold ml-1">{selectedCustomer.email_verified ? 'Yes' : 'No'}</span></p>
                <p className="text-zinc-500">Status: <span className={`ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(selectedCustomer.status)}`}>{selectedCustomer.status}</span></p>
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
            <p className="text-zinc-500 text-xs mb-5">Modify account configurations for customer ID {editingCustomer.customer_id}</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editingCustomer.full_name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={editingCustomer.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">City</label>
                <input
                  type="text"
                  value={editingCustomer.city || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-xs font-bold mb-1.5">Address</label>
                <input
                  type="text"
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-transparent border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/10 flex items-center gap-2">
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Save Parameters
                </button>
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
              Are you sure you want to {showBlockConfirm.status === 'Blocked' ? 'restore access for' : 'suspend'} <span className="text-white font-bold">{showBlockConfirm.full_name}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBlockConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => toggleBlockStatus(showBlockConfirm.customer_id)}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg flex items-center gap-2 ${
                  showBlockConfirm.status === 'Blocked'
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/10'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/10'
                }`}
              >
                {actionLoading && <Loader2 size={12} className="animate-spin" />}
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
                disabled={actionLoading}
                onClick={() => deleteCustomer(showDeleteConfirm)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/10 flex items-center gap-2"
              >
                {actionLoading && <Loader2 size={12} className="animate-spin" />}
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
