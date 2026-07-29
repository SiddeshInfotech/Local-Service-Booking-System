import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search, Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  X, ShieldAlert, Sparkles, Loader2, MapPin, Phone, Mail, Calendar,
  Clock, BookOpen, CheckCircle, XCircle, ShieldCheck, ShieldX, UserX, Star
} from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-[var(--color-zinc-700)]/30 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || 'bg-[var(--color-zinc-700)]/30 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]');

const StatCard = ({ label, value, color = 'text-[var(--color-text-primary)]' }) => (
  <div className="bg-white/[0.03] border border-[var(--color-border-subtle)] rounded-2xl p-3 text-center">
    <p className={`text-xl font-black ${color}`}>{value}</p>
    <p className="text-[var(--color-text-secondary)] text-[10px] mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
  </div>
);

const DrawerRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0">
    <span className="text-[var(--color-text-secondary)] text-xs shrink-0 mr-3">{label}</span>
    <span className="text-xs text-right font-semibold text-[var(--color-text-primary)]">{value || '—'}</span>
  </div>
);

const ManageCustomers = () => {
  const { showToast } = useOutletContext();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState('customer_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Side drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 5;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdmin('/api/admin/customers');
      const data = await res.json();
      if (res.ok && data.status) setCustomers(data.customers || []);
      else showToast(data.message || 'Failed to load customers.', 'error');
    } catch {
      showToast('Server error. Could not load customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openDrawer = useCallback(async (cust) => {
    setDrawerCustomer(cust);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/customer/${cust.customer_id}`);
      const data = await res.json();
      if (res.ok && data.status) setDrawerCustomer(data.customer);
      else showToast(data.message || 'Could not load customer details.', 'error');
    } catch {
      showToast('Server error loading customer details.', 'error');
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const closeDrawer = () => { setDrawerOpen(false); setDrawerCustomer(null); };

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
        if (drawerCustomer?.customer_id === id) setDrawerCustomer(d => ({ ...d, status: nextStatus }));
        showToast(`Customer "${cust.full_name}" is now ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'warning');
      } else showToast(data.message || 'Action failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); setShowBlockConfirm(null); }
  };

  const deleteCustomer = async (id) => {
    const cust = customers.find(c => c.customer_id === id);
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/customer/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.status) {
        setCustomers(prev => prev.filter(c => c.customer_id !== id));
        closeDrawer();
        showToast(`Customer "${cust?.full_name}" has been deleted.`, 'error');
      } else showToast(data.message || 'Delete failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); setShowDeleteConfirm(null); }
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
      } else showToast(data.message || 'Update failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); }
  };

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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            Manage Customers <Sparkles className="text-blue-400 w-5 h-5" />
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Audit credentials, profile parameters, and booking activity of registered customers.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500/50 focus:bg-[var(--color-overlay-hover)] placeholder-zinc-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider mr-2 flex items-center gap-1.5"><Filter size={13} /> Filter:</span>
          {['All', 'Active', 'Inactive', 'Blocked'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                filter === f ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)]'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)]">
                <th onClick={() => handleSort('customer_id')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider select-none">#</th>
                <th onClick={() => handleSort('full_name')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider select-none">Customer</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th onClick={() => handleSort('city')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hidden lg:table-cell select-none">City</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 size={28} className="mx-auto animate-spin text-blue-400" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-[var(--color-text-secondary)] py-16 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">👤</span>
                    <span className="font-semibold">No customers found.</span>
                    <span className="text-zinc-600 italic text-[10px]">Customer accounts will appear here once registered.</span>
                  </div>
                </td></tr>
              ) : (
                paginated.map((c) => (
                  <tr key={c.customer_id} className="border-b border-[var(--color-border-subtle)] hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-mono">{c.customer_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[var(--color-text-primary)] text-xs font-black shadow-md flex-shrink-0">
                          {(c.full_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[var(--color-text-primary)] text-xs font-bold">{c.full_name}</p>
                          <p className="text-[var(--color-text-secondary)] text-[10px] mt-0.5">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs hidden lg:table-cell">{c.city || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle(c.status)}`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDrawer(c)} title="View Profile" className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"><Eye size={14} /></button>
                        <button onClick={() => setEditingCustomer({ ...c })} title="Edit Information" className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"><Pencil size={14} /></button>
                        <button
                          onClick={() => setShowBlockConfirm(c)}
                          title={c.status === 'Blocked' ? 'Unblock Customer' : 'Block Customer'}
                          className={`p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-subtle)] transition-all cursor-pointer ${c.status === 'Blocked' ? 'hover:text-green-400' : 'hover:text-red-400'}`}
                        ><ShieldAlert size={14} /></button>
                        <button onClick={() => setShowDeleteConfirm(c.customer_id)} title="Delete Member" className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-text-secondary)] text-xs">Showing {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, sorted.length)} of {sorted.length} records</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft size={16} /></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === i+1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] border border-transparent'}`}>{i+1}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ─── SIDE DRAWER ─── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeDrawer} />
          <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[var(--color-card-bg)] border-l border-[var(--color-border-subtle)] shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)] backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[var(--color-text-primary)] font-black text-sm shadow-lg">
                  {(drawerCustomer?.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[var(--color-text-primary)] font-bold text-sm leading-tight">{drawerCustomer?.full_name || '…'}</h2>
                  <p className="text-[var(--color-text-secondary)] text-[10px] mt-0.5">Customer · ID #{drawerCustomer?.customer_id}</p>
                </div>
              </div>
              <button onClick={closeDrawer} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] transition-all cursor-pointer"><X size={18} /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {drawerLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={28} className="animate-spin text-blue-400" />
                  <p className="text-[var(--color-text-secondary)] text-xs">Loading customer details…</p>
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(drawerCustomer?.status)}`}>{drawerCustomer?.status}</span>
                    {drawerCustomer?.email_verified && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <ShieldCheck size={10} /> Email Verified
                      </span>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Total Bookings" value={drawerCustomer?.total_bookings ?? '—'} />
                    <StatCard label="Completed" value={drawerCustomer?.completed_bookings ?? '—'} color="text-green-400" />
                    <StatCard label="Active" value={drawerCustomer?.active_bookings ?? '—'} color="text-amber-400" />
                    <StatCard label="Cancelled" value={drawerCustomer?.cancelled_bookings ?? '—'} color="text-red-400" />
                  </div>

                  {/* Reviews given */}
                  {drawerCustomer?.reviews_given != null && (
                    <div className="flex items-center gap-2 p-3 bg-purple-500/5 border border-purple-500/15 rounded-2xl">
                      <Star size={14} className="text-purple-400" />
                      <span className="text-[var(--color-text-primary)] font-black text-base">{drawerCustomer.reviews_given}</span>
                      <span className="text-[var(--color-text-secondary)] text-xs">review{drawerCustomer.reviews_given !== 1 ? 's' : ''} submitted</span>
                    </div>
                  )}

                  {/* Contact & Profile */}
                  <div className="bg-white/[0.02] border border-[var(--color-border-subtle)] rounded-2xl p-4 space-y-0">
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Mail size={11} />Email</span>} value={drawerCustomer?.email} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Phone size={11} />Phone</span>} value={drawerCustomer?.phone} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />City</span>} value={drawerCustomer?.city} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />State</span>} value={drawerCustomer?.state} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />Pincode</span>} value={drawerCustomer?.pincode} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />Address</span>} value={drawerCustomer?.address} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><BookOpen size={11} />Gender</span>} value={drawerCustomer?.gender} />
                    <DrawerRow
                      label={<span className="flex items-center gap-1.5"><Calendar size={11} />Date of Birth</span>}
                      value={drawerCustomer?.date_of_birth ? new Date(drawerCustomer.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null}
                    />
                    <DrawerRow
                      label={<span className="flex items-center gap-1.5"><Calendar size={11} />Member Since</span>}
                      value={drawerCustomer?.created_at ? new Date(drawerCustomer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null}
                    />
                    <DrawerRow
                      label={<span className="flex items-center gap-1.5"><Clock size={11} />Last Login</span>}
                      value={drawerCustomer?.last_login ? new Date(drawerCustomer.last_login).toLocaleString('en-IN') : null}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action buttons footer */}
            {!drawerLoading && drawerCustomer && (
              <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)] shrink-0 space-y-3">
                {/* Block / Unblock */}
                <button
                  disabled={actionLoading}
                  onClick={() => setShowBlockConfirm(drawerCustomer)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border disabled:opacity-50 ${
                    drawerCustomer.status === 'Blocked'
                      ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30'
                      : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30'
                  }`}
                >
                  {drawerCustomer.status === 'Blocked' ? <ShieldCheck size={13} /> : <ShieldX size={13} />}
                  {drawerCustomer.status === 'Blocked' ? 'Unblock Customer' : 'Block Customer'}
                </button>

                {/* Delete */}
                <button
                  disabled={actionLoading}
                  onClick={() => setShowDeleteConfirm(drawerCustomer.customer_id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-red-600/10 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserX size={13} />
                  Delete Customer
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-md bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setEditingCustomer(null)} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"><X size={18} /></button>
            </div>
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">Edit Information</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mb-5">Modify account data for customer ID {editingCustomer.customer_id}</p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">Full Name</label>
                <input type="text" value={editingCustomer.full_name || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, full_name: e.target.value })} className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" required />
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">Phone Number</label>
                <input type="text" value={editingCustomer.phone || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" />
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">City</label>
                <input type="text" value={editingCustomer.city || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })} className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" />
              </div>
              <div>
                <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">Address</label>
                <input type="text" value={editingCustomer.address || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })} className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-[var(--color-text-primary)] font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/10 flex items-center gap-2">
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block/Unblock Confirm */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">{showBlockConfirm.status === 'Blocked' ? 'Unblock Customer?' : 'Block Customer?'}</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mt-2 leading-relaxed">
              Are you sure you want to {showBlockConfirm.status === 'Blocked' ? 'restore access for' : 'suspend'} <span className="text-[var(--color-text-primary)] font-bold">{showBlockConfirm.full_name}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBlockConfirm(null)} className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => toggleBlockStatus(showBlockConfirm.customer_id)}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg flex items-center gap-2 ${
                  showBlockConfirm.status === 'Blocked' ? 'bg-green-600 hover:bg-green-500 text-[var(--color-text-primary)] shadow-green-500/10' : 'bg-red-600 hover:bg-red-500 text-[var(--color-text-primary)] shadow-red-500/10'
                }`}
              >
                {actionLoading && <Loader2 size={12} className="animate-spin" />}
                {showBlockConfirm.status === 'Blocked' ? 'Confirm Restore' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">Delete Customer Registry?</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mt-2 leading-relaxed">
              Caution: This action is permanent. Deleting this profile removes all historical logs, linked bookings, and cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => deleteCustomer(showDeleteConfirm)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-[var(--color-text-primary)] font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/10 flex items-center gap-2"
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
