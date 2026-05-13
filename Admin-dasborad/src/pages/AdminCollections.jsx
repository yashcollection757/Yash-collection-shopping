import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || 'https://yash-collections-backend.vercel.app/api' || 'http://localhost:5000/api';

const GRADIENT_OPTS = [
  'bg-gradient-to-br from-pink-100 to-purple-100',
  'bg-gradient-to-br from-blue-100 to-cyan-100',
  'bg-gradient-to-br from-pink-100 to-rose-100',
  'bg-gradient-to-br from-purple-100 to-indigo-100',
  'bg-gradient-to-br from-blue-100 to-slate-100',
  'bg-gradient-to-br from-amber-100 to-orange-100',
  'bg-gradient-to-br from-teal-100 to-green-100',
  'bg-gradient-to-br from-red-100 to-pink-100',
  'bg-gradient-to-br from-violet-100 to-purple-100',
];

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [editingCol, setEditingCol]   = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [deleteId, setDeleteId]       = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  /* ── Fetch all collections (admin route) ── */
  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/collections/admin/all`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch');
      setCollections(data.data?.collections || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCollections(); }, []);

  /* ── Open modal ── */
  const openAdd = () => {
    setEditingCol(null);
    setFormData({ name: '', description: '', isActive: true });
    setImageFile(null);
    setImagePreview('');
    setSaveError('');
    setShowModal(true);
  };

  const openEdit = (col) => {
    setEditingCol(col);
    setFormData({ name: col.name, description: col.description || '', isActive: col.isActive });
    setImageFile(null);
    setImagePreview(col.image || '');
    setSaveError('');
    setShowModal(true);
  };

  /* ── Image file select (1MB max, jpg/jpeg/png only) ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Format check
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setSaveError('Only JPG, JPEG, PNG images are allowed.');
      e.target.value = '';
      return;
    }

    // Size check — 300 KB
    const MAX_KB = 300;
    if (file.size > MAX_KB * 1024) {
      setSaveError(`Image must be less than ${MAX_KB} KB. Your file is ${(file.size / 1024).toFixed(0)} KB.`);
      e.target.value = '';
      return;
    }

    setSaveError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── Form change ── */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  /* ── Submit: create or update ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');

    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('isActive', formData.isActive);
      if (imageFile) fd.append('image', imageFile);

      const url    = editingCol
        ? `${API_BASE}/collections/${editingCol._id}`
        : `${API_BASE}/collections`;
      const method = editingCol ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: fd });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');

      await loadCollections();
      setShowModal(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCollections(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Layout title="Collections">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#1b2f3e' }}>Collections</h1>
          <p className="text-sm mt-1" style={{ color: '#70a0b5' }}>
            Manage product collections — changes reflect instantly on the B2B website.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
          style={{ background: '#1dbbcc' }}
        >
          + New Collection
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <p style={{ color: '#70a0b5' }} className="text-lg font-semibold">Loading collections…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={loadCollections}
            className="mt-3 px-5 py-2 rounded-xl font-semibold text-white text-sm"
            style={{ background: '#1dbbcc' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && collections.length === 0 && (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border" style={{ borderColor: '#e5edf2' }}>
          <p style={{ color: '#70a0b5' }} className="text-lg font-semibold mb-2">No collections yet</p>
          <p style={{ color: '#70a0b5' }} className="text-sm mb-6">Create your first collection to display on the B2B website.</p>
          <button
            onClick={openAdd}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: '#1dbbcc' }}
          >
            + New Collection
          </button>
        </div>
      )}

      {/* Collections Grid */}
      {!loading && !error && collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col, i) => (
            <div key={col._id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all" style={{ borderColor: '#e5edf2' }}>
              {/* Image */}
              <div className={`relative w-full h-48 overflow-hidden ${GRADIENT_OPTS[i % GRADIENT_OPTS.length]}`}>
                {col.image ? (
                  <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-black opacity-20" style={{ color: '#1b2f3e' }}>
                      {col.name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      col.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {col.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="text-lg font-black mb-1" style={{ color: '#1b2f3e' }}>{col.name}</h3>
                {col.description && (
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: '#70a0b5' }}>{col.description}</p>
                )}
                <p className="text-xs mb-4" style={{ color: '#b0c4d0' }}>
                  Created: {new Date(col.createdAt).toLocaleDateString('en-IN')}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(col)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:opacity-80"
                    style={{ borderColor: '#1dbbcc', color: '#1dbbcc' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(col._id)}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80"
                    style={{ background: '#e53e3e' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: '#e5edf2' }}>
              <h2 className="text-xl font-black" style={{ color: '#1b2f3e' }}>
                {editingCol ? 'Edit Collection' : 'New Collection'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-2xl leading-none"
                style={{ color: '#70a0b5' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#1b2f3e' }}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. GRS, OPEN, CORD SET"
                  required
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e5edf2', color: '#1b2f3e', focusRingColor: '#1dbbcc' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#1b2f3e' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short description of this collection"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none resize-none"
                  style={{ borderColor: '#e5edf2', color: '#1b2f3e' }}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#1b2f3e' }}>
                  Collection Image
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 transition-colors"
                  style={{ borderColor: '#e5edf2' }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  ) : (
                    <div className="py-6">
                      <p className="text-sm font-semibold" style={{ color: '#70a0b5' }}>
                        Click to upload image
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#b0c4d0' }}>JPG, JPEG, PNG only — size: 150KB - 300KB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="mt-2 text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-bold" style={{ color: '#1b2f3e' }}>
                  Active (visible on B2B website)
                </label>
              </div>

              {/* Error */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold">
                  {saveError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#1dbbcc' }}
                >
                  {saving ? 'Saving…' : editingCol ? 'Update Collection' : 'Create Collection'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all"
                  style={{ borderColor: '#e5edf2', color: '#1b2f3e' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <p className="font-black text-lg mb-2" style={{ color: '#1b2f3e' }}>Delete Collection?</p>
            <p className="text-sm mb-6" style={{ color: '#70a0b5' }}>
              This will permanently delete the collection and its image from Cloudinary.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl font-bold text-sm border-2"
                style={{ borderColor: '#e5edf2', color: '#1b2f3e' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 rounded-xl font-bold text-sm text-white"
                style={{ background: '#e53e3e' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
