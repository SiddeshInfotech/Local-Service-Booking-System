import React, { useState } from 'react';
import { CheckCircle2, XCircle, Ban, ShieldCheck, Star, MapPin, Tag } from 'lucide-react';

const initialProviders = {
  Pending: [
    { id: 1, name: 'TechFix Solutions', email: 'tf@techfix.com', category: 'Electronics', location: 'Mumbai',    rating: null, experience: '3 years',  doc: 'Verified' },
    { id: 2, name: 'GreenLawn Care',    email: 'gl@green.com',   category: 'Gardening',   location: 'Pune',      rating: null, experience: '5 years',  doc: 'Pending'  },
    { id: 3, name: 'QuickPipe Works',   email: 'qp@quick.com',   category: 'Plumbing',    location: 'Delhi',     rating: null, experience: '2 years',  doc: 'Verified' },
  ],
  Approved: [
    { id: 4, name: 'Raju Works',        email: 'raju@works.com', category: 'Plumbing',    location: 'Mumbai',    rating: 4.7,  experience: '6 years',  doc: 'Verified' },
    { id: 5, name: 'CleanPro India',    email: 'cp@clean.com',   category: 'Cleaning',    location: 'Bangalore', rating: 4.8,  experience: '4 years',  doc: 'Verified' },
    { id: 6, name: 'BrightPaint Co.',   email: 'bp@bright.com',  category: 'Painting',    location: 'Kolkata',   rating: 4.9,  experience: '7 years',  doc: 'Verified' },
  ],
  Blocked: [
    { id: 7, name: 'CoolAir Services',  email: 'ca@coolair.com', category: 'AC Repair',   location: 'Pune',      rating: 4.2,  experience: '2 years',  doc: 'Expired'  },
  ],
};

const ProviderApproval = () => {
  const [tab, setTab] = useState('Pending');
  const [providers, setProviders] = useState(initialProviders);

  const moveProvider = (provider, from, to) => {
    setProviders((prev) => ({
      ...prev,
      [from]: prev[from].filter((p) => p.id !== provider.id),
      [to]:   [...prev[to], provider],
    }));
  };

  const current = providers[tab];

  const tabs = [
    { key: 'Pending',  label: 'Pending',  color: 'amber' },
    { key: 'Approved', label: 'Approved', color: 'green' },
    { key: 'Blocked',  label: 'Blocked',  color: 'red'   },
  ];

  const tabStyle = (key, color) => {
    if (tab !== key) return 'text-zinc-400 border-zinc-700 hover:text-white';
    return {
      amber: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
      green: 'text-green-400 border-green-500/50 bg-green-500/10',
      red:   'text-red-400 border-red-500/50 bg-red-500/10',
    }[color];
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Provider Approval</h1>
        <p className="text-zinc-500 text-sm mt-1">Approve, reject, or block service providers.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800/60 pb-0">
        {tabs.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-t-xl text-sm font-medium border border-b-0 transition-all ${tabStyle(key, color)}`}
          >
            {label}
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
              {providers[key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {current.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <ShieldCheck size={36} className="mx-auto mb-3 text-zinc-700" />
          <p>No providers in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {current.map((p) => (
            <div key={p.id} className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {p.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-zinc-500 text-xs truncate">{p.email}</p>
                </div>
                {/* Doc badge */}
                <span className={`ml-auto flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  p.doc === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  p.doc === 'Pending'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                         'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {p.doc}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Tag size={12} className="text-blue-400 flex-shrink-0" />
                  {p.category}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <MapPin size={12} className="text-purple-400 flex-shrink-0" />
                  {p.location}
                </div>
                {p.rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-white font-medium">{p.rating}</span>
                  </div>
                )}
                <div className="text-xs text-zinc-400">{p.experience}</div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 border-t border-zinc-800/60 mt-auto">
                {tab === 'Pending' && (
                  <>
                    <button
                      onClick={() => moveProvider(p, 'Pending', 'Approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 text-xs font-semibold transition-colors"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      onClick={() => moveProvider(p, 'Pending', 'Blocked')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
                {tab === 'Approved' && (
                  <button
                    onClick={() => moveProvider(p, 'Approved', 'Blocked')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
                  >
                    <Ban size={13} /> Block Provider
                  </button>
                )}
                {tab === 'Blocked' && (
                  <button
                    onClick={() => moveProvider(p, 'Blocked', 'Approved')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/20 text-xs font-semibold transition-colors"
                  >
                    <ShieldCheck size={13} /> Unblock Provider
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderApproval;
