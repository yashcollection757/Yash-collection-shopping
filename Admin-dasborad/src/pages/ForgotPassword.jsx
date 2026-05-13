import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://yash-collections-backend.vercel.app/api';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yashcollections.com';

export default function ForgotPassword() {
  // Step 1: Send OTP, Step 2: Verify OTP, Step 3: New Password, Step 4: Success
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      setStep(2);
      setSuccessMessage('OTP sent to your email! Valid for 15 minutes.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP only
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (otp.length !== 6) {
      return setError('OTP must be 6 digits');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      setStep(3);
      setSuccessMessage('OTP verified! Now set your new password.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          otp: otp,
          newPassword: password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step indicator icons
  const stepData = [
    { num: 1, label: 'Send OTP' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'New Password' },
  ];

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Password';
      case 2: return 'Verify OTP';
      case 3: return 'New Password';
      case 4: return 'All Done!';
      default: return '';
    }
  };

  const getStepDesc = () => {
    switch (step) {
      case 1: return 'We will send an OTP to verify your identity';
      case 2: return 'Enter the 6-digit OTP sent to your email';
      case 3: return 'Choose a strong new password';
      case 4: return 'Your password has been reset successfully';
      default: return '';
    }
  };

  const getFormHandler = () => {
    switch (step) {
      case 1: return handleSendOtp;
      case 2: return handleVerifyOtp;
      case 3: return handleResetPassword;
      default: return (e) => e.preventDefault();
    }
  };

  const getButtonText = () => {
    if (loading) {
      switch (step) {
        case 1: return 'Sending OTP...';
        case 2: return 'Verifying...';
        case 3: return 'Resetting...';
        default: return '';
      }
    }
    switch (step) {
      case 1: return 'Send OTP →';
      case 2: return 'Verify OTP →';
      case 3: return 'Reset Password →';
      default: return '';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #0f2130 40%, #0d3d4a 100%)',
      padding: '16px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', width: '400px', height: '400px',
          borderRadius: '50%', top: '-100px', right: '-100px',
          background: 'radial-gradient(circle, rgba(29,187,204,0.12) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px',
          borderRadius: '50%', bottom: '-80px', left: '-80px',
          background: 'radial-gradient(circle, rgba(29,187,204,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(29,187,204,0.2)',
        borderRadius: '24px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Step Progress Bar */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '28px' }}>
            {stepData.map((s, i) => (
              <React.Fragment key={s.num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: '700',
                    background: step > s.num ? 'rgba(34,197,94,0.2)' : step === s.num ? 'linear-gradient(135deg, #1dbbcc, #0f9aab)' : 'rgba(255,255,255,0.08)',
                    color: step > s.num ? '#22c55e' : step === s.num ? '#fff' : '#9ab8c8',
                    border: step > s.num ? '1px solid rgba(34,197,94,0.4)' : step === s.num ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    transition: 'all 0.3s ease',
                  }}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: '600', color: step >= s.num ? '#1dbbcc' : '#9ab8c8',
                    letterSpacing: '0.3px', textTransform: 'uppercase',
                  }}>{s.label}</span>
                </div>
                {i < stepData.length - 1 && (
                  <div style={{
                    width: '40px', height: '2px', marginBottom: '20px',
                    background: step > s.num ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px', height: '60px',
            background: step === 4 ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, rgba(29,187,204,0.2), rgba(29,187,204,0.05))',
            border: step === 4 ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(29,187,204,0.3)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            {step === 4 ? (
              <svg width="28" height="28" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : step === 3 ? (
              <svg width="28" height="28" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : step === 2 ? (
              <svg width="28" height="28" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg width="28" height="28" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a3 3 0 00-3-3S9 4 9 7v2m3-4V7c0-1.657 1.343-3 3-3s3 1.343 3 3v2" />
              </svg>
            )}
          </div>
          <h1 style={{ color: '#ffffff', fontSize: '21px', fontWeight: '800', margin: '0 0 5px', letterSpacing: '-0.5px' }}>
            {getStepTitle()}
          </h1>
          <p style={{ color: '#9ab8c8', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
            {getStepDesc()}
          </p>
        </div>

        {/* Step 4: Success */}
        {step === 4 ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#9ab8c8', fontSize: '13px', margin: '0 0 24px', lineHeight: '1.6' }}>
              You can now log in with your new password.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #1dbbcc, #0f9aab)',
                color: '#ffffff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '700',
              }}
            >
              ← Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={getFormHandler()}>

            {/* Step 1: Admin Email (read-only) */}
            {step === 1 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9ab8c8', fontSize: '11px', fontWeight: '600', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Admin Email
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'rgba(29,187,204,0.06)',
                  border: '1px solid rgba(29,187,204,0.2)',
                  borderRadius: '12px',
                  padding: '11px 14px',
                }}>
                  <svg width="16" height="16" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span style={{ color: '#ffffff', fontSize: '14px', flex: 1 }}>{ADMIN_EMAIL}</span>
                </div>
              </div>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#9ab8c8', fontSize: '11px', fontWeight: '600', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Enter OTP (6 digits)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontSize: '22px',
                    letterSpacing: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    fontWeight: '700',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(29,187,204,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>
            )}

            {/* Step 3: Password Fields */}
            {step === 3 && (
              <>
                {/* New Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ab8c8', fontSize: '11px', fontWeight: '600', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '12px 44px 12px 16px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(29,187,204,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9ab8c8' }}>
                      {showPassword ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#9ab8c8', fontSize: '11px', fontWeight: '600', marginBottom: '7px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        padding: '12px 44px 12px 16px',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(29,187,204,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9ab8c8' }}>
                      {showConfirmPassword ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                marginBottom: '14px', padding: '10px 14px',
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="16" height="16" fill="none" stroke="#ef4444" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: '500' }}>{error}</span>
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div style={{
                marginBottom: '14px', padding: '10px 14px',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="16" height="16" fill="none" stroke="#22c55e" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: '#86efac', fontSize: '13px', fontWeight: '500' }}>{successMessage}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px 16px',
                background: loading ? 'rgba(29,187,204,0.4)' : 'linear-gradient(135deg, #1dbbcc, #0f9aab)',
                color: '#ffffff', borderRadius: '12px', border: 'none',
                fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(29,187,204,0.35)',
              }}
            >
              {getButtonText()}
            </button>

            {/* Back to login link */}
            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <Link
                to="/login"
                style={{
                  color: '#1dbbcc', fontSize: '13px', textDecoration: 'none',
                  fontWeight: '600', transition: 'color 0.3s ease',
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input::placeholder { color: rgba(154,184,200,0.5) !important; }
      `}</style>
    </div>
  );
}
