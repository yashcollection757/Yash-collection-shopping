import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api.js';

const SignUp = () => {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        throw new Error('Please fill in all required fields');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address.');
      }

      const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        throw new Error('Please enter a valid 10-digit Indian phone number.');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      await authAPI.register(formData);

      setSuccessMsg('Registration successful! Your account is pending admin approval.');
      setError('');
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-[#0f2130] via-[#1b3a52] to-[#0a1628] font-sans relative overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-4xl min-h-[580px] flex rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 bg-white/5 backdrop-blur-xl border border-white/10 flex-col lg:flex-row">
        
        {/* Left Side (Visuals) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-8 relative overflow-hidden bg-gradient-to-br from-brand-900/80 to-brand-800/90 border-r border-white/10">
          <div className="relative z-10">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-black text-white tracking-tight">Yash<span className="text-accent-cyan">Collections</span></h1>
            </Link>
            <p className="mt-6 text-brand-100 text-lg font-medium leading-relaxed max-w-md">
              Join our exclusive B2B network. Get access to wholesale pricing, premium collections, and priority support.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              Wholesale Pricing Access
            </div>
            <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              Dedicated Account Manager
            </div>
            <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              Bulk Order Discounts
            </div>
          </div>
          
          {/* Abstract graphic overlay */}
          <div className="absolute left-[-20%] bottom-[-20%] opacity-20 pointer-events-none">
            <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#1dbbcc" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.6,-46.7C91.4,-34.3,98,-19.6,98.6,-4.8C99.2,10,93.8,24.9,84.6,37.6C75.4,50.3,62.4,60.8,48.5,69.5C34.6,78.2,19.8,85.1,4.4,80.3C-11,75.5,-27.1,59.1,-41.8,49.2C-56.5,39.3,-69.9,35.9,-78.9,26.5C-87.9,17.1,-92.5,1.7,-88.7,-11.6C-84.9,-24.9,-72.7,-36.1,-60.8,-45.5C-48.9,-54.9,-37.3,-62.5,-24.5,-70.7C-11.7,-78.9,2.3,-87.7,16.5,-85.4C30.7,-83.1,44.7,-76.4" transform="translate(100 100) scale(1.1)" />
            </svg>
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 bg-white flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            
            <div className="lg:hidden text-center mb-10">
              <Link to="/" className="inline-block">
                <h1 className="text-3xl font-black text-brand-900 tracking-tight">Yash<span className="text-accent-cyan">Collections</span></h1>
              </Link>
            </div>

            {successMsg ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 border border-green-200 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-brand-900 mb-3">Application Submitted!</h3>
                <p className="text-brand-500 text-base mb-8 max-w-sm mx-auto leading-relaxed">{successMsg}</p>
                <Link to="/login" className="inline-block px-10 py-4 bg-brand-900 hover:bg-brand-800 text-white rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(27,47,62,0.15)] hover:shadow-[0_15px_25px_rgba(27,47,62,0.25)] hover:-translate-y-0.5 uppercase text-sm tracking-widest">
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-brand-900 mb-1">Create Partner Account</h2>
                <p className="text-brand-500 text-sm mb-6 font-medium">Fill in your details to apply for a B2B partner account.</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm font-medium flex items-start shadow-sm">
                    <svg className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-accent-cyan focus:ring-4 focus:ring-accent-cyan/10 text-brand-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">Phone Number</label>
                      <div className="flex items-center w-full rounded-xl border border-gray-200 focus-within:border-accent-cyan focus-within:ring-4 focus-within:ring-accent-cyan/10 bg-gray-50/50 focus-within:bg-white transition-all shadow-sm overflow-hidden">
                        
                        {/* Prefix Block */}
                        <div className="flex items-center justify-center pl-4 pr-3 py-3.5 border-r border-gray-200">
                          <img src="https://flagcdn.com/w40/in.png" alt="India" className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm mr-2 shrink-0" />
                          <span className="text-sm font-bold text-brand-900 shrink-0">+91</span>
                        </div>
                        
                        {/* Input Block */}
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                            setFormData(prev => ({ ...prev, phone: val }));
                          }}
                          placeholder="98765 43210"
                          required
                          className="flex-1 w-full pl-3 pr-4 py-3.5 bg-transparent focus:outline-none text-brand-900 placeholder-gray-400 text-sm font-medium tracking-wide"
                        />
                      </div>
                  </div>

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="partner@company.com"
                        required
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-accent-cyan focus:ring-4 focus:ring-accent-cyan/10 text-brand-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-xs font-bold text-brand-900 mb-2 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-brand-400 group-focus-within:text-accent-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </div>
                      <input
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters"
                        required
                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-accent-cyan focus:ring-4 focus:ring-accent-cyan/10 text-brand-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white transition-all text-sm font-medium shadow-sm"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-900 transition-colors p-1">
                        {showPass
                          ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="relative w-full bg-brand-900 hover:bg-brand-800 text-white font-bold tracking-wide py-3.5 rounded-xl transition-all duration-300 shadow-[0_10px_20px_rgba(27,47,62,0.15)] hover:shadow-[0_15px_25px_rgba(27,47,62,0.25)] hover:-translate-y-0.5 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <p className="text-sm font-medium text-brand-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent-cyan font-bold hover:text-brand-900 transition-colors ml-1">Log In</Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
