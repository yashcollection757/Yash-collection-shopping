import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchAllUsers, deleteUserAdmin } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      setLoading(true);
      await deleteUserAdmin(id);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Failed to delete user');
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const matchFilter = filter === 'All'
      ? true
      : filter === 'Approved' ? u.isVerified : !u.isVerified;
    const matchSearch = search
      ? (u.name?.toLowerCase().includes(search.toLowerCase()) ||
         u.email?.toLowerCase().includes(search.toLowerCase()) ||
         u.phone?.includes(search))
      : true;
    return matchFilter && matchSearch;
  });

  const activeCount   = users.filter(u => u.isVerified).length;
  const inactiveCount = users.filter(u => !u.isVerified).length;

  return (
    <Layout title="User Management">
      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {['All', 'Approved', 'Pending'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all"
            style={{ background: filter===f ? '#1b2f3e' : 'white', color: filter===f ? 'white' : '#3e6b82', border: `2px solid ${filter===f ? '#1b2f3e' : '#e5edf2'}` }}>
            {f}
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
              {f === 'All' ? users.length : f === 'Approved' ? activeCount : inactiveCount}
            </span>
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="ml-auto px-4 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-300"
          style={{ borderColor: '#e5edf2', minWidth: '240px' }}
        />
      </div>

      {loading ? (
        <div className="p-10 text-center font-bold" style={{ color: '#70a0b5' }}>Loading users...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5edf2' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f4f7fa' }}>
                  {['#', 'Full Name', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#70a0b5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const joinDate = new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  return (
                    <tr key={u._id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0f5f8' }}>
                      <td className="px-5 py-4 text-xs font-bold" style={{ color: '#70a0b5' }}>{i + 1}</td>
                      <td className="px-5 py-4 font-bold text-xs whitespace-nowrap" style={{ color: '#1b2f3e' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                            style={{ background: '#1b2f3e' }}>
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {u.name || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#70a0b5' }}>{u.email}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#3e6b82' }}>{u.phone || '—'}</td>
                      <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: '#70a0b5' }}>{joinDate}</td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" 
                          style={{ background: u.isVerified ? 'rgba(29,187,204,0.12)' : 'rgba(229,138,62,0.12)', color: u.isVerified ? '#1dbbcc' : '#e58a3e' }}>
                          {u.isVerified ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button 
                          onClick={() => handleDelete(u._id)}
                          className="px-4 py-2 text-[11px] font-bold rounded-lg border transition-all hover:bg-red-50"
                          style={{ color: '#e53e3e', borderColor: '#e53e3e', background: 'transparent' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-400 font-bold">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
