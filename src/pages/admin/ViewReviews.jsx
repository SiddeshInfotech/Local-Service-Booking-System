import React, { useState } from 'react';
import { Search, Star, Trash2, MessageSquare } from 'lucide-react';

const allReviews = [];

const StarDisplay = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={13} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'} />
    ))}
  </div>
);

const ratingColor = (r) => {
  if (r >= 4) return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (r === 3) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
};

const ViewReviews = () => {
  const [reviews, setReviews] = useState(allReviews);
  const [search, setSearch] = useState('');

  const filtered = reviews.filter((r) =>
    r.customer.toLowerCase().includes(search.toLowerCase()) ||
    r.provider.toLowerCase().includes(search.toLowerCase()) ||
    r.service.toLowerCase().includes(search.toLowerCase())
  );

  const deleteReview = (id) => setReviews((prev) => prev.filter((r) => r.id !== id));

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">View Reviews</h1>
        <p className="text-zinc-500 text-sm mt-1">Monitor and moderate customer reviews for all providers.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Reviews',   value: reviews.length,                                           color: 'blue' },
          { label: 'Average Rating',  value: `${avgRating} ★`,                                         color: 'amber' },
          { label: '5-Star Reviews',  value: reviews.filter((r) => r.rating === 5).length,             color: 'green' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5`}>
            <p className="text-zinc-400 text-xs">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${{blue:'text-blue-400',amber:'text-amber-400',green:'text-green-400'}[color]}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
        />
      </div>

      {/* Review cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <MessageSquare size={36} className="mx-auto mb-3 text-zinc-700" />
          <p className="font-semibold text-sm text-zinc-400">No reviews available.</p>
          <p className="text-zinc-600 italic text-xs mt-1">Customer reviews will appear here once bookings are completed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {r.customer[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{r.customer}</p>
                    <p className="text-zinc-500 text-xs">→ {r.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ratingColor(r.rating)}`}>
                    {r.rating}/5
                  </span>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Stars */}
              <StarDisplay rating={r.rating} />

              {/* Comment */}
              <p className="text-zinc-300 text-sm leading-relaxed">"{r.comment}"</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
                <span className="text-zinc-500 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {r.service}
                </span>
                <span className="text-zinc-500 text-xs">{r.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewReviews;
