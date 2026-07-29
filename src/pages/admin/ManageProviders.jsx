import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search, Filter, Eye, Pencil, Trash2, Star, ChevronLeft, ChevronRight,
  X, ShieldAlert, Sparkles, Loader2, CheckCircle, XCircle, Briefcase,
  MapPin, Phone, Mail, Calendar, Clock, Award, FileText, Wrench, ShieldCheck,
  ShieldX, UserX, TrendingUp, DollarSign
} from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const statusStyle = (s) => ({
  Active:   'bg-green-500/15 text-green-400 border-green-500/20',
  Approved: 'bg-green-500/15 text-green-400 border-green-500/20',
  Inactive: 'bg-[var(--color-zinc-700)]/30 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]',
  Blocked:  'bg-red-500/15 text-red-400 border-red-500/20',
  Pending:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Rejected: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}[s] || 'bg-[var(--color-zinc-700)]/30 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]');

const StatCard = ({ label, value, color = 'text-[var(--color-text-primary)]' }) => (
  <div className="bg-white/[0.03] border border-[var(--color-border-subtle)] rounded-2xl p-3 text-center">
    <p className={`text-xl font-black ${color}`}>{value}</p>
    <p className="text-[var(--color-text-secondary)] text-[10px] mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
  </div>
);

const DrawerRow = ({ label, value, mono = false }) => (
  <div className="flex items-start justify-between py-2 border-b border-[var(--color-border-subtle)] last:border-0">
    <span className="text-[var(--color-text-secondary)] text-xs shrink-0 mr-3">{label}</span>
    <span className={`text-xs text-right font-semibold text-[var(--color-text-primary)] ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
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
  const [previewImage, setPreviewImage] = useState(null);

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
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            Manage Providers <Sparkles className="text-blue-400 w-5 h-5" />
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Review, manage, and audit all registered service providers on the platform.</p>
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
          {['All', 'Active', 'Pending', 'Blocked', 'Rejected'].map((f) => (
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
                <th onClick={() => handleSort('provider_id')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider select-none">#</th>
                <th onClick={() => handleSort('full_name')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider select-none">Provider</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th onClick={() => handleSort('city')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hidden lg:table-cell select-none">City</th>
                <th onClick={() => handleSort('average_rating')} className="cursor-pointer hover:text-[var(--color-text-primary)] px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hidden sm:table-cell select-none">Rating</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={28} className="mx-auto animate-spin text-blue-400" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-[var(--color-text-secondary)] py-16 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🔧</span>
                    <span className="font-semibold">No providers found.</span>
                    <span className="text-zinc-600 italic text-[10px]">Provider accounts will appear here once registered.</span>
                  </div>
                </td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.provider_id} onClick={() => openDrawer(p)} className="border-b border-[var(--color-border-subtle)] hover:bg-white/[0.05] transition-colors duration-300 cursor-pointer">
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-mono">{p.provider_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-[var(--color-text-primary)] text-xs font-black shadow-md flex-shrink-0 overflow-hidden">
                          {p.profile_image_url || p.profile_image ? (
                            <img src={p.profile_image_url || p.profile_image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            (p.full_name || '?')[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-[var(--color-text-primary)] text-xs font-bold">{p.full_name}</p>
                          <p className="text-[var(--color-text-secondary)] text-[10px] mt-0.5">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs hidden md:table-cell">{p.phone || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs hidden lg:table-cell">{p.city || '—'}</td>
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
                        <button onClick={(e) => { e.stopPropagation(); openDrawer(p); }} title="View Profile" className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"><Eye size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingProvider({ ...p }); }} title="Edit Information" className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"><Pencil size={14} /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowBlockConfirm(p); }}
                          title={p.status === 'Blocked' ? 'Unblock Provider' : 'Block Provider'}
                          className={`p-2 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-overlay-subtle)] transition-all cursor-pointer ${p.status === 'Blocked' ? 'hover:text-green-400' : 'hover:text-red-400'}`}
                        ><ShieldAlert size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(p.provider_id); }} title="Delete Provider" className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"><Trash2 size={14} /></button>
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

      {/* ─── PROVIDER DETAILS MODAL ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl animate-fade-in">
          {/* Modal Panel */}
          <div className="relative w-full max-w-5xl max-h-[95vh] bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-scale-in">
            {/* Header / Cover */}
            <div className="relative h-40 md:h-56 bg-gradient-to-br from-amber-500/20 via-zinc-900/40 to-[var(--color-bg-secondary)] shrink-0 border-b border-[var(--color-border-subtle)]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
              <button onClick={closeDrawer} className="absolute top-6 right-6 p-2.5 rounded-full bg-[var(--color-overlay-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-all z-10 backdrop-blur-md cursor-pointer border border-[var(--color-border-subtle)]"><X size={20} /></button>
            </div>
            
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar relative">
              {drawerLoading ? (
                <div className="px-6 md:px-10 -mt-16 md:-mt-24 relative z-10 animate-pulse">
                  {/* Skeleton Header */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end mb-10">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] border-4 border-[var(--color-bg-primary)] bg-[var(--color-border-subtle)] shrink-0 shadow-xl"></div>
                    <div className="flex-1 w-full space-y-4 md:mb-5">
                      <div className="h-10 bg-[var(--color-border-subtle)] rounded-xl w-3/4 max-w-md mx-auto md:mx-0"></div>
                      <div className="h-5 bg-[var(--color-border-subtle)] rounded-md w-1/3 max-w-xs mx-auto md:mx-0"></div>
                      <div className="flex gap-3 pt-2 justify-center md:justify-start">
                        <div className="h-8 bg-[var(--color-border-subtle)] rounded-full w-24"></div>
                        <div className="h-8 bg-[var(--color-border-subtle)] rounded-full w-24"></div>
                      </div>
                    </div>
                  </div>
                  {/* Skeleton Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                    <div className="xl:col-span-1 space-y-6 md:space-y-8">
                      <div className="h-64 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7">
                        <div className="h-4 bg-[var(--color-border-subtle)] rounded w-1/2 mb-6"></div>
                        <div className="space-y-4">
                          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-[var(--color-border-subtle)] rounded-xl"></div>)}
                        </div>
                      </div>
                      <div className="h-48 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7">
                        <div className="h-4 bg-[var(--color-border-subtle)] rounded w-1/2 mb-6"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="h-16 bg-[var(--color-border-subtle)] rounded-xl"></div>
                          <div className="h-16 bg-[var(--color-border-subtle)] rounded-xl"></div>
                        </div>
                      </div>
                    </div>
                    <div className="xl:col-span-2 space-y-6 md:space-y-8">
                      <div className="h-96 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7">
                        <div className="h-4 bg-[var(--color-border-subtle)] rounded w-1/3 mb-6"></div>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                           <div className="h-24 bg-[var(--color-border-subtle)] rounded-2xl"></div>
                           <div className="h-24 bg-[var(--color-border-subtle)] rounded-2xl"></div>
                        </div>
                        <div className="h-32 bg-[var(--color-border-subtle)] rounded-2xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : drawerProvider && (
                <div className="px-6 md:px-10 -mt-16 md:-mt-24 relative z-10">
                  {/* Profile Header */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-end mb-10">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] border-4 border-[var(--color-bg-primary)] bg-[var(--color-bg-secondary)] shadow-2xl overflow-hidden shrink-0 flex items-center justify-center text-5xl font-black text-[var(--color-text-secondary)] cursor-pointer hover:scale-[1.02] hover:shadow-amber-500/10 transition-all duration-300 ring-1 ring-[var(--color-border-subtle)]" onClick={() => (drawerProvider.profile_image_url || drawerProvider.profile_image) && setPreviewImage(drawerProvider.profile_image_url || drawerProvider.profile_image)}>
                      {drawerProvider.profile_image_url || drawerProvider.profile_image ? (
                        <img src={drawerProvider.profile_image_url || drawerProvider.profile_image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center text-white">
                          {(drawerProvider.full_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left mb-2 md:mb-5">
                      <div className="flex flex-col md:flex-row items-center md:items-center gap-4 mb-3">
                        <h2 className="text-3xl md:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">{drawerProvider.full_name}</h2>
                        {drawerProvider.email_verified && (
                          <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 uppercase tracking-widest shadow-sm">
                            <ShieldCheck size={14} /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--color-text-secondary)] font-mono text-sm font-semibold mb-5 tracking-wide uppercase flex items-center justify-center md:justify-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span> ID: {drawerProvider.provider_id}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${statusStyle(drawerProvider.status)}`}>{drawerProvider.status}</span>
                        {drawerProvider.average_rating != null && (
                          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 shadow-sm">
                            <Star size={14} className="fill-amber-500 text-amber-500" /> {Number(drawerProvider.average_rating).toFixed(1)} <span className="opacity-70">({drawerProvider.total_reviews} Reviews)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid Content */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                    {/* Left Column (Personal Info) */}
                    <div className="xl:col-span-1 space-y-6 md:space-y-8">
                      {/* Personal Information */}
                      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7 shadow-sm hover:border-[var(--color-text-secondary)]/20 transition-colors">
                        <h3 className="text-xs font-black text-[var(--color-text-primary)] mb-6 flex items-center gap-2 uppercase tracking-widest"><UserX size={16} className="text-amber-500" /> Personal Details</h3>
                        <div className="space-y-4">
                          <DrawerRow label={<span className="flex items-center gap-2"><Mail size={16} className="text-[var(--color-text-secondary)]" />Email</span>} value={drawerProvider.email} />
                          <DrawerRow label={<span className="flex items-center gap-2"><Phone size={16} className="text-[var(--color-text-secondary)]" />Phone</span>} value={drawerProvider.phone} />
                          <DrawerRow label={<span className="flex items-center gap-2"><MapPin size={16} className="text-[var(--color-text-secondary)]" />Location</span>} value={[drawerProvider.city, drawerProvider.state, drawerProvider.pincode].filter(Boolean).join(', ')} />
                          <DrawerRow label={<span className="flex items-center gap-2"><Calendar size={16} className="text-[var(--color-text-secondary)]" />Registered</span>} value={drawerProvider.created_at ? new Date(drawerProvider.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />
                        </div>
                      </div>

                      {/* Stats Overview */}
                      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7 shadow-sm hover:border-[var(--color-text-secondary)]/20 transition-colors">
                        <h3 className="text-xs font-black text-[var(--color-text-primary)] mb-6 flex items-center gap-2 uppercase tracking-widest"><TrendingUp size={16} className="text-amber-500" /> Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <StatCard label="Total Jobs" value={drawerProvider.total_bookings ?? '0'} />
                          <StatCard label="Completed" value={drawerProvider.completed_bookings ?? '0'} color="text-green-600 dark:text-green-400" />
                          <div className="col-span-2">
                            <StatCard label="Active Jobs" value={drawerProvider.pending_jobs ?? '0'} color="text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Professional & Docs) */}
                    <div className="xl:col-span-2 space-y-6 md:space-y-8">
                      {/* Professional Information */}
                      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7 md:p-9 shadow-sm hover:border-[var(--color-text-secondary)]/20 transition-colors">
                        <h3 className="text-xs font-black text-[var(--color-text-primary)] mb-8 flex items-center gap-2 uppercase tracking-widest"><Briefcase size={16} className="text-amber-500" /> Professional Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="bg-[var(--color-bg-primary)] rounded-2xl p-5 border border-[var(--color-border-subtle)]">
                            <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2"><Award size={16} className="text-amber-500" /> Experience</span>
                            <p className="text-2xl font-black text-[var(--color-text-primary)]">{drawerProvider.experience_years ? `${drawerProvider.experience_years} Years` : 'Not specified'}</p>
                          </div>
                          
                          {/* Selected Services Badges */}
                          <div className="bg-[var(--color-bg-primary)] rounded-2xl p-5 border border-[var(--color-border-subtle)]">
                            <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3"><Wrench size={16} className="text-amber-500" /> Service Category</span>
                            <div className="flex flex-wrap gap-2">
                               {Array.isArray(drawerProvider.services_offered) && drawerProvider.services_offered.length > 0 ? (
                                  drawerProvider.services_offered.map((svc) => (
                                    <span key={svc.provider_service_id} className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm">
                                      {svc.sub_service_name || svc.service_name}
                                    </span>
                                  ))
                               ) : (
                                 <span className="text-xs italic text-[var(--color-text-secondary)] font-medium">None selected</span>
                               )}
                            </div>
                          </div>
                        </div>

                        {drawerProvider.description ? (
                          <div className="mt-8">
                            <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3"><FileText size={16} className="text-amber-500" /> Service Description</span>
                            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed bg-[var(--color-bg-primary)] p-5 rounded-2xl border border-[var(--color-border-subtle)] shadow-inner">"{drawerProvider.description}"</p>
                          </div>
                        ) : (
                           <div className="mt-8 text-center bg-[var(--color-bg-primary)] p-5 rounded-2xl border border-[var(--color-border-subtle)] border-dashed">
                              <p className="text-[var(--color-text-secondary)] text-sm italic">No service description provided.</p>
                           </div>
                        )}
                        
                        {/* Detailed Services Pricing */}
                        {Array.isArray(drawerProvider.services_offered) && drawerProvider.services_offered.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-[var(--color-border-subtle)]">
                             <span className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4"><DollarSign size={16} className="text-amber-500" /> Pricing Setup</span>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {drawerProvider.services_offered.map((svc) => (
                                  <div key={`price-${svc.provider_service_id}`} className="flex items-center justify-between bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-xl px-5 py-4 hover:border-amber-500/30 transition-colors">
                                    <p className="text-[var(--color-text-primary)] text-sm font-bold truncate pr-3">{svc.sub_service_name || svc.service_name}</p>
                                    <span className="text-green-700 dark:text-green-400 font-black text-sm bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20 shrink-0">₹{svc.price}</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>

                      {/* Documents / ID Proof */}
                      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-3xl p-7 md:p-9 shadow-sm hover:border-[var(--color-text-secondary)]/20 transition-colors">
                        <h3 className="text-xs font-black text-[var(--color-text-primary)] mb-8 flex items-center gap-2 uppercase tracking-widest"><ShieldCheck size={16} className="text-amber-500" /> Documents & Verification</h3>
                        {Array.isArray(drawerProvider.documents) && drawerProvider.documents.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {drawerProvider.documents.map((doc) => (
                              <div key={doc.document_id} className="flex flex-col bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-2xl p-5 transition-all hover:shadow-md group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-overlay-subtle)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-start gap-4 mb-5 relative z-10">
                                  <div className="p-3.5 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0 shadow-sm border border-blue-500/20">
                                    <FileText size={22} />
                                  </div>
                                  <div className="flex-1 overflow-hidden pt-1">
                                    <p className="text-[var(--color-text-primary)] text-sm font-bold capitalize truncate">{doc.document_type?.replace(/_/g, ' ')}</p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full shadow-sm ${doc.verification_status === 'Approved' ? 'bg-green-500' : doc.verification_status === 'Rejected' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                      <p className={`text-[10px] font-black uppercase tracking-widest ${
                                        doc.verification_status === 'Approved' ? 'text-green-700 dark:text-green-400' : doc.verification_status === 'Rejected' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
                                      }`}>{doc.verification_status || 'Pending'}</p>
                                    </div>
                                  </div>
                                </div>
                                {doc.file_path && (
                                  <div className="flex items-center gap-3 mt-auto pt-5 border-t border-[var(--color-border-subtle)] relative z-10">
                                    <button 
                                      onClick={() => {
                                        if (doc.file_path.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || doc.file_path.includes('cloudinary') || doc.file_path.startsWith('http')) {
                                          setPreviewImage(doc.file_path);
                                        } else {
                                          window.open(doc.file_path, '_blank');
                                        }
                                      }} 
                                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-blue-500/20 shadow-sm"
                                    >
                                      <Eye size={16} /> Preview
                                    </button>
                                    <a 
                                      href={doc.file_path} 
                                      download 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="flex items-center justify-center p-2.5 bg-[var(--color-overlay-subtle)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-border-subtle)] transition-all cursor-pointer border border-[var(--color-border-subtle)] shadow-sm"
                                      title="Download"
                                    >
                                      <span className="sr-only">Download</span>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-[var(--color-bg-primary)] rounded-2xl p-8 text-center border-2 border-[var(--color-border-subtle)] border-dashed flex flex-col items-center justify-center">
                             <div className="w-16 h-16 rounded-full bg-[var(--color-overlay-subtle)] flex items-center justify-center mb-4">
                               <ShieldAlert size={28} className="text-[var(--color-text-secondary)] opacity-50" />
                             </div>
                             <p className="text-[var(--color-text-primary)] text-sm font-bold">No documents uploaded.</p>
                             <p className="text-[var(--color-text-secondary)] text-xs mt-1 max-w-[250px] mx-auto leading-relaxed">This provider has not provided any verification IDs or documents yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer within details view */}
                  <div className="mt-10 pt-6 border-t border-[var(--color-border-subtle)] flex flex-wrap gap-4 justify-end items-center sticky bottom-0 z-20 pb-2 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)] to-transparent">
                    {drawerProvider.status === 'Pending' && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleReject(drawerProvider.provider_id)}
                          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 min-w-[140px]"
                        >
                          {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                          Reject
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleApprove(drawerProvider.provider_id)}
                          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-400 border border-green-500/30 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 min-w-[140px] shadow-lg shadow-green-500/10"
                        >
                          {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                          Approve
                        </button>
                      </>
                    )}
                    {drawerProvider.status === 'Rejected' && (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprove(drawerProvider.provider_id)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500/20 hover:bg-green-500/30 text-green-700 dark:text-green-400 border border-green-500/30 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 min-w-[160px]"
                      >
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        Approve Provider
                      </button>
                    )}
                    {(drawerProvider.status === 'Active' || drawerProvider.status === 'Blocked') && (
                      <button
                        disabled={actionLoading}
                        onClick={() => setShowBlockConfirm(drawerProvider)}
                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer border disabled:opacity-50 min-w-[160px] ${
                          drawerProvider.status === 'Blocked'
                            ? 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-500 border-amber-500/30'
                        }`}
                      >
                        {drawerProvider.status === 'Blocked' ? <ShieldCheck size={18} /> : <ShieldX size={18} />}
                        {drawerProvider.status === 'Blocked' ? 'Unblock Provider' : 'Suspend Provider'}
                      </button>
                    )}
                    <button
                      disabled={actionLoading}
                      onClick={() => setShowDeleteConfirm(drawerProvider.provider_id)}
                      className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--color-bg-secondary)] hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-500 border border-[var(--color-border-subtle)] hover:border-red-500/30 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 ml-auto md:ml-4"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Delete Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Size Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center pointer-events-none">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl pointer-events-auto" />
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 md:-top-4 md:-right-12 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md pointer-events-auto transition-all cursor-pointer">
              <X size={24} />
            </button>
          </div>
        </div>
      )}
      {/* Edit Provider Dialog */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-md bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setEditingProvider(null)} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"><X size={18} /></button>
            </div>
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">Edit Provider</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mb-5">Provider ID {editingProvider.provider_id}</p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {[
                { label: 'Full Name', key: 'full_name', type: 'text' },
                { label: 'Phone Number', key: 'phone', type: 'text' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Experience (years)', key: 'experience_years', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={editingProvider[key] || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, [key]: e.target.value })}
                    className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                  />
                </div>
              ))}
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingProvider(null)} className="px-4 py-2 bg-transparent border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-[var(--color-text-primary)] font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-blue-500/10 flex items-center gap-2">
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
          <div className="relative w-full max-w-sm bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">{showBlockConfirm.status === 'Blocked' ? 'Unblock Provider?' : 'Block Provider?'}</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mt-2 leading-relaxed">
              Are you sure you want to {showBlockConfirm.status === 'Blocked' ? 'restore access for' : 'block'} <span className="text-[var(--color-text-primary)] font-bold">{showBlockConfirm.full_name}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBlockConfirm(null)} className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => toggleBlockStatus(showBlockConfirm.provider_id)}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg flex items-center gap-2 ${showBlockConfirm.status === 'Blocked' ? 'bg-green-600 hover:bg-green-500 text-[var(--color-text-primary)] shadow-green-500/10' : 'bg-red-600 hover:bg-red-500 text-[var(--color-text-primary)] shadow-red-500/10'}`}
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
          <div className="relative w-full max-w-sm bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">Delete Provider?</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mt-2 leading-relaxed">This action is permanent and cannot be undone. All data linked to this provider will be removed.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
              <button
                disabled={actionLoading}
                onClick={() => deleteProvider(showDeleteConfirm)}
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

export default ManageProviders;
