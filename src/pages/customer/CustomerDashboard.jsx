import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Phone, Mail, Star, CheckCircle, Clock, XCircle,
  LogOut, ChevronRight, Loader2, Edit3, Save, X, CalendarDays,
  TrendingUp, Bell, BookOpen, LayoutDashboard, ShoppingBag, MessageSquare,
  Shield
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

const StatCard = ({ icon: Icon, label, value, color = 'text-white', bg = 'from-white/5 to-white/[0.02]' }) => (
  <div className={`bg-gradient-to-br ${bg} border border-white/8 rounded-2xl p-5 flex items-start gap-4`}>
    <div className="p-2.5 rounded-xl bg-white/5 shrink-0">
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-white text-sm font-semibold mt-0.5">{label}</p>
    </div>
  </div>
);

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ booking, onClose, onSubmit, submitting }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ booking_id: booking.booking_id, provider_id: booking.provider_id, rating, review_title: title, comment });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0e1628] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-bold text-lg">Leave a Review</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Booking #{booking.booking_id} · {booking.provider_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star rating */}
          <div>
            <label className="block text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Your Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setRating(n)}
                  className="cursor-pointer transition-transform hover:scale-110"
                >
                  <Star size={28} className={`${n <= (hover ?? rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'} transition-colors`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-bold mb-1.5">Review Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Great service!"
              className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:border-blue-500/50 outline-none placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-bold mb-1.5">Comment</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this provider…"
              rows={3}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:border-blue-500/50 outline-none resize-none placeholder-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-sm cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-500/15">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const CustomerDashboard = () => {
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
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auth guard
  useEffect(() => {
    const role = getRole();
    const token = localStorage.getItem('access_token');
    if (!token || role !== 'customer') {
      navigate('/customer/login', { replace: true });
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        apiFetch('/api/customer/profile'),
        apiFetch('/api/booking/history'),
      ]);
      const pData = await pRes.json();
      const bData = await bRes.json();
      if (pData.status) {
        setProfile(pData.user);
        setEditForm({
          full_name: pData.user.full_name || '',
          phone: pData.user.phone || '',
          gender: pData.user.gender || '',
          date_of_birth: pData.user.date_of_birth || '',
          address: pData.user.address || '',
          city: pData.user.city || '',
          state: pData.user.state || '',
          pincode: pData.user.pincode || '',
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

  const handleCancel = async (bookingId) => {
    setActionLoading(`${bookingId}-cancel`);
    try {
      const res = await apiFetch(`/api/booking/${bookingId}/cancel`, { method: 'POST', body: JSON.stringify({ reason: 'Cancelled by customer' }) });
      const data = await res.json();
      if (data.status) {
        showToast('Booking cancelled.', 'success');
        fetchData();
      } else showToast(data.message || 'Cancel failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async (bookingId) => {
    setActionLoading(`${bookingId}-complete`);
    try {
      const res = await apiFetch(`/api/booking/customer/${bookingId}/complete`, { method: 'POST' });
      const data = await res.json();
      if (data.status) {
        showToast('Booking marked as completed!', 'success');
        fetchData();
      } else showToast(data.message || 'Action failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleReviewSubmit = async ({ booking_id, provider_id, rating, review_title, comment }) => {
    setReviewSubmitting(true);
    try {
      const res = await apiFetch('/api/review', {
        method: 'POST',
        body: JSON.stringify({ booking_id, provider_id, rating, review_title, comment }),
      });
      const data = await res.json();
      if (data.status) {
        showToast('Review submitted! Thank you.', 'success');
        setReviewTarget(null);
        fetchData();
      } else showToast(data.message || 'Review failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setReviewSubmitting(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/customer/profile', { method: 'PUT', body: JSON.stringify(editForm) });
      const data = await res.json();
      if (data.status) {
        setProfile(data.user);
        setEditMode(false);
        showToast('Profile updated successfully.', 'success');
      } else showToast(data.message || 'Update failed.', 'error');
    } catch { showToast('Server error.', 'error'); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    try { await apiFetch('/api/customer/logout', { method: 'POST' }); } catch {}
    clearAuth();
    navigate('/customer/login', { replace: true });
  };

  // Stats
  const total     = bookings.length;
  const completed = bookings.filter(b => b.booking_status === 'Completed').length;
  const active    = bookings.filter(b => ['Pending','Accepted','In Progress','Finished'].includes(b.booking_status)).length;
  const cancelled = bookings.filter(b => b.booking_status === 'Cancelled').length;
  const spent     = bookings.filter(b => b.booking_status === 'Completed').reduce((s, b) => s + (parseFloat(b.final_price || b.estimated_price) || 0), 0);
  const recentBookings = [...bookings].slice(0, 8);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings',  label: 'My Bookings', icon: BookOpen },
    { id: 'profile',   label: 'Profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-400" />
          <p className="text-zinc-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090f] flex text-white">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border transition-all animate-fade-in ${
          toast.type === 'error' ? 'bg-red-600/20 border-red-500/30 text-red-300' : 'bg-green-600/20 border-green-500/30 text-green-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
          submitting={reviewSubmitting}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0c16] border-r border-white/8 h-screen sticky top-0 shrink-0">
        <div className="px-6 py-6 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ShoppingBag size={14} className="text-white" />
            </div>
            <span className="text-white font-black text-base">My Dashboard</span>
          </div>
        </div>

        {/* Profile mini */}
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
              {(profile?.full_name || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{profile?.full_name || '—'}</p>
              <p className="text-zinc-500 text-[10px] truncate">{profile?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                tab === id ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut size={16} />Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/8 bg-[#0a0c16]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-blue-400" />
            <span className="text-white font-black">My Dashboard</span>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"><LogOut size={16} /></button>
        </div>
        <div className="md:hidden flex gap-1 px-4 py-3 border-b border-white/8 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              tab === id ? 'bg-blue-500/15 text-blue-400 border-blue-500/25' : 'text-zinc-400 border-transparent hover:bg-white/5'
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
                <h1 className="text-2xl font-black text-white">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
                <p className="text-zinc-500 text-sm mt-1">Here's a summary of your service bookings.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={BookOpen}    label="Total Bookings" value={total}     color="text-white" />
                <StatCard icon={CheckCircle} label="Completed"      value={completed}  color="text-green-400" bg="from-green-500/10 to-green-500/5" />
                <StatCard icon={Clock}       label="Active"         value={active}     color="text-amber-400" bg="from-amber-500/10 to-amber-500/5" />
                <StatCard icon={TrendingUp}  label="Total Spent"    value={`₹${spent.toLocaleString('en-IN')}`} color="text-blue-400" bg="from-blue-500/10 to-blue-500/5" />
              </div>

              {/* Recent bookings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-lg">Recent Bookings</h2>
                  <button onClick={() => setTab('bookings')} className="flex items-center gap-1 text-blue-400 text-xs hover:underline cursor-pointer">
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <CustomerBookingTable
                  bookings={recentBookings}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  onReview={setReviewTarget}
                  actionLoading={actionLoading}
                />
              </div>
            </>
          )}

          {/* ══ BOOKINGS TAB ═══════════════════════════════════════════════ */}
          {tab === 'bookings' && (
            <>
              <div>
                <h1 className="text-2xl font-black text-white">My Bookings</h1>
                <p className="text-zinc-500 text-sm mt-1">Track and manage all your service requests.</p>
              </div>
              <CustomerBookingTable
                bookings={bookings}
                onCancel={handleCancel}
                onComplete={handleComplete}
                onReview={setReviewTarget}
                actionLoading={actionLoading}
                fullView
              />
            </>
          )}

          {/* ══ PROFILE TAB ════════════════════════════════════════════════ */}
          {tab === 'profile' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white">My Profile</h1>
                  <p className="text-zinc-500 text-sm mt-1">View and update your account information.</p>
                </div>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Avatar + quick info */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-[#0d1020] border border-white/8 rounded-2xl p-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-xl mx-auto">
                      {(profile?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <h2 className="text-white font-black text-lg mt-3">{profile?.full_name}</h2>
                    <p className="text-zinc-500 text-xs">{profile?.email}</p>
                    {profile?.email_verified && (
                      <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Shield size={9} /> Email Verified
                      </span>
                    )}
                  </div>

                  <div className="bg-[#0d1020] border border-white/8 rounded-2xl p-5 space-y-3">
                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Quick Info</h3>
                    {[
                      { icon: Phone,        val: profile?.phone || '—' },
                      { icon: MapPin,       val: `${profile?.city || '—'}, ${profile?.state || '—'}` },
                      { icon: User,         val: profile?.gender || '—' },
                      { icon: CalendarDays, val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' }) : '—' },
                    ].map(({ icon: Icon, val }, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <Icon size={14} className="text-zinc-500 shrink-0" />
                        <span className="text-zinc-300">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detail / Edit form */}
                <div className="md:col-span-2">
                  {editMode ? (
                    <form onSubmit={handleSaveProfile} className="bg-[#0d1020] border border-white/8 rounded-2xl p-6 space-y-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-bold">Edit Information</h3>
                        <button type="button" onClick={() => setEditMode(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"><X size={16} /></button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {[
                          { label: 'Full Name',    key: 'full_name',    type: 'text' },
                          { label: 'Phone',         key: 'phone',        type: 'text' },
                          { label: 'City',          key: 'city',         type: 'text' },
                          { label: 'State',         key: 'state',        type: 'text' },
                          { label: 'Pincode',       key: 'pincode',      type: 'text' },
                          { label: 'Date of Birth', key: 'date_of_birth',type: 'date' },
                        ].map(({ label, key, type }) => (
                          <div key={key}>
                            <label className="block text-zinc-500 text-xs font-bold mb-1.5">{label}</label>
                            <input
                              type={type}
                              value={editForm[key] || ''}
                              onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:border-blue-500/50 outline-none transition-all"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-zinc-500 text-xs font-bold mb-1.5">Gender</label>
                          <select
                            value={editForm.gender || ''}
                            onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:border-blue-500/50 outline-none"
                          >
                            <option value="">Select…</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-zinc-500 text-xs font-bold mb-1.5">Address</label>
                        <input
                          type="text"
                          value={editForm.address || ''}
                          onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-sm px-3 py-2.5 focus:border-blue-500/50 outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-sm cursor-pointer">Cancel</button>
                        <button type="submit" disabled={saving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-sm cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/15 disabled:opacity-60">
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="bg-[#0d1020] border border-white/8 rounded-2xl p-6 space-y-5">
                      <h3 className="text-white font-bold">Profile Details</h3>
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          { label: 'Full Name',    val: profile?.full_name },
                          { label: 'Email',         val: profile?.email },
                          { label: 'Phone',         val: profile?.phone },
                          { label: 'Gender',        val: profile?.gender },
                          { label: 'Date of Birth', val: profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-IN') : null },
                          { label: 'City',          val: profile?.city },
                          { label: 'State',         val: profile?.state },
                          { label: 'Pincode',       val: profile?.pincode },
                          { label: 'Address',       val: profile?.address },
                          { label: 'Email Verified',val: profile?.email_verified ? 'Yes ✓' : 'No' },
                        ].map(({ label, val }) => (
                          <div key={label} className="border-b border-white/5 pb-3">
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                            <p className="text-white text-sm font-semibold">{val || '—'}</p>
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

// ─── CustomerBookingTable sub-component ───────────────────────────────────────
const CustomerBookingTable = ({ bookings, onCancel, onComplete, onReview, actionLoading, fullView = false }) => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const statuses = ['All','Pending','Accepted','In Progress','Finished','Completed','Cancelled'];
  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'All' || b.booking_status === filter;
    const matchSearch = !search ||
      (b.provider_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.service_name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.booking_id).includes(search);
    return matchStatus && matchSearch;
  });

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 bg-[#0d1020] border border-white/8 rounded-2xl">
        <BookOpen size={36} className="mx-auto text-zinc-700 mb-3" />
        <p className="text-zinc-500 font-semibold">No bookings yet</p>
        <p className="text-zinc-600 text-xs mt-1">Book a service to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1020] border border-white/8 rounded-2xl overflow-hidden">
      {fullView && (
        <div className="px-5 py-4 border-b border-white/8 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by provider, service, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500/40 placeholder-zinc-500 w-full sm:w-64"
          />
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${filter===s?'bg-blue-500/15 text-blue-400 border-blue-500/25':'text-zinc-500 border-white/5 hover:text-white hover:bg-white/5'}`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.015]">
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase">ID</th>
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase">Provider</th>
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase hidden md:table-cell">Service</th>
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase hidden sm:table-cell">Amount</th>
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase">Status</th>
              <th className="px-4 py-3 text-zinc-500 text-xs font-bold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(fullView ? filtered : filtered.slice(0, 8)).map(b => (
              <tr key={b.booking_id} className="border-b border-white/5 hover:bg-white/[0.015] transition-colors">
                <td className="px-4 py-3 text-zinc-500 text-xs font-mono">#{b.booking_id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                      {(b.provider_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-semibold">{b.provider_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">{b.service_name}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs hidden lg:table-cell">{b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
                <td className="px-4 py-3 text-xs hidden sm:table-cell">
                  <span className="text-white font-semibold">₹{(parseFloat(b.final_price || b.estimated_price) || 0).toLocaleString('en-IN')}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColors[b.booking_status] || 'text-zinc-400 bg-zinc-500/15 border-zinc-500/25'}`}>
                    {b.booking_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Cancel for pending/accepted */}
                    {['Pending', 'Accepted'].includes(b.booking_status) && (
                      <button
                        disabled={!!actionLoading}
                        onClick={() => onCancel(b.booking_id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-500/25 bg-red-500/15 text-red-400 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${b.booking_id}-cancel` ? <Loader2 size={10} className="animate-spin inline" /> : 'Cancel'}
                      </button>
                    )}
                    {/* Complete for Finished */}
                    {b.booking_status === 'Finished' && (
                      <button
                        disabled={!!actionLoading}
                        onClick={() => onComplete(b.booking_id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-green-500/25 bg-green-500/15 text-green-400 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${b.booking_id}-complete` ? <Loader2 size={10} className="animate-spin inline" /> : 'Confirm Done'}
                      </button>
                    )}
                    {/* Review for Completed without review */}
                    {b.booking_status === 'Completed' && !b.review_id && (
                      <button
                        onClick={() => onReview(b)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-500/25 bg-amber-500/15 text-amber-400 transition-all cursor-pointer"
                      >
                        Review
                      </button>
                    )}
                    {b.booking_status === 'Completed' && b.review_id && (
                      <span className="flex items-center gap-1 text-zinc-500 text-[10px]"><Star size={9} className="text-amber-400 fill-amber-400" />Reviewed</span>
                    )}
                    {!['Pending','Accepted','Finished','Completed'].includes(b.booking_status) && (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerDashboard;
