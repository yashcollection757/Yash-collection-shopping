import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, authAPI } from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    orderNote: '',
  });

  const statesInIndia = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handlePincodeChange = async (pincode) => {
    setFormData(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            city: postOffice.District,
            state: postOffice.State
          }));
        }
      } catch (error) {
        console.error('Pincode lookup failed', error);
      }
    }
  };

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const MIN_ORDER_QTY = 18;
  const MAX_ORDER_VALUE = 67000;

  const handleSelectAddress = (addr) => {
    if (!addr) return;
    setSelectedAddressId(addr.id);
    setFormData(prev => ({
      ...prev,
      name: addr.name || prev.name,
      email: addr.email || prev.email,
      phone: addr.phone || prev.phone,
      businessName: addr.businessName || prev.businessName,
      gstNumber: addr.gstNumber || prev.gstNumber,
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || ''
    }));
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      const items = saved ? JSON.parse(saved) : [];
      setCartItems(items);

      // Verify limits
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (items.length === 0 || totalItems < MIN_ORDER_QTY || subtotal > MAX_ORDER_VALUE) {
        navigate('/cart');
      }
    } catch (e) {
      navigate('/cart');
    }

    const fetchProfile = async () => {
      try {
        let user = JSON.parse(localStorage.getItem('user') || '{}');
        let addresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        
        // Initial setup from localStorage
        setSavedAddresses(addresses);
        if (user.name) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            businessName: user.businessName || '',
          }));
        }

        const token = localStorage.getItem('token');
        if (token) {
          const res = await authAPI.getProfile();
          if (res?.data?.user) {
            user = res.data.user;
            addresses = user.addresses || [];
            
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('savedAddresses', JSON.stringify(addresses));
            
            setSavedAddresses(addresses);
            setFormData(prev => ({
              ...prev,
              name: prev.name || user.name || '',
              email: prev.email || user.email || '',
              phone: prev.phone || user.phone || '',
              businessName: prev.businessName || user.businessName || '',
            }));
            
            if (addresses.length > 0) {
              handleSelectAddress(addresses[0]);
            }
          }
        } else if (addresses.length > 0) {
          handleSelectAddress(addresses[0]);
        }
      } catch (err) {
        console.warn('Failed to fetch latest profile:', err);
      }
    };
    fetchProfile();
  }, [navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 200;
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.name || !formData.email || !formData.phone || !formData.businessName || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      showToast('error', 'Please fill all the required address fields before placing the order.');
      return;
    }
    
    const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      showToast('error', 'Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (formData.pincode.replace(/\D/g, '').length !== 6) {
      showToast('error', 'Please enter a valid 6-digit Pincode.');
      return;
    }
    if (formData.gstNumber && formData.gstNumber.length !== 15) {
      showToast('error', 'Please enter a valid 15-character GST Number.');
      return;
    }

    // Check login token
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('error', 'Please login to place an order.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      // Call backend to save order in MongoDB
      const response = await orderAPI.createOrder({
        items: cartItems,
        shippingAddress: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          businessName: formData.businessName,
          gstNumber: formData.gstNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        paymentMethod: 'cod',
        subtotal,
        shipping,
        total,
        orderNote: formData.orderNote,
      });

      const savedOrder = response.data?.order || {};

      // Also save to localStorage for immediate display on profile page
      const localOrder = {
        id: savedOrder.orderNumber || `#${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
        _id: savedOrder._id,
        date: savedOrder.createdAt || new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shipTo: `${formData.city}, ${formData.state}, India`,
        total: total,
        items: cartItems,
        status: 'Pending',
      };

      const existingOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
      localStorage.setItem('myOrders', JSON.stringify([localOrder, ...existingOrders]));

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      setOrderSuccess({
        orderId: savedOrder.orderNumber || localOrder.id,
        total: total,
        itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      });

    } catch (err) {
      console.error('Order placement error:', err);
      showToast('error', err.message || 'Failed to place order. Please try again.');
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen pt-20">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full px-5 py-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
          toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : 'bg-white border-red-200 text-red-800'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            )}
          </div>
          <div>
            <p className="font-bold text-sm">{toast.type === 'success' ? 'Success' : 'Error'}</p>
            <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Order Success Popup Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 text-center relative overflow-hidden" style={{ animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            
            {/* Confetti dots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute rounded-full" style={{
                  width: `${6 + Math.random() * 8}px`,
                  height: `${6 + Math.random() * 8}px`,
                  background: ['#1dbbcc', '#f2823a', '#22c55e', '#a855f7', '#f43f5e', '#3b82f6'][i % 6],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: 0.15 + Math.random() * 0.2,
                  animation: `confettiFall ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }} />
              ))}
            </div>

            {/* Success Icon */}
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center" style={{ animation: 'bounceIn 0.6s ease 0.2s both' }}>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: 'checkDraw 0.5s ease 0.6s forwards' }} />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed Successfully! 🎉</h2>
              <p className="text-gray-500 text-sm mb-6">Thank you for your order. We'll notify you once it ships.</p>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Order ID</span>
                  <span className="text-sm font-black text-gray-900">{orderSuccess.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Items</span>
                  <span className="text-sm font-bold text-gray-700">{orderSuccess.itemCount} items</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                  <span className="text-xs font-bold text-gray-500 uppercase">Total Amount</span>
                  <span className="text-lg font-black text-[#1dbbcc]">₹{orderSuccess.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex-1 bg-[#1b2f3e] text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
                >
                  Track Order
                </button>
                <button
                  onClick={() => navigate('/shop')}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
            @keyframes checkDraw { to { stroke-dashoffset: 0; } }
            @keyframes confettiFall { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(180deg); } }
          `}</style>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl">
        <h1 className="text-3xl font-black text-brand-900 mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8">
          {/* Left - Shipping Form */}
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-900 flex items-center justify-center text-sm">1</span>
                Shipping Address
              </h2>

              {savedAddresses.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Select Saved Address</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === addr.id ? 'border-brand-900 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-xs uppercase text-gray-900">{addr.title}</span>
                          {selectedAddressId === addr.id && <svg className="w-4 h-4 text-brand-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    ))}
                    <div 
                      onClick={() => {
                        setSelectedAddressId('');
                        setFormData(prev => ({ ...prev, address: '', city: '', state: '', pincode: '' }));
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer border-dashed flex items-center justify-center transition-all ${
                        selectedAddressId === '' ? 'border-brand-900 bg-brand-50 text-brand-900' : 'border-gray-300 text-gray-500 hover:border-brand-300'
                      }`}
                    >
                      <span className="text-sm font-bold">+ New Address</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 border-t pt-6 border-gray-100">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="Your Full Name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Email Address</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="name@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Phone Number</label>
                  <div className="flex items-center w-full px-4 py-3 rounded-xl border border-gray-200 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all bg-white">
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
                      required
                      className="flex-1 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 text-base tracking-wide min-w-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Business Name</label>
                  <input required type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="Your Company Ltd." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">GST Number</label>
                  <input required type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Complete Address</label>
                  <textarea required name="address" value={formData.address} onChange={handleInputChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all resize-none" placeholder="House No, Building, Street Name..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pincode</label>
                  <input required type="text" name="pincode" value={formData.pincode} onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').substring(0, 6))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="400001" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">State</label>
                  <select required name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all bg-white">
                    <option value="">Select State</option>
                    {statesInIndia.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="City" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Order Message / Special Instructions (Optional)</label>
                  <textarea name="orderNote" value={formData.orderNote} onChange={handleInputChange} rows="2" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all resize-none" placeholder="Any specific instructions for shipping or order?" />
                </div>
              </div>
            </div>
          </div>

          {/* Right - Summary */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Order Review</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-gray-100" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Size: {item.size} • Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-brand-900 mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-bold text-gray-900">{shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-gray-900 text-lg">Total</span>
                <span className="font-black text-2xl text-brand-900">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                PLACE ORDER
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
