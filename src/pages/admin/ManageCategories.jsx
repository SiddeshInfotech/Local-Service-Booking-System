import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, X, Check, Sparkles, AlertCircle, Filter, Loader2 } from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const EMPTY = { name: '', icon: '🔧', desc: '', status: 'Active' };

const emojiPool = ['🔧', '⚡', '🧹', '🪚', '🐛', '❄️', '🎨', '🔑', '🏠', '🚗', '📦', '💻', '🩺', '👔', '✂️', '🧱'];

const ManageCategories = () => {
  const { showToast } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { ...category }
  const [form, setForm] = useState(EMPTY);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdmin('/api/admin/categories');
      const data = await res.json();
      if (res.ok && data.status) {
        // Map database categories to UI structure
        const mapped = data.categories.map((c) => ({
          id: c.category_id,
          name: c.category_name,
          icon: c.category_icon || '📁',
          desc: c.description || '',
          status: c.status || 'Active',
          services: c.services_count || 0 // Backend might return counts, let's fall back to 0
        }));
        setCategories(mapped);
      } else {
        showToast(data.message || 'Failed to load categories.', 'error');
      }
    } catch {
      showToast('Server error loading categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = categories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.desc.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (cat) => { setForm({ name: cat.name, icon: cat.icon, desc: cat.desc, status: cat.status }); setModal(cat); };
  const closeModal = () => setModal(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      if (modal === 'add') {
        const res = await apiFetchAdmin('/api/category', {
          method: 'POST',
          body: JSON.stringify({
            category_name: form.name,
            category_icon: form.icon,
            description: form.desc
          })
        });
        const data = await res.json();
        if (res.ok && data.status) {
          showToast(`Category "${form.name}" has been created.`, 'success');
          fetchCategories();
          closeModal();
        } else {
          showToast(data.message || 'Failed to create category.', 'error');
        }
      } else {
        const res = await apiFetchAdmin(`/api/category/${modal.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            category_name: form.name,
            category_icon: form.icon,
            description: form.desc,
            status: form.status
          })
        });
        const data = await res.json();
        if (res.ok && data.status) {
          showToast(`Category "${form.name}" has been updated.`, 'success');
          fetchCategories();
          closeModal();
        } else {
          showToast(data.message || 'Failed to update category.', 'error');
        }
      }
    } catch {
      showToast('Server error saving category.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const attemptDelete = (cat) => {
    setShowDeleteConfirm(cat);
  };

  const executeDelete = async () => {
    const cat = showDeleteConfirm;
    setActionLoading(true);
    try {
      const res = await apiFetchAdmin(`/api/category/${cat.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.status) {
        showToast(`Category "${cat.name}" status set to Inactive.`, 'error');
        fetchCategories();
      } else {
        showToast(data.message || 'Failed to delete category.', 'error');
      }
    } catch {
      showToast('Server error deleting category.', 'error');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 text-left relative z-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            Service Categories <Sparkles className="text-blue-400 w-5 h-5 animate-pulse" />
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Configure service divisions, base icons, description structures, and track totals.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-[var(--color-text-primary)] text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-500/10"
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500/50 focus:bg-[var(--color-overlay-hover)] placeholder-zinc-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider mr-2 flex items-center gap-1.5"><Filter size={13} /> Filter:</span>
          {['All', 'Active', 'Inactive'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                filter === f
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-secondary-bg)]">
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-[var(--color-text-secondary)] py-12 text-xs italic">No categories found matching criteria.</td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-[var(--color-border-subtle)] hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl leading-none w-8 h-8 rounded-xl bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center shadow-inner">{cat.icon || '📂'}</span>
                        <span className="text-[var(--color-text-primary)] text-xs font-bold">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] text-xs max-w-xs truncate hidden md:table-cell">{cat.desc}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        cat.status === 'Active'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-[var(--color-zinc-700)]/20 text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEdit(cat)} 
                          title="Edit Parameters"
                          className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => attemptDelete(cat)} 
                          title="Deactivate Category"
                          className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
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
          <div className="w-full max-w-md bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[var(--color-text-primary)] font-bold text-lg">{modal === 'add' ? 'Add New Category' : 'Edit Category'}</h3>
              <button onClick={closeModal} className="p-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-subtle)] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[var(--color-text-secondary)] text-xs font-bold block mb-1.5">Category Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Plumbing"
                  required
                  className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[var(--color-text-secondary)] text-xs font-bold block mb-1.5">Select Icon</label>
                <div className="grid grid-cols-8 gap-2 p-3 bg-[var(--color-secondary-bg)]/35 rounded-xl border border-[var(--color-border-subtle)] max-h-24 overflow-y-auto">
                  {emojiPool.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setForm({ ...form, icon: em })}
                      className={`text-lg p-1.5 rounded-lg transition-all hover:bg-[var(--color-overlay-hover)] cursor-pointer ${
                        form.icon === em ? 'bg-blue-600/30 border border-blue-500 text-[var(--color-text-primary)] scale-110 shadow-lg' : 'border border-transparent'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[var(--color-text-secondary)] text-xs font-bold block mb-1.5">Description</label>
                <textarea
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  rows={3}
                  placeholder="Short explanation of scope..."
                  className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[var(--color-text-secondary)] text-xs font-bold block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[var(--color-overlay-subtle)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs px-3 py-2.5 focus:border-blue-500/50 outline-none"
                >
                  <option value="Active" className="bg-[var(--color-primary-bg)]">Active</option>
                  <option value="Inactive" className="bg-[var(--color-primary-bg)]">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[var(--color-text-primary)] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10">
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Warning */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-sm bg-[var(--color-card-bg)] border border-[var(--color-border-subtle)] rounded-[32px] p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertCircle size={20} />
              <h3 className="font-bold text-lg">Deactivate Category?</h3>
            </div>
            <p className="text-[var(--color-text-secondary)] text-xs mt-2 leading-relaxed">
              Confirm deactivation of category <span className="text-[var(--color-text-primary)] font-bold">{showDeleteConfirm.name}</span>. This sets its status to Inactive.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-xs cursor-pointer">Cancel</button>
              <button 
                onClick={executeDelete} 
                disabled={actionLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-[var(--color-text-primary)] font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/10 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCategories;
