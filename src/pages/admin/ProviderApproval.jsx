import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, XCircle, Ban, ShieldCheck, Star, MapPin, Tag, FileText, X, Eye, Sparkles } from 'lucide-react';

const initialProviders = {
  Pending: [
    { id: 1, name: 'TechFix Solutions', email: 'tf@techfix.com', category: 'Electronics', location: 'Mumbai',    rating: null, experience: '3 years',  doc: 'Verified', docType: 'GST License', docUrl: 'GST_TechFix_2026.pdf' },
    { id: 2, name: 'GreenLawn Care',    email: 'gl@green.com',   category: 'Gardening',   location: 'Pune',      rating: null, experience: '5 years',  doc: 'Pending', docType: 'Trade Certificate', docUrl: 'Cert_GreenLawn.pdf'  },
    { id: 3, name: 'QuickPipe Works',   email: 'qp@quick.com',   category: 'Plumbing',    location: 'Delhi',     rating: null, experience: '2 years',  doc: 'Verified', docType: 'ID Verification', docUrl: 'NationalID_QuickPipe.pdf' },
  ],
  Approved: [
    { id: 4, name: 'Raju Works',        email: 'raju@works.com', category: 'Plumbing',    location: 'Mumbai',    rating: 4.7,  experience: '6 years',  doc: 'Verified', docType: 'Plumber License', docUrl: 'Lic_RajuWorks.pdf' },
    { id: 5, name: 'CleanPro India',    email: 'cp@clean.com',   category: 'Cleaning',    location: 'Bangalore', rating: 4.8,  experience: '4 years',  doc: 'Verified', docType: 'Business License', docUrl: 'BizLic_CleanPro.pdf' },
    { id: 6, name: 'BrightPaint Co.',   email: 'bp@bright.com',  category: 'Painting',    location: 'Kolkata',   rating: 4.9,  experience: '7 years',  doc: 'Verified', docType: 'Liability Insurance', docUrl: 'Ins_BrightPaint.pdf' },
  ],
  Blocked: [
    { id: 7, name: 'CoolAir Services',  email: 'ca@coolair.com', category: 'AC Repair',   location: 'Pune',      rating: 4.2,  experience: '2 years',  doc: 'Expired', docType: 'Repair Certificate', docUrl: 'Cert_Expired_CoolAir.pdf'  },
  ],
};

const ProviderApproval = () => {
  const { showToast } = useOutletContext();
  const [tab, setTab] = useState('Pending');
  const [providers, setProviders] = useState(initialProviders);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showConfirmAction, setShowConfirmAction] = useState(null); // { provider, from, to }

  const moveProvider = (provider, from, to) => {
    setProviders((prev) => ({
      ...prev,
      [from]: prev[from].filter((p) => p.id !== provider.id),
      [to]:   [...prev[to], { ...provider, doc: to === 'Approved' ? 'Verified' : provider.doc }],
    }));
    showToast(`Provider "${provider.name}" moved to ${to}`, to === 'Approved' ? 'success' : 'warning');
    setShowConfirmAction(null);
  };

  const current = providers[tab];

  const tabs = [
    { key: 'Pending',  label: 'Pending',  color: 'amber' },
    { key: 'Approved', label: 'Approved', color: 'green' },
    { key: 'Blocked',  label: 'Blocked',  color: 'red'   },
  ];

  const tabStyle = (key, color) => {
    if (tab !== key) return 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5';
    return {
      amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.05)]',
      green: 'text-green-400 border-green-500/30 bg-green-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]',
      red:   'text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]',
    }[color];
  };

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Provider Approvals <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Audit verification documents, business certifications, and moderate platform signup requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {tabs.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-3 rounded-t-2xl text-xs font-bold border border-b-0 transition-all cursor-pointer flex items-center gap-2 ${tabStyle(key, color)}`}
          >
            {label}
            <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/5 border border-white/10 text-zinc-400 font-black">
              {providers[key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {current.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-[#0d1425]/40 border border-white/5 backdrop-blur-xl">
          <ShieldCheck size={40} className="mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500 text-xs italic">No signup applications pending in this queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {current.map((p) => (
            <div key={p.id} className="rounded-3xl bg-[#0d1425]/40 border border-white/5 hover:border-white/10 p-6 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
              
              <div>
                {/* Header */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
                    {p.name[0]}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-white font-bold text-xs truncate leading-normal">{p.name}</p>
                    <p className="text-zinc-500 text-[10px] truncate mt-0.5">{p.email}</p>
                  </div>
                  
                  {/* Doc badge */}
                  <span className={`flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    p.doc === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    p.doc === 'Pending'  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                           'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {p.doc}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mt-6 border-t border-b border-white/5 py-4 my-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Tag size={12} className="text-blue-400 flex-shrink-0" />
                    <span>{p.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <MapPin size={12} className="text-purple-400 flex-shrink-0" />
                    <span>{p.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 col-span-2">
                    <FileText size={12} className="text-amber-400 flex-shrink-0" />
                    <button 
                      onClick={() => setSelectedDoc(p)}
                      className="text-zinc-400 hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{p.docType}</span>
                      <Eye size={12} className="text-zinc-500" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                  <span>Experience: <strong className="text-zinc-300 font-bold">{p.experience}</strong></span>
                  {p.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold">{p.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                {tab === 'Pending' && (
                  <>
                    <button
                      onClick={() => setShowConfirmAction({ provider: p, from: 'Pending', to: 'Approved' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-green-500/5"
                    >
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button
                      onClick={() => setShowConfirmAction({ provider: p, from: 'Pending', to: 'Blocked' })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-500/5"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
                {tab === 'Approved' && (
                  <button
                    onClick={() => setShowConfirmAction({ provider: p, from: 'Approved', to: 'Blocked' })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-500/5"
                  >
                    <Ban size={13} /> Block Partner
                  </button>
                )}
                {tab === 'Blocked' && (
                  <button
                    onClick={() => setShowConfirmAction({ provider: p, from: 'Blocked', to: 'Approved' })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-green-500/5"
                  >
                    <ShieldCheck size={13} /> Unblock Partner
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-lg bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Document Audit Panel</h3>
            <p className="text-zinc-500 text-xs mb-5">Inspect license certificates uploaded by <span className="text-zinc-300 font-bold">{selectedDoc.name}</span></p>

            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2 text-xs">
                <p className="text-zinc-500">Document Type: <span className="text-white font-bold ml-1">{selectedDoc.docType}</span></p>
                <p className="text-zinc-500">Resource URI: <span className="text-zinc-400 font-mono ml-1">{selectedDoc.docUrl}</span></p>
                <p className="text-zinc-500">Audit Status: <span className={`ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedDoc.doc === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>{selectedDoc.doc}</span></p>
              </div>

              {/* Mock Document Render */}
              <div className="h-48 border border-white/10 rounded-2xl bg-black/35 flex flex-col items-center justify-center p-6 text-center">
                <FileText size={44} className="text-blue-500/60 mb-3 animate-pulse" />
                <p className="text-white text-xs font-bold">{selectedDoc.docType}</p>
                <p className="text-zinc-500 text-[10px] mt-1">Audit verification code: FXML-ID-{selectedDoc.id}X2</p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => {
                      showToast('Document downloaded (Simulated)', 'success');
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white font-bold text-[10px] cursor-pointer"
                  >
                    Download File
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">
              {showConfirmAction.to === 'Approved' ? 'Approve Listing?' : 'Reject / Block Partner?'}
            </h3>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Are you sure you want to change parameters for <span className="text-white font-bold">{showConfirmAction.provider.name}</span> to <span className="text-blue-400 font-bold">{showConfirmAction.to}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowConfirmAction(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button 
                onClick={() => moveProvider(showConfirmAction.provider, showConfirmAction.from, showConfirmAction.to)}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg ${
                  showConfirmAction.to === 'Approved' 
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/10' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/10'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProviderApproval;
