import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard',   path: '/dashboard',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/></svg> },
  { name: 'Users',       path: '/users',       icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { name: 'Orders',      path: '/orders',      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
  { name: 'Products',    path: '/products',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg> },
  { name: 'Collections', path: '/collections', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg> },
  { name: 'Banners',     path: '/banners',     icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); }
    catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col z-40" style={{ background: '#1b2f3e' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <img src="/images/logo1.png" alt="Yash Collection" className="h-12 w-auto object-contain" />
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(29,187,204,0.2)', color: '#1dbbcc' }}>Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 mb-3" style={{ color: '#70a0b5' }}>Main Menu</p>
        <ul className="space-y-1">
          {navItems.map(item => {
            const active = pathname === item.path;
            return (
              <li key={item.name}>
                <Link to={item.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: active ? 'rgba(29,187,204,0.15)' : 'transparent', color: active ? '#1dbbcc' : '#b6d4e2' }}>
                  <span style={{ color: active ? '#1dbbcc' : '#70a0b5' }}>{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin profile + Logout */}
      <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0" style={{ background: '#3e6b82' }}>
            {adminUser.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-bold leading-none truncate">{adminUser.name || 'Admin'}</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: '#70a0b5' }}>{adminUser.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:bg-red-500/10"
          style={{ color: '#e05555' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
