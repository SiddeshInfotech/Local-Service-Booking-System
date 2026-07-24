import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search, Filter, Eye, Pencil, Trash2, Star, ChevronLeft, ChevronRight,
  X, ShieldAlert, Sparkles, Loader2, CheckCircle, XCircle, Briefcase,
  MapPin, Phone, Mail, Calendar, Clock, Award, FileText, Wrench, ShieldCheck,
  ShieldX, UserX
} from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Approved: 'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-zinc-700/30 text-zinc-400 border-zinc-700',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
  Pending:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}[s] || 'bg-zinc-700/30 text-zinc-400 border-zinc-700');

const StatCard = ({ label, value, color = 'text-white' }) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 text-center">
    <p className={`text-xl font-black ${color}`}>{value}</p>
    <p className="text-zinc-500 text-[10px] mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
  </div>
);

const DrawerRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-zinc-500 text-xs shrink-0 mr-3">{label}</span>
    <span className={`text-xs text-right font-semibold text-white ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
  </div>
);

const ManageProviders = () => {
  const { showToast } = useOutletContext();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState('provider_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Side drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerProvider, setDrawerProvider] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [editingProvider, setEditingProvider] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 5;

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdmin('/api/admin/providers');
      const data = await res.json();
      if (res.ok && data.status) setProviders(data.providers || []);
      else showToast(data.message || 'Failed to load providers.', 'error');
    } catch {
      showToast('Server error. Could not load providers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProviders(); }, []);

  const openDrawer = useCallback(async (prov) => {
    setDrawerProvider(prov);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/provider/${prov.provider_id}`);
      const data = await res.json();
      if (res.ok && data.status) setDrawerProvider(data.provider);
      else showToast(data.message || 'Could not load provider details.', 'error');
    } catch {
      showToast('Server error loading provider details.', 'error');
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  const closeDrawer = () => { setDrawerOpen(false); setDrawerProvider(null); };

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  // Approve / Reject
  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/provider/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status) {
        setProviders(prev => prev.map(p => p.provider_id === id ? { ...p, status: 'Active' } : p));
        if (drawerProvider?.provider_id === id) setDrawerProvider(d => ({ ...d, status: 'Active' }));
        showToast('Provider approved successfully.', 'success');
      } else showToast(data.message || 'Approval failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/provider/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status) {
        setProviders(prev => prev.map(p => p.provider_id === id ? { ...p, status: 'Rejected' } : p));
        if (drawerProvider?.provider_id === id) setDrawerProvider(d => ({ ...d, status: 'Rejected' }));
        showToast('Provider rejected.', 'warning');
      } else showToast(data.message || 'Reject failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); }
  };

  const toggleBlockStatus = async (id) => {
    const prov = providers.find(p => p.provider_id === id);
    if (!prov) return;
    const isBlocked = prov.status === 'Blocked';
    const endpoint = isBlocked
      ? `/api/admin/provider/${id}/unblock`
      : `/api/admin/provider/${id}/block`;
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(endpoint, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.status) {
        const nextStatus = isBlocked ? 'Active' : 'Blocked';
        setProviders(prev => prev.map(p => p.provider_id === id ? { ...p, status: nextStatus } : p));
        if (drawerProvider?.provider_id === id) setDrawerProvider(d => ({ ...d, status: nextStatus }));
        showToast(`Provider is now ${nextStatus}`, nextStatus === 'Active' ? 'success' : 'warning');
      } else showToast(data.message || 'Action failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); setShowBlockConfirm(null); }
  };

  const deleteProvider = async (id) => {
    const prov = providers.find(p => p.provider_id === id);
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/provider/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.status) {
        setProviders(prev => prev.filter(p => p.provider_id !== id));
        closeDrawer();
        showToast(`Provider "${prov?.full_name}" deleted.`, 'error');
      } else showToast(data.message || 'Delete failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); setShowDeleteConfirm(null); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/provider/${editingProvider.provider_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editingProvider.full_name,
          phone: editingProvider.phone,
          city: editingProvider.city,
          address: editingProvider.address,
          experience_years: editingProvider.experience_years,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setProviders(prev => prev.map(p => p.provider_id === editingProvider.provider_id ? editingProvider : p));
        showToast(`Changes saved for ${editingProvider.full_name}`, 'success');
        setEditingProvider(null);
      } else showToast(data.message || 'Update failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(false); }
  };

  const filtered = providers.filter((p) => {
    const matchSearch =
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || p.status === filter;
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
            Manage Providers <Sparkles className="text-blue-400 w-5 h-5" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Review, manage, and audit all registered service providers on the platform.</p>
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
          {['All', 'Active', 'Pending', 'Blocked', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                filter === f ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'text-zinc-400 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[#0d1425]/40 border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-[#0a0e1b]/40">
                <th onClick={() => handleSort('provider_id')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">#</th>
                <th onClick={() => handleSort('full_name')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider select-none">Provider</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th onClick={() => handleSort('city')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden lg:table-cell select-none">City</th>
                <th onClick={() => handleSort('average_rating')} className="cursor-pointer hover:text-white px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden sm:table-cell select-none">Rating</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={28} className="mx-auto animate-spin text-blue-400" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-zinc-500 py-16 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🔧</span>
                    <span className="font-semibold">No providers found.</span>
                    <span className="text-zinc-600 italic text-[10px]">Provider accounts will appear here once registered.</span>
                  </div>
                </td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.provider_id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{p.provider_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">
                          {(p.full_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{p.full_name}</p>
                          <p className="text-zinc-500 text-[10px] mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden md:table-cell">{p.phone || '—'}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden lg:table-cell">{p.city || '—'}</td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {p.average_rating != null ? (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 text-xs font-bold">{Number(p.average_rating).toFixed(1)}</span>
                          <span className="text-zinc-600 text-[10px]">({p.total_reviews || 0})</span>
                        </div>
                      ) : <span className="text-zinc-600 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDrawer(p)} title="View Profile" className="p-2 rounded-xl text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"><Eye size={14} /></button>
                        <button onClick={() => setEditingProvider({ ...p })} title="Edit Information" className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"><Pencil size={14} /></button>
                        <button
                          onClick={() => setShowBlockConfirm(p)}
                          title={p.status === 'Blocked' ? 'Unblock Provider' : 'Block Provider'}
                          className={`p-2 rounded-xl text-zinc-400 hover:bg-white/5 transition-all cursor-pointer ${p.status === 'Blocked' ? 'hover:text-green-400' : 'hover:text-red-400'}`}
                        ><ShieldAlert size={14} /></button>
                        <button onClick={() => setShowDeleteConfirm(p.provider_id)} title="Delete Provider" className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
            <p className="text-zinc-500 text-xs">Showing {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, sorted.length)} of {sorted.length} records</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft size={16} /></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === i+1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>{i+1}</button>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ─── SIDE DRAWER ─── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={closeDrawer}
          />
          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#090d1c] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0a0f20]/80 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                  {(drawerProvider?.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-white font-bold text-sm leading-tight">{drawerProvider?.full_name || '…'}</h2>
                  <p className="text-zinc-500 text-[10px] mt-0.5">Provider · ID #{drawerProvider?.provider_id}</p>
                </div>
              </div>
              <button onClick={closeDrawer} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"><X size={18} /></button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {drawerLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={28} className="animate-spin text-blue-400" />
                  <p className="text-zinc-500 text-xs">Loading provider details…</p>
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle(drawerProvider?.status)}`}>{drawerProvider?.status}</span>
                    {drawerProvider?.email_verified && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Total Jobs" value={drawerProvider?.total_bookings ?? '—'} />
                    <StatCard label="Completed" value={drawerProvider?.completed_bookings ?? '—'} color="text-green-400" />
                    <StatCard label="Active Jobs" value={drawerProvider?.pending_jobs ?? '—'} color="text-amber-400" />
                  </div>

                  {/* Rating */}
                  {drawerProvider?.average_rating != null && (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      <span className="text-amber-400 font-black text-lg">{Number(drawerProvider.average_rating).toFixed(1)}</span>
                      <span className="text-zinc-500 text-xs">/ 5.0 · {drawerProvider.total_reviews || 0} review{drawerProvider.total_reviews !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Contact & Profile */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-0">
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Mail size={11} />Email</span>} value={drawerProvider?.email} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Phone size={11} />Phone</span>} value={drawerProvider?.phone} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />City</span>} value={drawerProvider?.city} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />State</span>} value={drawerProvider?.state} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><MapPin size={11} />Pincode</span>} value={drawerProvider?.pincode} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Award size={11} />Experience</span>} value={drawerProvider?.experience_years ? `${drawerProvider.experience_years} yrs` : null} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Calendar size={11} />Joined</span>} value={drawerProvider?.created_at ? new Date(drawerProvider.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
                    <DrawerRow label={<span className="flex items-center gap-1.5"><Clock size={11} />Last Login</span>} value={drawerProvider?.last_login ? new Date(drawerProvider.last_login).toLocaleString('en-IN') : null} />
                  </div>

                  {/* Description */}
                  {drawerProvider?.description && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase size={10} />About</p>
                      <p className="text-white text-xs leading-relaxed">{drawerProvider.description}</p>
                    </div>
                  )}

                  {/* Services Offered */}
                  {Array.isArray(drawerProvider?.services_offered) && drawerProvider.services_offered.length > 0 && (
                    <div>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wrench size={10} />Services Offered</p>
                      <div className="space-y-2">
                        {drawerProvider.services_offered.map((svc) => (
                          <div key={svc.provider_service_id} className="flex items-center justify-between bg-white/[0.025] border border-white/5 rounded-xl px-3 py-2.5">
                            <div>
                              <p className="text-white text-xs font-semibold">{svc.sub_service_name || svc.service_name}</p>
                              <p className="text-zinc-500 text-[10px]">{svc.service_name}</p>
                            </div>
                            <span className="text-green-400 font-black text-xs">₹{svc.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {Array.isArray(drawerProvider?.documents) && drawerProvider.documents.length > 0 && (
                    <div>
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={10} />Documents</p>
                      <div className="space-y-2">
                        {drawerProvider.documents.map((doc) => (
                          <div key={doc.document_id} className="flex items-center justify-between bg-white/[0.025] border border-white/5 rounded-xl px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <FileText size={12} className="text-zinc-500" />
                              <p className="text-white text-xs font-semibold capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                doc.verification_status === 'Approved'
                                  ? 'bg-green-500/15 text-green-400 border-green-500/20'
                                  : doc.verification_status === 'Rejected'
                                  ? 'bg-red-500/15 text-red-400 border-red-500/20'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                              }`}>{doc.verification_status}</span>
                              {doc.file_path && (
                                <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-blue-400 text-[10px] hover:underline">View</a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action buttons footer */}
            {!drawerLoading && drawerProvider && (
              <div className="px-6 py-4 border-t border-white/10 bg-[#0a0f20]/60 shrink-0 space-y-3">
                {/* Approve / Reject for Pending */}
                {drawerProvider.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleApprove(drawerProvider.provider_id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                      Approve
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleReject(drawerProvider.provider_id)}
                      className="flex items-center justify-center gap-2 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                      Reject
                    </button>
                  </div>
                )}

                {/* Re-approve for Rejected */}
                {drawerProvider.status === 'Rejected' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(drawerProvider.provider_id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={13} />}
                    Approve Provider
                  </button>
                )}

                {/* Block / Unblock for Active/Blocked */}
                {(drawerProvider.status === 'Active' || drawerProvider.status === 'Blocked') && (
                  <button
                    disabled={actionLoading}
                    onClick={() => setShowBlockConfirm(drawerProvider)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border disabled:opacity-50 ${
                      drawerProvider.status === 'Blocked'
                        ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30'
                        : 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30'
                    }`}
                  >
                    {drawerProvider.status === 'Blocked' ? <ShieldCheck size={13} /> : <ShieldX size={13} />}
                    {drawerProvider.status === 'Blocked' ? 'Unblock Provider' : 'Block Provider'}
                  </button>
                )}

                {/* Delete */}
                <button
                  disabled={actionLoading}
                  onClick={() => setShowDeleteConfirm(drawerProvider.provider_id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent hover:bg-red-600/10 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserX size={13} />
                  Delete Provider
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Provider Dialog */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-md bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setEditingProvider(null)} className="p-2 rounded-xl text-zinc-400 hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Edit Provider</h3>
            <p className="text-zinc-500 text-xs mb-5">Provider ID {editingProvider.provider_id}</p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {[
                { label: 'Full Name', key: 'full_name', type: 'text' },
                { label: 'Phone Number', key: 'phone', type: 'text' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Experience (years)', key: 'experience_years', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-zinc-500 text-xs font-bold mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={editingProvider[key] || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, [key]: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                  />
                </div>
              ))}
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingProvider(null)} className="px-4 py-2 bg-transparent border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/10 flex items-center gap-2">
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block/Unblock Confirm */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">{showBlockConfirm.status === 'Blocked' ? 'Unblock Provider?' : 'Block Provider?'}</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Are you sure you want to {showBlockConfirm.status === 'Blocked' ? 'restore access for' : 'block'} <span className="text-white font-bold">{showBlockConfirm.full_name}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBlockConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => toggleBlockStatus(showBlockConfirm.provider_id)}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg flex items-center gap-2 ${showBlockConfirm.status === 'Blocked' ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/10' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/10'}`}
              >
                {actionLoading && <Loader2 size={12} className="animate-spin" />}
                {showBlockConfirm.status === 'Blocked' ? 'Confirm Restore' : 'Confirm Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Delete Provider?</h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">This action is permanent and cannot be undone. All data linked to this provider will be removed.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => deleteProvider(showDeleteConfirm)}
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

export default ManageProviders;
