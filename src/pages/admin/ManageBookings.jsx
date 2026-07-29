import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, XCircle, Loader2 } from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const statusStyle = (s) => ({
  Confirmed:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Pending:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Completed:  'bg-green-500/15 text-green-400 border-green-500/20',
  Cancelled:  'bg-red-500/15 text-red-400 border-red-500/20',
}[s] || '');

const ManageBookings = () => {
  const { showToast } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null); // Modal details inspect

  const itemsPerPage = 8;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdmin('/api/admin/bookings');
      const data = await res.json();
      if (res.ok && data.status) {
        // Map database bookings to frontend keys
        const mapped = data.bookings.map(b => ({
          id: String(b.booking_id),
          number: b.booking_number || `#${b.booking_id}`,
          customer: b.customer_name,
          customerEmail: b.customer_email,
          provider: b.provider_name,
          providerEmail: b.provider_email,
          service: b.service_name,
          date: b.booking_date ? new Date(b.booking_date).toLocaleDateString() : '—',
          time: b.booking_time || '—',
          amount: b.final_price != null ? b.final_price : (b.estimated_price || 0),
          status: b.booking_status,
          raw: b
        }));
        setBookings(mapped);
      } else {
        showToast(data.message || 'Failed to load bookings.', 'error');
      }
    } catch {
      showToast('Server error. Could not fetch bookings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchSearch = (b.customer || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.id || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.number || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.service || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || b.status === filter;
    return matchSearch && matchFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleStatusSelectChange = async (id, newStatus, oldStatus) => {
    if (newStatus === oldStatus) return;
    if (newStatus === 'Cancelled') {
      await cancelBooking(id);
    } else {
      showToast('Admin can only cancel bookings. Other status updates are controlled by providers.', 'warning');
      // Reset select dropdown locally
      setBookings(prev => [...prev]);
    }
  };

  const cancelBooking = async (id) => {
    const bookingNum = bookings.find(b => b.id === id)?.number || id;
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingNum}?`)) {
      fetchBookings(); // Reload to reset local change
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/admin/booking/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by Admin' })
      });
      const data = await res.json();
      if (res.ok && data.status) {
        showToast(`Booking ${bookingNum} has been cancelled.`, 'success');
        fetchBookings();
      } else {
        showToast(data.message || 'Failed to cancel booking.', 'error');
        fetchBookings();
      }
    } catch {
      showToast('Server error during cancellation.', 'error');
      fetchBookings();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Manage Bookings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">View, filter, update and cancel service bookings.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, customer or service..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[var(--color-secondary-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-[var(--color-text-secondary)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-[var(--color-text-secondary)] flex-shrink-0" />
          {['All', ...STATUS_OPTIONS].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setCurrentPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex-shrink-0 cursor-pointer ${
                filter === f
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-subtle)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)]">
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide">ID</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Provider</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Service</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide hidden xl:table-cell">Date</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-[var(--color-text-secondary)] text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-[var(--color-text-secondary)] py-10">No bookings found.</td></tr>
              ) : (
                paginated.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-secondary-bg)]/30 transition-colors">
                    <td className="px-5 py-4 text-[var(--color-text-secondary)] text-xs font-mono">{b.number}</td>
                    <td className="px-5 py-4 text-left">
                      <div>
                        <p className="text-[var(--color-text-primary)] text-xs font-medium">{b.customer}</p>
                        <p className="text-[var(--color-text-secondary)] text-[10px]">{b.customerEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-secondary)] text-xs hidden md:table-cell">{b.provider}</td>
                    <td className="px-5 py-4 text-[var(--color-text-secondary)] text-xs hidden lg:table-cell">{b.service}</td>
                    <td className="px-5 py-4 text-[var(--color-text-secondary)] text-xs hidden xl:table-cell">
                      <div>{b.date}</div>
                      <div className="text-zinc-600">{b.time}</div>
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-primary)] text-xs font-semibold">₹{Number(b.amount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4">
                      <div className="relative group inline-block">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusSelectChange(b.id, e.target.value, b.status)}
                          className={`pl-2.5 pr-5 py-1 rounded-full text-[10px] font-semibold border appearance-none cursor-pointer bg-transparent outline-none ${statusStyle(b.status)}`}
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o} value={o} className="bg-[var(--color-primary-bg)] text-[var(--color-text-primary)]">
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedBooking(b)} 
                          title="View Details" 
                          className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button 
                            onClick={() => cancelBooking(b.id)} 
                            title="Cancel Booking" 
                            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-text-secondary)] text-xs">Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} bookings</p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] transition-colors cursor-pointer disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/20">{currentPage}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] transition-colors cursor-pointer disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Inspect Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-lg bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] cursor-pointer bg-transparent border-0"
              >
                X
              </button>
            </div>
            <h3 className="text-[var(--color-text-primary)] font-bold text-lg mb-1">Booking Detail Audit</h3>
            <p className="text-[var(--color-text-secondary)] text-xs mb-5">Booking Transaction Reference: {selectedBooking.number}</p>

            <div className="p-4 bg-white/[0.02] border border-[var(--color-border-subtle)] rounded-2xl space-y-2 text-xs">
              <p className="text-[var(--color-text-secondary)]">Service: <span className="text-[var(--color-text-primary)] font-semibold ml-1">{selectedBooking.service}</span></p>
              <p className="text-[var(--color-text-secondary)]">Customer: <span className="text-[var(--color-text-primary)] font-semibold ml-1">{selectedBooking.customer} ({selectedBooking.customerEmail})</span></p>
              <p className="text-[var(--color-text-secondary)]">Provider: <span className="text-[var(--color-text-primary)] font-semibold ml-1">{selectedBooking.provider} ({selectedBooking.providerEmail})</span></p>
              <p className="text-[var(--color-text-secondary)]">Schedule Date: <span className="text-[var(--color-text-primary)] font-semibold ml-1">{selectedBooking.date} • {selectedBooking.time}</span></p>
              <p className="text-[var(--color-text-secondary)]">Scheduled At: <span className="text-[var(--color-text-primary)] font-semibold ml-1">{selectedBooking.raw.created_at ? new Date(selectedBooking.raw.created_at).toLocaleString() : '—'}</span></p>
              <p className="text-[var(--color-text-secondary)]">Base Price: <span className="text-[var(--color-text-primary)] font-semibold ml-1">₹{selectedBooking.raw.estimated_price || 0}</span></p>
              <p className="text-[var(--color-text-secondary)]">Total Price: <span className="text-green-400 font-bold ml-1">₹{selectedBooking.raw.final_price || selectedBooking.raw.estimated_price || 0}</span></p>
              <p className="text-[var(--color-text-secondary)]">Payment Status: <span className="text-[var(--color-text-primary)] font-semibold ml-1">{selectedBooking.raw.payment_status || 'Pending'}</span></p>
              {selectedBooking.raw.cancellation_reason && (
                <p className="text-red-400">Cancel Reason: <span className="font-semibold ml-1">{selectedBooking.raw.cancellation_reason}</span></p>
              )}
              <p className="text-[var(--color-text-secondary)]">Status: <span className={`ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusStyle(selectedBooking.status)}`}>{selectedBooking.status}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
