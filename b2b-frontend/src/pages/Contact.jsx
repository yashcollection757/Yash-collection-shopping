import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid 10-digit Indian phone number';
      }
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.length > 300) {
      newErrors.message = 'Message cannot exceed 300 characters';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setStatus({ type: '', message: '' });
    // Clear error for this field on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setStatus({ type: 'error', message: 'Please fix the errors above' });
      return;
    }

    setErrors({});
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Call backend API
      const response = await fetch(`${API_URL}/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim(),
          message: formData.message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit form');
      }

      // Success! Show success message
      setStatus({
        type: 'success',
        message: '✓ Message received! We will get back to you shortly.',
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        countryCode: '+91',
        phone: '',
        message: '',
      });

      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Top Section: Centered Form Area */}
        <div className="max-w-3xl mx-auto flex flex-col items-center mb-32">
          {/* Badge */}
          <div className="bg-brand-50 text-brand-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Contact Us
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight text-center">
            Let's Get In Touch.
          </h1>
          
          <p className="text-gray-500 text-lg mb-12 text-center">
            Or just reach out manually to <a href="mailto:yashcollection757@gmail.com" className="text-accent-cyan font-medium hover:underline">yashcollection757@gmail.com</a>.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            
            {status.message && (
              <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {status.message}
              </div>
            )}

            <div className="space-y-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name {errors.name && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name..." 
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all text-sm outline-none focus:ring-2 ${
                      errors.name 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address {errors.email && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address..." 
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border transition-all text-sm outline-none focus:ring-2 ${
                      errors.email 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number {errors.phone && <span className="text-red-500">*</span>}</label>
                <div className={`flex items-center w-full px-4 py-3.5 rounded-xl border transition-all bg-white ${
                  errors.phone 
                    ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100' 
                    : 'border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                }`}>
                  <div className="flex items-center gap-2 pr-3 pointer-events-none select-none">
                    <img src="https://flagcdn.com/w40/in.png" alt="India Flag" className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                    <span className="text-sm font-bold text-gray-700">+91</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setFormData(prev => ({ ...prev, phone: val }));
                    }}
                    placeholder="98765 43210"
                    className="flex-1 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 text-sm font-medium tracking-wide min-w-0"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message {errors.message && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Enter your main text here..." 
                    rows="5"
                    maxLength="300"
                    className={`w-full px-4 py-3.5 rounded-xl border transition-all text-sm resize-none outline-none focus:ring-2 ${
                      errors.message 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                    }`}
                  ></textarea>
                  <div className="absolute bottom-3 left-4 text-xs text-gray-400">{formData.message.length}/300</div>
                </div>
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isLoading || Object.keys(errors).length > 0 || !formData.name || !formData.email || !formData.phone || !formData.message}
                  className={`w-full font-bold py-4 rounded-xl transition-all duration-300 shadow-lg flex justify-center items-center gap-2 ${
                    isLoading || Object.keys(errors).length > 0 || !formData.name || !formData.email || !formData.phone || !formData.message
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-200'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Form
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </>
                  )}
                </button>
              </div>

            </div>
          </form>
        </div>

        {/* Bottom Section: Side by Side Info Cards */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start border-t border-gray-100 pt-24">
          
          {/* Left Text */}
          <div className="lg:w-1/3">
            <div className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-block">
              Reach Out To Us
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
              Send Us A Message.
            </h2>
            <p className="text-gray-500 text-lg">
              Or just reach out manually to <br/>
              <a href="mailto:yashcollection757@gmail.com" className="text-accent-cyan font-medium hover:underline">yashcollection757@gmail.com</a>.
            </p>
          </div>

          {/* Right Cards Grid */}
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            
            {/* Card 2 */}
            <div className="bg-[#f9fafc] p-8 rounded-3xl hover:shadow-md transition-shadow border border-transparent hover:border-gray-100">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-accent-orange mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Help Ticket</h3>
              <p className="text-gray-500 mb-6 text-sm">We're available to help via email.</p>
              <a href="mailto:yashcollection757@gmail.com" className="text-accent-cyan font-bold text-sm hover:underline">yashcollection757@gmail.com</a>
            </div>

            {/* Card 4 */}
            <div className="bg-[#f9fafc] p-8 rounded-3xl hover:shadow-md transition-shadow border border-transparent hover:border-gray-100">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-500 mb-6 text-sm">Mon-Fri from 9am to 6pm.</p>
              <a href="tel:190012345678" className="text-accent-cyan font-bold text-sm hover:underline">1900 - 123 456 78</a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;

