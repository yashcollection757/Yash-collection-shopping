import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { uploadImage } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://yash-collections-backend.vercel.app/api' || 'http://localhost:5000/api';

export default function AdminBanners() {
  const [banners, setBanners] = useState({ banner1: '', banner2: '', banner3: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingObj, setUploadingObj] = useState({});

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('authToken') || '';
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/banners`, {
        headers: { 'Authorization': authHeader }
      });
      const data = await res.json();
      if (data.data?.banner) {
        setBanners({
          banner1: data.data.banner.banner1,
          banner2: data.data.banner.banner2,
          banner3: data.data.banner.banner3,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 300 * 1024) {
      alert('File size exceeds 300 KB limit. Please upload an image between 150KB and 300KB.');
      return;
    }

    try {
      setUploadingObj(prev => ({ ...prev, [key]: true }));
      const url = await uploadImage(file, 'banners');
      setBanners(prev => ({ ...prev, [key]: url }));
    } catch (err) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingObj(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken') || '';
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      await fetch(`${API_BASE_URL}/banners`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(banners),
      });
      alert('Banners saved successfully!');
    } catch (err) {
      alert('Failed to save banners');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout title="Banners Management"><div className="p-10 text-center font-bold" style={{color: '#70a0b5'}}>Loading Banners...</div></Layout>;
  }

  return (
    <Layout title="Banners Management">
      <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5edf2' }}>
        <h2 className="text-xl font-bold mb-6 text-gray-900">Update Storefront Banners</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { id: 'banner1', label: 'Main Banner (Sport Wear)', size: '600 × 800 px (Portrait)' },
            { id: 'banner2', label: 'Top Right Banner (Me Up Kids)', size: '400 × 400 px (Square)' },
            { id: 'banner3', label: 'Bottom Right Banner (Kids Fashion)', size: '400 × 400 px (Square)' }
          ].map(b => (
            <div key={b.id} className="border border-gray-200 rounded-xl p-4">
              <div className="mb-3">
                <p className="font-bold text-gray-800 text-sm">{b.label}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Recommended: {b.size} | Size: 150KB - 300KB</p>
              </div>
              <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4 relative border border-dashed border-gray-300">
                {uploadingObj[b.id] ? (
                  <span className="text-sm font-bold text-gray-500">Uploading...</span>
                ) : banners[b.id] ? (
                  <img src={banners[b.id]} alt={b.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-400">No Image</span>
                )}
              </div>
              <label className="cursor-pointer block text-center w-full bg-cyan-50 text-cyan-700 font-bold py-2 rounded-lg hover:bg-cyan-100 transition-colors text-sm">
                {uploadingObj[b.id] ? 'Please wait...' : 'Upload Image'}
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, b.id)} disabled={uploadingObj[b.id]} />
              </label>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Banners'}
        </button>
      </div>
    </Layout>
  );
}
