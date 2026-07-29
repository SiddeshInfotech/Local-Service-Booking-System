import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Phone, Mail, Star, Briefcase, CheckCircle, Clock,
  XCircle, LogOut, ChevronRight, Loader2, Edit3, Save, X, Award,
  CalendarDays, TrendingUp, Wrench, Bell, Shield, LayoutDashboard,
  BookOpen, Settings
} from 'lucide-react';
import { apiFetch, clearAuth, getRole } from '../../api';
import { useNavigate } from 'react-router-dom';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColors = {
  Pending:     'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Accepted:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'In Progress':'bg-purple-500/15 text-purple-400 border-purple-500/25',
  Finished:    'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  Completed:   'bg-green-500/15 text-green-400 border-green-500/25',
  Cancelled:   'bg-red-500/15 text-red-400 border-red-500/25',
};

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-[var(--color-text-primary)]', bg = 'from-white/5 to-white/[0.02]' }) => (
  <div className={`bg-gradient-to-br ${bg} border border-white/8 rounded-2xl p-5 flex items-start gap-4`}>
    <div className="p-2.5 rounded-xl bg-[var(--color-overlay-subtle)] shrink-0">
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[var(--color-text-primary)] text-sm font-semibold mt-0.5">{label}</p>
      {sub && <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auth guard
  useEffect(() => {
    const role = getRole();
    const token = localStorage.getItem('access_token');
    if (!token || role !== 'provider') {
      navigate('/provider/login', { replace: true });
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        apiFetch('/api/provider/profile'),
        apiFetch('/api/booking/provider/history'),
      ]);
      const pData = await pRes.json();
      const bData = await bRes.json();
      if (pData.status) {
        setProfile(pData.provider);
        setEditForm({
          full_name: pData.provider.full_name || '',
          phone: pData.provider.phone || '',
          address: pData.provider.address || '',
          city: pData.provider.city || '',
          state: pData.provider.state || '',
          pincode: pData.provider.pincode || '',
          experience_years: pData.provider.experience_years || '',
          description: pData.provider.description || '',
        });
      }
      if (bData.status) setBookings(bData.bookings || []);
    } catch {
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (bookingId, action) => {
    setActionLoading(`${bookingId}-${action}`);
    const endpoints = {
      accept: `/api/booking/provider/${bookingId}/accept`,
      reject: `/api/booking/provider/${bookingId}/reject`,
      start:  `/api/booking/provider/${bookingId}/start`,
      complete: `/api/booking/provider/${bookingId}/complete`,
      cancel: `/api/booking/provider/${bookingId}/cancel`,
    };
    try {
      const res = await apiFetch(endpoints[action], { method: 'POST' });
      const data = await res.json();
      if (data.status) {
        showToast(data.message || `Booking ${action}ed.`, 'success');
        fetchData();
      } else {
        showToast(data.message || 'Action failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/provider/profile', {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.status) {
        setProfile(data.provider);
        setEditMode(false);
        showToast('Profile updated successfully.', 'success');
      } else {
        showToast(data.message || 'Update failed.', 'error');
      }
    } catch {
      showToast('Server error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await apiFetch('/api/provider/logout', { method: 'POST' }); } catch {}
    clearAuth();
    navigate('/provider/login', { replace: true });
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const total      = bookings.length;
  const completed  = bookings.filter(b => b.booking_status === 'Completed').length;
  const active     = bookings.filter(b => ['Pending','Accepted','In Progress','Finished'].includes(b.booking_status)).length;
  const cancelled  = bookings.filter(b => b.booking_status === 'Cancelled').length;
  const earnings   = bookings.filter(b => b.booking_status === 'Completed').reduce((s, b) => s + (parseFloat(b.final_price || b.estimated_price) || 0), 0);
  const recentBookings = [...bookings].slice(0, 10);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings',  label: 'My Bookings', icon: BookOpen },
    { id: 'profile',   label: 'Profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-primary-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-amber-400" />
          <p className="text-[var(--color-text-secondary)] text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-primary-bg)] flex text-[var(--color-text-primary)]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border transition-all animate-fade-in ${
          toast.type === 'error' ? 'bg-red-600/20 border-red-500/30 text-red-300' : 'bg-green-600/20 border-green-500/30 text-green-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-secondary-bg)] border-r border-white/8 h-screen sticky top-0 shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Wrench size={14} className="text-[var(--color-text-primary)]" />
            </div>
            <span className="text-[var(--color-text-primary)] font-black text-base">Provider Hub</span>
          </div>
        </div>

        {/* Profile mini */}
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[var(--color-text-primary)] font-black text-sm shadow-md shrink-0">
              {(profile?.full_name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[var(--color-text-primary)] text-sm font-bold truncate">{profile?.full_name || '—'}</p>
              <p className="text-[var(--color-text-secondary)] text-[10px] truncate">{profile?.email}</p>
            </div>
          </div>
          {profile?.status && (
            <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
              profile.status === 'Approved' || profile.status === 'Active'
                ? 'bg-green-500/15 text-green-400 border-green-500/20'
                : profile.status === 'Pending'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                : 'bg-red-500/15 text-red-400 border-red-500/20'
            }`}>
              <Shield size={8} /> {profile.status}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/8 bg-[var(--color-secondary-bg)]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Wrench size={18} className="text-amber-400" />
            <span className="text-[var(--color-text-primary)] font-black">Provider Hub</span>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 cursor-pointer">
            <LogOut size={16} />
          </button>
        </div>
        {/* Mobile nav tabs */}
        <div className="md:hidden flex gap-1 px-4 py-3 border-b border-white/8 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              tab === id ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-overlay-subtle)]'
            }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div className="px-5 md:px-8 py-7 space-y-8">

          {/* ══ DASHBOARD TAB ══════════════════════════════════════════════ */}
          {tab === 'dashboard' && (
            <>
              <div>
                <h1 className="text-2xl font-black text-[var(--color-text-primary)]">Welcome back, {profile?.full_name?.split(' ')[0] || 'Provider'} 👋</h1>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Here's what's happening with your bookings today.</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={BookOpen}    label="Total Jobs"  value={total}     color="text-[var(--color-text-primary)]" />
                <StatCard icon={CheckCircle} label="Completed"   value={completed}  color="text-green-400" bg="from-green-500/10 to-green-500/5" />
                <StatCard icon={Clock}       label="Active"      value={active}     color="text-amber-400" bg="from-amber-500/10 to-amber-500/5" />
                <StatCard icon={TrendingUp}  label="Earnings"    value={`₹${earnings.toLocaleString('en-IN')}`} color="text-blue-400" bg="from-blue-500/10 to-blue-500/5" />
              </div>

              {/* Rating */}
              {profile?.average_rating != null && (
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Star size={24} className="text-amber-400 fill-amber-400" />
                    <span className="text-3xl font-black text-amber-400">{Number(profile.average_rating).toFixed(1)}</span>
                  </div>
                  <div>
                    <p className="text-[var(--color-text-primary)] font-bold">Your Rating</p>
                    <p className="text-[var(--color-text-secondary)] text-xs">{profile.total_reviews || 0} review{profile.total_reviews !== 1 ? 's' : ''} received</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[var(--color-text-secondary)] text-xs">{profile.experience_years || 0} yrs experience</p>
                    <p className="text-[var(--color-text-secondary)] text-xs">{profile.city || '—'}</p>
                  </div>
                </div>
              )}

              {/* Recent bookings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[var(--color-text-primary)] font-bold text-lg">Recent Bookings</h2>
                  <button onClick={() => setTab('bookings')} className="flex items-center gap-1 text-amber-400 text-xs hover:underline cursor-pointer">
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <BookingTable bookings={recentBookings} onAction={handleAction} actionLoading={actionLoading} />
              </div>
            </>
          )}

          {/* ══ BOOKINGS TAB ═══════════════════════════════════════════════ */}
          {tab === 'bookings' && (
            <>
              <div>
                <h1 className="text-2xl font-black text-[var(--color-text-primary)]">My Bookings</h1>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage and track all your service bookings.</p>
              </div>
              <BookingTable bookings={bookings} onAction={handleAction} actionLoading={actionLoading} fullView />
            </>
          )}

          {/* ══ PROFILE TAB ════════════════════════════════════════════════ */}
          {tab === 'profile' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-[var(--color-text-primary)]">My Profile</h1>
                  <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage your provider information and service details.</p>
                </div>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Left — avatar + quick info */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-[var(--color-card-bg)] border border-white/8 rounded-2xl p-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-[var(--color-text-primary)] font-black text-3xl shadow-xl mx-auto">
                      {(profile?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <h2 className="text-[var(--color-text-primary)] font-black text-lg mt-3">{profile?.full_name}</h2>
                    <p className="text-[var(--color-text-secondary)] text-xs">{profile?.email}</p>
                    {profile?.average_rating != null && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-amber-400 font-bold text-sm">{Number(profile.average_rating).toFixed(1)}</span>
                        <span className="text-zinc-600 text-xs">({profile.total_reviews || 0})</span>
                      </div>
                    )}
                    <span className={`mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${
                      profile?.status === 'Approved' || profile?.status === 'Active'
                        ? 'bg-green-500/15 text-green-400 border-green-500/20'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                    }`}>{profile?.status}</span>
                  </div>

                  {/* Quick stats */}
                  <div className="bg-[var(--color-card-bg)] border border-white/8 rounded-2xl p-5 space-y-3">
                    <h3 className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Quick Info</h3>
                    {[
                      { icon: Phone,       val: profile?.phone || '—' },
                      { icon: MapPin,      val: `${profile?.city || '—'}, ${profile?.state || '—'}` },
                      { icon: Award,       val: `${profile?.experience_years || 0} yrs experience` },
                      { icon: CalendarDays,val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' }) : '—' },
                    ].map(({ icon: Icon, val }, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Icon size={14} className="text-[var(--color-text-secondary)] shrink-0" />
                        <span className="text-[var(--color-text-primary)]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — edit form or detail view */}
                <div className="md:col-span-2">
                  {editMode ? (
                    <form onSubmit={handleSaveProfile} className="bg-[var(--color-card-bg)] border border-white/8 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[var(--color-text-primary)] font-bold">Edit Information</h3>
                        <button type="button" onClick={() => setEditMode(false)} className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] cursor-pointer"><X size={16} /></button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Full Name',   key: 'full_name',       type: 'text' },
                          { label: 'Phone',        key: 'phone',           type: 'text' },
                          { label: 'City',         key: 'city',            type: 'text' },
                          { label: 'State',        key: 'state',           type: 'text' },
                          { label: 'Pincode',      key: 'pincode',         type: 'text' },
                          { label: 'Experience (years)', key: 'experience_years', type: 'number' },
                        ].map(({ label, key, type }) => (
                          <div key={key}>
                            <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">{label}</label>
                            <input
                              type={type}
                              value={editForm[key] || ''}
                              onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                              className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-sm px-3 py-2.5 focus:border-amber-500/50 outline-none transition-all"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">Address</label>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                          className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-sm px-3 py-2.5 focus:border-amber-500/50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">About / Description</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-sm px-3 py-2.5 focus:border-amber-500/50 outline-none resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-sm cursor-pointer">Cancel</button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-sm cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-60">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-[var(--color-card-bg)] border border-white/8 rounded-2xl p-6 space-y-5">
                      <h3 className="text-[var(--color-text-primary)] font-bold">Profile Details</h3>
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          { label: 'Full Name',   val: profile?.full_name },
                          { label: 'Email',        val: profile?.email },
                          { label: 'Phone',        val: profile?.phone },
                          { label: 'City',         val: profile?.city },
                          { label: 'State',        val: profile?.state },
                          { label: 'Pincode',      val: profile?.pincode },
                          { label: 'Address',      val: profile?.address },
                          { label: 'Experience',   val: profile?.experience_years ? `${profile.experience_years} years` : null },
                          { label: 'Email Verified', val: profile?.email_verified ? 'Yes ✓' : 'No' },
                        ].map(({ label, val }) => (
                          <div key={label} className="border-b border-[var(--color-border-subtle)] pb-3">
                            <p className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                            <p className="text-[var(--color-text-primary)] text-sm font-semibold">{val || '—'}</p>
                          </div>
                        ))}
                      </div>
                      {profile?.description && (
                        <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                          <p className="text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider mb-2">About</p>
                          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">{profile.description}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Documents */}
                  {profile?.documents?.length > 0 && (
                    <div className="bg-[var(--color-card-bg)] border border-white/8 rounded-2xl p-6 mt-4">
                      <h3 className="text-[var(--color-text-primary)] font-bold mb-4">Documents</h3>
                      <div className="space-y-3">
                        {profile.documents.map(doc => (
                          <div key={doc.document_id} className="flex items-center justify-between bg-white/[0.025] border border-[var(--color-border-subtle)] rounded-xl px-4 py-3">
                            <div>
                              <p className="text-[var(--color-text-primary)] text-sm font-semibold capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                              <p className="text-[var(--color-text-secondary)] text-xs">Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-IN') : '—'}</p>
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
                                <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline">View</a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

// ─── BookingTable sub-component ────────────────────────────────────────────────
const BookingTable = ({ bookings, onAction, actionLoading, fullView = false }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const statuses = ['All','Pending','Accepted','In Progress','Finished','Completed','Cancelled'];
  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'All' || b.booking_status === filter;
    const matchSearch = !search ||
      (b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.service_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.booking_id).includes(search);
    return matchStatus && matchSearch;
  });

  const getActions = (b) => {
    switch (b.booking_status) {
      case 'Pending':     return [['accept','Accept','text-green-400 bg-green-500/15 border-green-500/25'],['reject','Reject','text-red-400 bg-red-500/15 border-red-500/25']];
      case 'Accepted':    return [['start','Start','text-blue-400 bg-blue-500/15 border-blue-500/25'],['cancel','Cancel','text-red-400 bg-red-500/15 border-red-500/25']];
      case 'In Progress': return [['complete','Mark Done','text-amber-400 bg-amber-500/15 border-amber-500/25']];
      default:            return [];
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 bg-[var(--color-card-bg)] border border-white/8 rounded-2xl">
        <BookOpen size={36} className="mx-auto text-zinc-700 mb-3" />
        <p className="text-[var(--color-text-secondary)] font-semibold">No bookings yet</p>
        <p className="text-zinc-600 text-xs mt-1">Your job requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-card-bg)] border border-white/8 rounded-2xl overflow-hidden">
      {fullView && (
        <div className="px-5 py-4 border-b border-white/8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by customer, service, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-500/40 placeholder-zinc-500 w-full sm:w-64"
          />
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${filter===s?'bg-amber-500/15 text-amber-400 border-amber-500/25':'text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)]'}`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] bg-white/[0.015]">
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase">ID</th>
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase">Customer</th>
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase hidden md:table-cell">Service</th>
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase hidden sm:table-cell">Price</th>
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase">Status</th>
              <th className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(fullView ? filtered : filtered.slice(0,8)).map(b => (
              <tr key={b.booking_id} className="border-b border-[var(--color-border-subtle)] hover:bg-white/[0.015] transition-colors">
                <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs font-mono">#{b.booking_id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[var(--color-text-primary)] text-[10px] font-black shrink-0">
                      {(b.customer_name||'?')[0].toUpperCase()}
                    </div>
                    <span className="text-[var(--color-text-primary)] text-xs font-semibold">{b.customer_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs hidden md:table-cell">{b.service_name}</td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)] text-xs hidden lg:table-cell">{b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
                <td className="px-4 py-3 text-xs hidden sm:table-cell">
                  <span className="text-[var(--color-text-primary)] font-semibold">₹{(parseFloat(b.final_price || b.estimated_price) || 0).toLocaleString('en-IN')}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[b.booking_status] || 'text-[var(--color-text-secondary)] bg-[var(--color-overlay-subtle)] border-[var(--color-border-subtle)]'}`}>
                    {b.booking_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {getActions(b).map(([action, label, cls]) => (
                      <button
                        key={action}
                        disabled={!!actionLoading}
                        onClick={() => onAction(b.booking_id, action)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-50 ${cls}`}
                      >
                        {actionLoading === `${b.booking_id}-${action}` ? <Loader2 size={10} className="animate-spin inline" /> : label}
                      </button>
                    ))}
                    {getActions(b).length === 0 && <span className="text-zinc-600 text-xs">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!fullView && filtered.length > 8 && (
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] text-center">
          <p className="text-[var(--color-text-secondary)] text-xs">{filtered.length - 8} more bookings — switch to Bookings tab to see all</p>
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;
