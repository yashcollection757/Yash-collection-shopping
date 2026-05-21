import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, authAPI } from '../services/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedAddresses') || '[]'); } catch { return []; }
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ id: '', title: '', name: '', email: '', phone: '', alternatePhone: '', businessName: '', gstNumber: '', dob: '', anniversary: '', address: '', city: '', state: '', pincode: '', orderNote: '' });

  const statesInIndia = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handlePincodeChange = async (pincode) => {
    setAddressForm(prev => ({ ...prev, pincode }));
    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setAddressForm(prev => ({
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

  let storedUser = {};
  try {
    const data = localStorage.getItem('user');
    if (data && data !== 'undefined') {
      storedUser = JSON.parse(data);
    }
  } catch (e) {}

  const [userData, setUserData] = useState({
    name: storedUser.name || 'Guest User',
    email: storedUser.email || 'Not provided',
    phone: storedUser.phone || 'Not provided',
    joinDate: storedUser.createdAt || new Date().toISOString(),
    role: storedUser.role || 'customer',
  });

  const initial = userData.name.charAt(0).toUpperCase();

  const [orders, setOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('myOrders') || '[]'); } catch { return []; }
  });
  const [expandedOrders, setExpandedOrders] = useState({});

  // Fetch orders and profile from backend when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch user profile for addresses and details
    authAPI.getProfile()
      .then(res => {
        if (res.data?.user) {
          const u = res.data.user;
          setUserData({
            name: u.name || 'Guest User',
            email: u.email || 'Not provided',
            phone: u.phone || 'Not provided',
            joinDate: u.createdAt || new Date().toISOString(),
            role: u.role || 'customer',
          });
          localStorage.setItem('user', JSON.stringify(u));
          
          if (u.addresses) {
            setAddresses(u.addresses);
            localStorage.setItem('savedAddresses', JSON.stringify(u.addresses));
          }
        }
      })
      .catch(err => console.warn('Could not fetch profile:', err));

    orderAPI.getMyOrders()
      .then(res => {
        const backendOrders = (res.data?.orders || []).map(o => ({
          id: o.orderNumber || o._id,
          _id: o._id,
          date: o.createdAt,
          deliveryDate: new Date(new Date(o.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          shipTo: o.shippingAddress
            ? `${o.shippingAddress.city || ''}, ${o.shippingAddress.state || ''}, India`
            : 'N/A',
          total: o.totalPrice,
          items: (o.items || []).map(item => ({
            name: item.name,
            size: item.size,
            sku: item.sku,
            quantity: item.quantity,
            price: item.price,
            image: item.image || '/images/pro1.jpeg',
            color: item.color || 'Default',
          })),
          status: o.orderStatus === 'placed' ? 'Pending'
                : o.orderStatus === 'confirmed' ? 'Confirmed'
                : o.orderStatus === 'processing' ? 'Processing'
                : o.orderStatus === 'shipped' ? 'Shipped'
                : o.orderStatus === 'delivered' ? 'Delivered'
                : o.orderStatus === 'cancelled' ? 'Cancelled'
                : o.orderStatus || 'Pending',
        }));

        // Merge: backend is source of truth, update localStorage too
        localStorage.setItem('myOrders', JSON.stringify(backendOrders));
        setOrders(backendOrders);
      })
      .catch(err => {
        console.warn('Could not fetch orders from backend:', err.message);
        // Fallback: keep localStorage orders
      });
  }, []);

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedAddresses');
    localStorage.removeItem('myOrders');
    localStorage.removeItem('cart');
    navigate('/login');
  };

  const saveAddress = (e) => {
    e.preventDefault();
    const updated = addressForm.id 
      ? addresses.map(a => a.id === addressForm.id ? addressForm : a)
      : [...addresses, { ...addressForm, id: Date.now().toString() }];
    
    setAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
    
    // Save to backend permanently
    authAPI.updateProfile({ addresses: updated }).catch(err => console.error('Failed to save address to backend', err));

    setShowAddressForm(false);
    setAddressForm({ id: '', title: '', name: '', email: '', phone: '', alternatePhone: '', businessName: '', gstNumber: '', dob: '', anniversary: '', address: '', city: '', state: '', pincode: '', orderNote: '' });
  };

  const deleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
    
    // Sync deletion to backend permanently
    authAPI.updateProfile({ addresses: updated }).catch(err => console.error('Failed to delete address from backend', err));
  };

  const editAddress = (addr) => {
    setAddressForm(addr);
    setShowAddressForm(true);
  };

  const navItems = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'addresses',
      label: 'Saved Info',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Page Heading */}
        <div className="mb-8 pt-6">
          <h1 className="text-3xl font-black text-brand-900">My Account</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your profile and orders</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* ===== SIDEBAR ===== */}
          <aside className="w-full md:w-64 shrink-0">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-900 to-accent-cyan flex items-center justify-center text-white text-3xl font-black mb-3 shadow-lg">
                {initial}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{userData.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-medium capitalize">{userData.role}</p>
              <div className="mt-3 px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">
                ✓ Active Account
              </div>
            </div>

            {/* Nav Menu */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold transition-all border-l-4 ${
                    activeTab === item.id
                      ? 'border-accent-cyan bg-cyan-50 text-accent-cyan'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <div className="flex-1 min-w-0">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <span className="w-1 h-5 bg-accent-cyan rounded-full inline-block"></span>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Full Name</p>
                      <p className="text-gray-900 font-semibold">{userData.name}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Email Address</p>
                      <p className="text-gray-900 font-semibold truncate">{userData.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Phone Number</p>
                      <p className="text-gray-900 font-semibold">{userData.phone}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Member Since</p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(userData.joinDate).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>


              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-gray-900 mb-6">Your Orders</h3>
                
                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <p className="text-gray-500 font-medium">No orders yet</p>
                    <p className="text-gray-400 text-sm mt-1">Your order history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-[#fcfcfc] rounded-2xl border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-gray-200 bg-[#f9f9f9]">
                          <div className="flex-1 min-w-[120px] pr-4 border-r border-gray-300">
                            <p className="text-xs font-semibold text-gray-400 mb-1">Order Number</p>
                            <p className="text-sm font-bold text-gray-900">{order.id}</p>
                          </div>
                          <div className="flex-1 min-w-[120px] px-4 border-r border-gray-300 text-center">
                            <p className="text-xs font-semibold text-gray-400 mb-1">Order Date</p>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex-[2] min-w-[180px] pl-4 text-right">
                            <p className="text-xs font-semibold text-gray-400 mb-1">Ship To</p>
                            <p className="text-sm font-bold text-gray-900 line-clamp-1" title={order.shipTo}>{order.shipTo}</p>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="px-6 py-6 space-y-6">
                          {(expandedOrders[order.id] ? order.items : order.items?.slice(0, 2))?.map((item, idx) => (
                            <div key={idx} className="flex gap-5">
                              <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover bg-gray-100 border border-gray-200" />
                              <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-base font-semibold text-gray-900">{item.name}</h4>
                                  <p className="text-base font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Color : <span className="text-gray-900 font-medium">{item.color || 'Default'}</span></p>
                                <p className="text-sm text-gray-500 mt-0.5">Size : <span className="text-gray-900 font-medium">{item.size}</span></p>
                                <p className="text-sm text-gray-500 mt-0.5">Qty : <span className="text-gray-900 font-medium">{item.quantity}</span></p>
                              </div>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <button 
                              onClick={() => toggleOrderExpand(order.id)} 
                              className="text-sm font-bold text-[#6b66e8] hover:text-indigo-800 transition-colors w-full text-center mt-2 py-2 border border-dashed border-[#6b66e8] rounded-xl bg-indigo-50/50"
                            >
                              {expandedOrders[order.id] ? 'Show Less' : `View All (${order.items.length} items)`}
                            </button>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 border-t border-gray-200 flex justify-between items-center bg-[#fcfcfc]">
                          <p className="text-sm font-semibold text-gray-500">
                            Total Amount : <span className="text-base font-black text-gray-900 ml-1">₹{order.total?.toLocaleString('en-IN') || 0}</span>
                          </p>
                          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            order.status === 'Shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                            order.status === 'Confirmed' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {order.status || 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-5 bg-accent-cyan rounded-full inline-block"></span>
                    Saved Info
                  </h3>
                  {!showAddressForm && (
                    <button onClick={() => setShowAddressForm(true)} className="text-xs font-bold text-brand-900 hover:text-brand-600 flex items-center gap-1">
                      + Add New
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <form onSubmit={saveAddress} className="p-6 sm:p-8 bg-white border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Address Label</label>
                        <input required type="text" value={addressForm.title} onChange={e => setAddressForm({...addressForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="e.g. Home, Office" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Name</label>
                        <input required type="text" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="Your Full Name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Email Address</label>
                        <input required type="email" value={addressForm.email} onChange={e => setAddressForm({...addressForm, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="name@example.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Phone Number</label>
                        <div className="flex items-center w-full px-4 py-3 rounded-xl border border-gray-200 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all bg-white">
                          <div className="flex items-center gap-2 pr-3 pointer-events-none select-none">
                            <img src="https://flagcdn.com/w40/in.png" alt="India Flag" className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                            <span className="text-sm font-bold text-gray-700">+91</span>
                          </div>
                          <input
                            required
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                              setAddressForm({ ...addressForm, phone: val });
                            }}
                            className="flex-1 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 text-base tracking-wide min-w-0"
                            placeholder="98765 43210"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Business Name</label>
                        <input required type="text" value={addressForm.businessName} onChange={e => setAddressForm({...addressForm, businessName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="Your Company Ltd." />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">GST Number</label>
                        <input type="text" value={addressForm.gstNumber} onChange={e => setAddressForm({...addressForm, gstNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="22AAAAA0000A1Z5" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Date of Birth <span className="text-red-500">*</span></label>
                        <input required type="date" value={addressForm.dob} onChange={e => setAddressForm({...addressForm, dob: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Alternate Phone (Optional)</label>
                        <div className="flex items-center w-full px-4 py-3 rounded-xl border border-gray-200 focus-within:border-brand-600 focus-within:ring-1 focus-within:ring-brand-600 transition-all bg-white">
                          <div className="flex items-center gap-2 pr-3 pointer-events-none select-none">
                            <img src="https://flagcdn.com/w40/in.png" alt="India Flag" className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                            <span className="text-sm font-bold text-gray-700">+91</span>
                          </div>
                          <input
                            type="tel"
                            value={addressForm.alternatePhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                              setAddressForm({ ...addressForm, alternatePhone: val });
                            }}
                            className="flex-1 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 text-base tracking-wide min-w-0"
                            placeholder="98765 43210"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Anniversary (Optional)</label>
                        <input type="date" value={addressForm.anniversary} onChange={e => setAddressForm({...addressForm, anniversary: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Full Address</label>
                        <textarea required rows="3" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all resize-none" placeholder="House No, Building, Street Name..." />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pincode</label>
                        <input required type="text" value={addressForm.pincode} onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, '').substring(0, 6))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="400001" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">State</label>
                        <select required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all bg-white">
                          <option value="">Select State</option>
                          {statesInIndia.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">City</label>
                        <input required type="text" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none transition-all" placeholder="City" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-8">
                      <button type="submit" className="bg-brand-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-800 transition-all shadow-sm">Save Address</button>
                      <button type="button" onClick={() => setShowAddressForm(false)} className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">Cancel</button>
                    </div>
                  </form>
                ) : addresses.length === 0 ? (
                  <div className="p-16 text-center">
                    <p className="text-gray-500 font-medium">No saved addresses</p>
                    <button onClick={() => setShowAddressForm(true)} className="mt-4 px-6 py-2 border-2 border-brand-900 text-brand-900 rounded-lg font-bold hover:bg-brand-50 transition">
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="border border-gray-200 rounded-xl p-4 relative group hover:border-brand-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-gray-100 text-gray-700 text-xs font-black px-2 py-1 rounded uppercase tracking-wide">{addr.title}</span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editAddress(addr)} className="text-blue-400 hover:text-blue-600" title="Edit Address">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => deleteAddress(addr.id)} className="text-red-400 hover:text-red-600" title="Delete Address">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mt-2">{addr.address}</p>
                        <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Logout — always at the very bottom */}
        <div className="mt-6 pb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 text-sm font-semibold text-red-500 bg-white rounded-2xl shadow-sm border border-red-100 hover:bg-red-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
