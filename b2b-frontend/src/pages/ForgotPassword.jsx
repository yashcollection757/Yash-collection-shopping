import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.js';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPasswordOtp(email);
      setSuccess('OTP has been sent to your email. Check your inbox!');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPasswordWithOtp({ email, otp, newPassword });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful. Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await authAPI.forgotPasswordOtp(email);
      setSuccess('New OTP has been sent to your email!');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-accent-cyan focus:ring-4 focus:ring-accent-cyan/10 text-brand-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium shadow-sm";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#0f2130] via-[#1b3a52] to-[#0a1628] font-sans relative overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-cyan/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-4xl min-h-[580px] flex rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 bg-white/5 backdrop-blur-xl border border-white/10 flex-col lg:flex-row">
        
        {/* Left Side - Branding & Visuals */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-8 relative overflow-hidden bg-gradient-to-br from-brand-900/80 to-brand-800/90 border-r border-white/10">
          <div className="relative z-10">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-black text-white tracking-tight">Yash<span className="text-accent-cyan">Collections</span></h1>
            </Link>
            <p className="mt-6 text-brand-100 text-lg font-medium leading-relaxed max-w-md">
              Securely reset your password and regain access to your B2B wholesale portal.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
              <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Two-Step Verification
            </div>
            <div className="flex items-center gap-4 text-white/90 text-sm font-medium mt-3">
              <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Secure Password Reset
            </div>
          </div>
          
          {/* Abstract graphic overlay */}
          <div className="absolute right-[-20%] bottom-[-20%] opacity-20 pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#1dbbcc" d="M39.9,-55.3C52.7,-49.2,64.8,-39.9,71.4,-27.6C78,-15.3,79.1,-0.1,75.2,13.2C71.3,26.5,62.4,37.9,50.7,45.4C39,52.9,24.5,56.5,10.6,58.7C-3.3,60.9,-16.6,61.7,-30.2,58.3C-43.8,54.9,-57.7,47.3,-65.4,35.2C-73.1,23.1,-74.6,6.5,-71.4,-8.6C-68.2,-23.7,-60.3,-37.3,-48.8,-44.6C-37.3,-51.9,-22.2,-52.9,-8.6,-57C5,-61.1,27.1,-61.4,39.9,-55.3Z" transform="translate(100 100) scale(1.1)" />
            </svg>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 bg-white flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            
            {/* Mobile Logo (hidden on desktop) */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-block">
                <h1 className="text-3xl font-black text-brand-900 tracking-tight">Yash<span className="text-accent-cyan">Collections</span></h1>
              </Link>
            </div>

            {/* Header section (replaces old header) */}
            <div className="mb-6 text-center lg:text-left">
              <div className="hidden lg:flex w-12 h-12 bg-accent-cyan/10 rounded-xl items-center justify-center border border-accent-cyan/20 mb-4">
                <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-brand-900 mb-1">Reset Password</h2>
              <p className="text-brand-500 text-sm font-medium">
                {step === 1 && "Enter your email to receive a verification code"}
                {step === 2 && "Enter the OTP and set your new password"}
              </p>

              {/* Step indicator */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mt-5">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? 'bg-accent-cyan text-white' : 'bg-gray-100 text-gray-400'
                    }`}>{s}</div>
                    {s < 2 && <div className={`w-8 h-0.5 ${step > 1 ? 'bg-accent-cyan' : 'bg-gray-100'}`}></div>}
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm font-medium flex items-start shadow-sm">
                <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg text-green-800 text-sm font-medium flex items-center shadow-sm">
                <svg className="w-5 h-5 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {success}
              </div>
            )}

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="Enter your registered email"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full bg-brand-900 hover:bg-brand-800 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all duration-300 shadow-[0_10px_20px_rgba(27,47,62,0.15)] hover:shadow-[0_15px_25px_rgba(27,47,62,0.25)] hover:-translate-y-0.5 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    'Send OTP →'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP + New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">OTP Code</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').substring(0, 6)); setError(''); }}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      required
                      className={`${inputClass} tracking-[0.5em] text-center font-bold text-lg`}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Sent to: <span className="font-bold text-brand-900">{email}</span></p>
                    <button type="button" onClick={handleResendOtp} disabled={loading}
                      className="text-xs font-bold text-accent-cyan hover:text-brand-900 transition-colors disabled:opacity-50">
                      Resend OTP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Min 6 characters"
                      required
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-900 transition-colors p-1">
                      {showPass
                        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18Z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Re-enter password"
                      required
                      className={inputClass}
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 font-medium">Passwords don't match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword !== confirmPassword}
                  className="relative w-full bg-brand-900 hover:bg-brand-800 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all duration-300 shadow-[0_10px_20px_rgba(27,47,62,0.15)] hover:shadow-[0_15px_25px_rgba(27,47,62,0.25)] hover:-translate-y-0.5 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting Password...
                    </span>
                  ) : (
                    '🔐 Reset Password'
                  )}
                </button>
              </form>
            )}

            {/* Back to login */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              <Link to="/login" className="text-sm font-bold text-accent-cyan hover:text-brand-900 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
