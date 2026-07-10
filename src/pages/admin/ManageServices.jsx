import React, { useState } from 'react';
import { Search, Filter, Plus, Pencil, Trash2, X, Check, IndianRupee } from 'lucide-react';

const categories = ['All', 'Cleaning', 'Plumbing', 'AC Repair', 'Carpenter', 'Electrician'];

const initialServices = [
  { id: 1,  name: 'Home Cleaning',          category: 'Cleaning',    price: 499,  duration: '2 hrs',   status: 'Active' },
  { id: 2,  name: 'Deep Cleaning',          category: 'Cleaning',    price: 999,  duration: '4 hrs',   status: 'Active' },
  { id: 3,  name: 'Tap Repair',             category: 'Plumbing',    price: 299,  duration: '1 hr',    status: 'Active' },
  { id: 4,  name: 'Pipe Leak Repair',       category: 'Plumbing',    price: 499,  duration: '1.5 hrs', status: 'Active' },
  { id: 5,  name: 'AC Service',             category: 'AC Repair',   price: 699,  duration: '1.5 hrs', status: 'Active' },
  { id: 6,  name: 'AC Installation',        category: 'AC Repair',   price: 1499, duration: '2.5 hrs', status: 'Active' },
  { id: 7,  name: 'Furniture Repair',       category: 'Carpenter',   price: 599,  duration: '2 hrs',   status: 'Active' },
  { id: 8,  name: 'Door Installation',      category: 'Carpenter',   price: 799,  duration: '3 hrs',   status: 'Active' },
  { id: 9,  name: 'Switchboard Repair',     category: 'Electrician', price: 399,  duration: '1 hr',    status: 'Active' },
  { id: 10, name: 'Fan Installation',       category: 'Electrician', price: 499,  duration: '1 hr',    status: 'Active' },
];

const EMPTY_SVC = { name: '', category: 'Plumbing', price: '', duration: '', status: 'Active' };

const ManageServices = () => {
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SVC);

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || s.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setForm(EMPTY_SVC); setModal('add'); };
  const openEdit = (s) => { setForm({ name: s.name, category: s.category, price: s.price, duration: s.duration, status: s.status }); setModal(s); };
  const closeModal = () => setModal(null);

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (modal === 'add') {
      setServices((prev) => [...prev, { id: Date.now(), ...form, price: Number(form.price) || 0 }]);
    } else {
      setServices((prev) => prev.map((s) => s.id === modal.id ? { ...s, ...form, price: Number(form.price) || 0 } : s));
    }
    closeModal();
  };

  const handleDelete = (id) => setServices((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Services</h1>
          <p className="text-zinc-500 text-sm mt-1">Add, edit or remove individual services.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={15} className="text-zinc-500 flex-shrink-0" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex-shrink-0 ${
                catFilter === c
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#131b2e]/50 border border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-[#0B1220]/40">
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Service</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Price</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell">Duration</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-zinc-500 text-xs font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-zinc-500 py-10">No services found.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-4 text-white text-xs font-medium">{s.name}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-0.5 text-white text-xs font-semibold">
                        <IndianRupee size={11} />
                        {s.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs hidden lg:table-cell">{s.duration}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        s.status === 'Active'
                          ? 'bg-green-500/15 text-green-400 border-green-500/20'
                          : 'bg-zinc-700/30 text-zinc-400 border-zinc-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
        <div className="px-5 py-3 border-t border-zinc-800/60">
          <p className="text-zinc-500 text-xs">Showing {filtered.length} of {services.length} services</p>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0B1220] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-base">{modal === 'add' ? 'Add New Service' : 'Edit Service'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Service Name *', key: 'name', placeholder: 'e.g. Pipe Leak Repair', type: 'text' },
                { label: 'Price (₹)', key: 'price', placeholder: 'e.g. 499', type: 'number' },
                { label: 'Duration', key: 'duration', placeholder: 'e.g. 1–2 hrs', type: 'text' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-zinc-400 text-xs font-medium block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-[#131b2e] border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors"
                >
                  {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
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
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium transition-colors">
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

export default ManageServices;
