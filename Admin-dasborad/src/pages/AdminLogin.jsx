import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://yash-collections-backend.vercel.app/api';
// Admin email from environment variable (MUST be set in .env.local)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yashcollections.com';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const user = data.data?.user;
      if (user?.role !== 'admin') {
        throw new Error('Access denied. Admin only.');
      }

      const rawToken = data.data?.token || '';
      const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
      localStorage.setItem('authToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: '#f5f7fa',
    }}>
      {/* LEFT SIDE - DARK BRANDING */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2f3e 50%, #0d3d4a 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '60px 50px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', width: '600px', height: '600px',
            borderRadius: '50%', bottom: '-200px', left: '-200px',
            background: 'radial-gradient(circle, rgba(29,187,204,0.12) 0%, transparent 70%)',
          }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>
          {/* Logo */}
          <h1 style={{
            color: '#ffffff',
            fontSize: '36px',
            fontWeight: '900',
            margin: '0 0 40px',
            letterSpacing: '-1px',
          }}>
            Yash<span style={{ color: '#1dbbcc' }}>Collections</span>
          </h1>

          {/* Tagline */}
          <p style={{
            color: '#b6d4e2',
            fontSize: '16px',
            lineHeight: '1.7',
            marginBottom: '50px',
            fontWeight: '400',
          }}>
            Welcome back to your premium admin portal. Access exclusive collections, manage your bulk orders, and scale your business effortlessly.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', color: '#b6d4e2' }}>
              <svg width="20" height="20" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>Verified Admin Portal Only</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', color: '#b6d4e2' }}>
              <svg width="20" height="20" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>Secure & Encrypted Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div style={{
        flex: 1,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 50px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{
              fontSize: '30px',
              fontWeight: '800',
              color: '#1b2f3e',
              margin: '0 0 10px',
              letterSpacing: '-0.5px',
            }}>
              Admin Login
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#70a0b5',
              margin: 0,
              fontWeight: '500',
            }}>
              Securely log in to access your wholesale dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '700',
                color: '#1b2f3e',
                marginBottom: '8px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                Email Address
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#f8fbfd',
                border: '1px solid #e5edf2',
                borderRadius: '8px',
                padding: '13px 14px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#d0dce6';
                e.currentTarget.style.background = '#f2f8fb';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5edf2';
                e.currentTarget.style.background = '#f8fbfd';
              }}>
                <svg width="16" height="16" fill="none" stroke="#b6d4e2" viewBox="0 0 24 24" strokeWidth="1.5" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={ADMIN_EMAIL}
                  disabled
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#70a0b5',
                    fontSize: '14px',
                    outline: 'none',
                    fontWeight: '500',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#1b2f3e',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  style={{ color: '#1dbbcc', fontSize: '12px', textDecoration: 'none', fontWeight: '600' }}
                >
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    background: '#f8fbfd',
                    border: '1px solid #e5edf2',
                    borderRadius: '8px',
                    padding: '13px 44px 13px 14px',
                    color: '#1b2f3e',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                    fontWeight: '500',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#d0dce6';
                    e.target.style.background = '#f2f8fb';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e5edf2';
                    e.target.style.background = '#f8fbfd';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#b6d4e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {showPw ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '20px',
                marginTop: '16px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 16px',
                background: loading ? '#bbb' : '#1b2f3e',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
                marginTop: '24px',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.opacity = '0.92'; }}
              onMouseLeave={e => { e.target.style.opacity = '1'; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Signing In...
                </span>
              ) : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #b6d4e2 !important; }
        
        @media (max-width: 768px) {
          div[style*="display: flex"][style*="flex: 1"] {
            flex: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
