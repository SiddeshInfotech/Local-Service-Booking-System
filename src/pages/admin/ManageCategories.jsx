import React, { useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';

const initialCategories = [
  { id: 1, name: 'Plumbing',     icon: '🔧', services: 14, status: 'Active',   desc: 'Pipe fitting, leaks, drainage and water-related repairs.' },
  { id: 2, name: 'Electrician',  icon: '⚡', services: 11, status: 'Active',   desc: 'Wiring, switch boards, appliance installation.' },
  { id: 3, name: 'Cleaning',     icon: '🧹', services: 9,  status: 'Active',   desc: 'Home, office and deep cleaning services.' },
  { id: 4, name: 'Carpentry',    icon: '🪚', services: 8,  status: 'Active',   desc: 'Furniture assembly, wood work and repairs.' },
  { id: 5, name: 'Pest Control', icon: '🐛', services: 6,  status: 'Inactive', desc: 'Termite, rodent and insect eradication.' },
  { id: 6, name: 'AC Repair',    icon: '❄️', services: 7,  status: 'Active',   desc: 'Installation, service and gas refilling for ACs.' },
  { id: 7, name: 'Painting',     icon: '🎨', services: 5,  status: 'Active',   desc: 'Interior, exterior and texture painting.' },
  { id: 8, name: 'Locksmith',    icon: '🔑', services: 4,  status: 'Inactive', desc: 'Lock repair, key duplication and door locks.' },
];

const EMPTY = { name: '', icon: '', desc: '', status: 'Active' };

const ManageCategories = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | { ...category }
  const [form, setForm] = useState(EMPTY);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (cat) => { setForm({ name: cat.name, icon: cat.icon, desc: cat.desc, status: cat.status }); setModal(cat); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (modal === 'add') {
      setCategories((prev) => [...prev, { id: Date.now(), ...form, services: 0 }]);
    } else {
      setCategories((prev) => prev.map((c) => c.id === modal.id ? { ...c, ...form } : c));
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Categories</h1>
          <p className="text-zinc-500 text-sm mt-1">Add, edit or remove service categories.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-[#0B1220]/40">
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Services</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-zinc-500 py-10">No categories found.</td></tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none w-7 text-center">{cat.icon || '📂'}</span>
                        <span className="text-white text-sm font-medium">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs max-w-xs truncate hidden md:table-cell">{cat.desc}</td>
                    <td className="px-5 py-4 text-zinc-300 text-xs">{cat.services}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        cat.status === 'Active'
                          ? 'bg-green-500/15 text-green-400 border-green-500/20'
                          : 'bg-zinc-700/30 text-zinc-400 border-zinc-700'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0B1220] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">{modal === 'add' ? 'Add New Category' : 'Edit Category'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Category Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Plumbing"
                  className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Icon (emoji)</label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g. 🔧"
                  className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Description</label>
                <textarea
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  rows={3}
                  placeholder="Short description..."
                  className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Check size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;
