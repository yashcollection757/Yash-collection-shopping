import React from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';

export default function Layout({ title, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#f4f7fa' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col" style={{ marginLeft: '224px' }}>
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-30" style={{ borderColor: '#e5edf2' }}>
          <h1 className="text-lg font-black" style={{ color: '#1b2f3e' }}>{title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold" style={{ color: '#3e6b82' }}>Welcome, <span style={{ color: '#1b2f3e' }}>Admin</span></span>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold px-5 py-2 rounded-xl border-2 transition-all hover:bg-brand-900 hover:text-white"
              style={{ borderColor: '#1b2f3e', color: '#1b2f3e' }}
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
