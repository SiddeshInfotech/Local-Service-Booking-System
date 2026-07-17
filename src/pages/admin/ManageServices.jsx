import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Plus, Pencil, Trash2, X, Check, IndianRupee, Loader2 } from 'lucide-react';
import { apiFetchAdmin } from '../../api';

const ManageServices = () => {
  const { showToast } = useOutletContext();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', categoryId: '', price: '', duration: '', status: 'Active', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, srvRes] = await Promise.all([
        apiFetchAdmin('/api/admin/categories'),
        apiFetchAdmin('/api/admin/services')
      ]);

      const catData = await catRes.json();
      const srvData = await srvRes.json();

      let fetchedCats = [];
      if (catRes.ok && catData.status) {
        fetchedCats = catData.categories || [];
        setCategories(fetchedCats);
      }

      if (srvRes.ok && srvData.status) {
        // Map services
        const mappedSrvs = srvData.services.map(s => {
          const cat = fetchedCats.find(c => c.category_id === s.category_id);
          return {
            id: s.service_id,
            name: s.service_name,
            categoryId: s.category_id,
            category: cat ? cat.category_name : 'General',
            price: s.base_price || s.estimated_price || 0,
            duration: s.estimated_duration || '1 hr',
            status: s.status || 'Active',
            description: s.description || ''
          };
        });
        setServices(mappedSrvs);
      }
    } catch {
      showToast('Error loading services data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || s.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { 
    setForm({ 
      name: '', 
      categoryId: categories[0]?.category_id || '', 
      price: '', 
      duration: '', 
      status: 'Active',
      description: ''
    }); 
    setModal('add'); 
  };

  const openEdit = (s) => { 
    setForm({ 
      name: s.name, 
      categoryId: s.categoryId, 
      price: s.price, 
      duration: s.duration, 
      status: s.status,
      description: s.description || ''
    }); 
    setModal(s); 
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Service name is required', 'error');
      return;
    }
    if (!form.categoryId) {
      showToast('Category is required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        category_id: Number(form.categoryId),
        service_name: form.name,
        description: form.description || '',
        estimated_price: Number(form.price) || 0,
        estimated_duration: form.duration || '1 hr',
        status: form.status
      };

      if (modal === 'add') {
        const res = await apiFetchAdmin('/api/service', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status) {
          showToast(`Service "${form.name}" added successfully.`, 'success');
          fetchData();
          closeModal();
        } else {
          showToast(data.message || 'Failed to add service.', 'error');
        }
      } else {
        const res = await apiFetchAdmin(`/api/service/${modal.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.status) {
          showToast(`Service "${form.name}" updated successfully.`, 'success');
          fetchData();
          closeModal();
        } else {
          showToast(data.message || 'Failed to update service.', 'error');
        }
      }
    } catch {
      showToast('Server error saving service.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this service?')) return;
    try {
      const res = await apiFetchAdmin(`/api/service/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.status) {
        showToast('Service deactivated.', 'error');
        fetchData();
      } else {
        showToast(data.message || 'Failed to deactivate service.', 'error');
      }
    } catch {
      showToast('Server error deactivating service.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Services</h1>
          <p className="text-zinc-500 text-sm mt-1">Add, edit or remove individual services.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
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
          <button
            onClick={() => setCatFilter('All')}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex-shrink-0 cursor-pointer ${
              catFilter === 'All'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.category_id}
              onClick={() => setCatFilter(c.category_name)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex-shrink-0 cursor-pointer ${
                catFilter === c.category_name
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600'
              }`}
            >
              {c.category_name}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Loader2 className="animate-spin text-blue-400 mx-auto" size={24} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
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
                        {Number(s.price).toLocaleString()}
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
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
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
              <button onClick={closeModal} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Service Name *', key: 'name', placeholder: 'e.g. Pipe Leak Repair', type: 'text' },
                { label: 'Price (₹) *', key: 'price', placeholder: 'e.g. 499', type: 'number' },
                { label: 'Duration', key: 'duration', placeholder: 'e.g. 1–2 hrs', type: 'text' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-zinc-400 text-xs font-medium block mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full bg-[#131b2e] border border-[#27272a] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Service description..."
                  rows={2}
                  className="w-full bg-[#131b2e] border border-[#27272a] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 placeholder-zinc-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full bg-[#131b2e] border border-[#27272a] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors"
                >
                  {categories.map((c) => <option key={c.category_id} value={c.category_id} className="bg-[#0b1220]">{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-zinc-400 text-xs font-medium block mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#131b2e] border border-[#27272a] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Active" className="bg-[#0b1220]">Active</option>
                  <option value="Inactive" className="bg-[#0b1220]">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm font-medium transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer">
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageServices;
