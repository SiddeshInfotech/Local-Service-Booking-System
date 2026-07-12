import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, X, Check, Tag, Sparkles, AlertCircle, Filter } from 'lucide-react';

const initialCategories = [
  { id: 1, name: 'Cleaning',     icon: '🧹', services: 0, status: 'Active',   desc: 'Home, office and deep cleaning services.' },
  { id: 2, name: 'Plumbing',     icon: '🔧', services: 0, status: 'Active',   desc: 'Pipe fitting, leaks, drainage and water-related repairs.' },
  { id: 3, name: 'AC Repair',    icon: '❄️', services: 0, status: 'Active',   desc: 'Installation, service and gas refilling for ACs.' },
  { id: 4, name: 'Carpenter',    icon: '🪚', services: 0, status: 'Active',   desc: 'Furniture assembly, wood work and repairs.' },
  { id: 5, name: 'Electrician',  icon: '⚡', services: 0, status: 'Active',   desc: 'Wiring, switch boards, appliance installation.' },
];

const EMPTY = { name: '', icon: '🔧', desc: '', status: 'Active' };

const emojiPool = ['🔧', '⚡', '🧹', '🪚', '🐛', '❄️', '🎨', '🔑', '🏠', '🚗', '📦', '💻', '🩺', '👔', '✂️', '🧱'];

const ManageCategories = () => {
  const { showToast } = useOutletContext();
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { ...category }
  const [form, setForm] = useState(EMPTY);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('All');

  const filtered = categories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.desc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (cat) => { setForm({ name: cat.name, icon: cat.icon, desc: cat.desc, status: cat.status }); setModal(cat); };
  const closeModal = () => setModal(null);

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    if (modal === 'add') {
      setCategories((prev) => [...prev, { id: Date.now(), ...form, services: 0 }]);
      showToast(`Category "${form.name}" has been created.`, 'success');
    } else {
      setCategories((prev) => prev.map((c) => c.id === modal.id ? { ...c, ...form } : c));
      showToast(`Category "${form.name}" has been updated.`, 'success');
    }
    closeModal();
  };

  const attemptDelete = (cat) => {
    if (cat.services > 0) {
      showToast(`Conflict: "${cat.name}" has ${cat.services} active services. Reassign them first.`, 'error');
      return;
    }
    setShowDeleteConfirm(cat);
  };

  const executeDelete = () => {
    const cat = showDeleteConfirm;
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    showToast(`Category "${cat.name}" has been removed.`, 'error');
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Service Categories <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Configure service divisions, base icons, description structures, and track totals.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/10"
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500/50 focus:bg-white/10 placeholder-zinc-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-2 flex items-center gap-1.5"><Filter size={13} /> Filter:</span>
          {['All', 'Active', 'Inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Services</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-zinc-500 py-12 text-xs italic">No categories found matching criteria.</td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl leading-none w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">{cat.icon || '📂'}</span>
                        <span className="text-white text-xs font-bold">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs max-w-xs truncate hidden md:table-cell">{cat.desc}</td>
                    <td className="px-6 py-4 text-zinc-300 text-xs font-mono font-bold">{cat.services}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        cat.status === 'Active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-zinc-700/20 text-zinc-400 border-white/10'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEdit(cat)} 
                          title="Edit Parameters"
                          className="p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => attemptDelete(cat)} 
                          title="Delete Category"
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
      </div>

      {/* Save Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="w-full max-w-md bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{modal === 'add' ? 'Add New Category' : 'Edit Category'}</h3>
              <button onClick={closeModal} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-zinc-500 text-xs font-bold block mb-1.5">Category Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Plumbing"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold block mb-1.5">Select Icon</label>
                <div className="grid grid-cols-8 gap-2 p-3 bg-black/35 rounded-xl border border-white/5 max-h-24 overflow-y-auto">
                  {emojiPool.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setForm({ ...form, icon: em })}
                      className={`text-lg p-1.5 rounded-lg transition-all hover:bg-white/10 cursor-pointer ${
                        form.icon === em ? 'bg-blue-600/30 border border-blue-500 text-white scale-110 shadow-lg' : 'border border-transparent'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold block mb-1.5">Description</label>
                <textarea
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  rows={3}
                  placeholder="Short explanation of scope..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-xs font-bold block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                >
                  <option value="Active" className="bg-[#0e162c]">Active</option>
                  <option value="Inactive" className="bg-[#0e162c]">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10">
                  <Check size={14} /> Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Warning */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[#0e162c] border border-white/10 rounded-[32px] p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertCircle size={20} />
              <h3 className="font-bold text-lg">Remove Category?</h3>
            </div>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Confirm removal of category <span className="text-white font-bold">{showDeleteConfirm.name}</span>. This removes it from registry selection indices. Action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs cursor-pointer">Cancel</button>
              <button 
                onClick={executeDelete} 
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/10"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCategories;
