import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const badge = (s) => {
  const st = s?.toLowerCase() || '';
  if (st === 'approved' || st === 'delivered') return { bg: 'rgba(29,187,204,0.12)',  color: '#1dbbcc' };
  if (st === 'pending' || st === 'placed')     return { bg: 'rgba(242,130,58,0.12)',  color: '#f2823a' };
  return                                              { bg: 'rgba(62,107,130,0.12)',  color: '#3e6b82' };
};

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AdminDashboard() {
  const [stats, setStats]         = useState({ totalUsers: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0, totalProducts: 0 });
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers]   = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [recentOrders, setRecent] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { 
    loadAll(); 
    // Refresh data every 3 seconds for real-time updates
    const interval = setInterval(loadAll, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/auth/users`),
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/products`),
      ]);

      let totalUsers = 0, totalOrders = 0, totalProducts = 0, pendingOrders = 0;
      let orders = [], users = [], products = [];

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const d = await usersRes.value.json();
        users = d.data?.users || [];
        totalUsers = users.length;
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const d = await ordersRes.value.json();
        orders = d.data?.orders || [];
        totalOrders = orders.length;
        pendingOrders = orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'processing').length;
      }

      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const d = await productsRes.value.json();
        products = d.data?.products || [];
        totalProducts = products.length;
      }

      const totalRevenue = orders.reduce((acc, o) => {
        if (o.orderStatus !== 'cancelled') return acc + (o.totalPrice || o.subtotal || 0);
        return acc;
      }, 0);

      setStats({ totalUsers, totalOrders, totalRevenue, pendingOrders, totalProducts });
      setAllOrders(orders);
      setAllUsers(users);
      setAllProducts(products);
      setRecent(orders.slice(0, 5));
      setRecentUsers(users.slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Revenue',   value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, warn: false, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { label: 'Total Orders',    value: stats.totalOrders,   warn: false, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
    { label: 'Total Users',     value: stats.totalUsers,    warn: false, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
    { label: 'Total Products',  value: stats.totalProducts, warn: false, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg> },
  ];

  return (
    <Layout title="Dashboard Overview">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-sm border" style={{ borderColor: '#e5edf2' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: c.warn ? 'rgba(242,130,58,0.1)' : 'rgba(29,187,204,0.1)', color: c.warn ? '#f2823a' : '#1dbbcc' }}>
              {c.icon}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#70a0b5' }}>{c.label}</p>
              <p className="text-3xl font-black" style={{ color: '#1b2f3e' }}>
                {loading ? '—' : c.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        
        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5edf2' }}>
          <h3 className="font-black mb-6 text-lg" style={{ color: '#1b2f3e' }}>Users Joined (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const last7Days = Array.from({length: 7}, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  return d.toISOString().split('T')[0];
                });
                const lineData = last7Days.map(dateStr => {
                  const d = new Date(dateStr);
                  const label = `${d.getDate()} ${months[d.getMonth()]}`;
                  const count = allUsers.filter(u => new Date(u.createdAt).toISOString().split('T')[0] === dateStr).length;
                  return { name: label, users: count };
                });

                return (
                  <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5edf2" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#70a0b5' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#70a0b5' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#1dbbcc' }}
                    />
                    <Line type="monotone" dataKey="users" stroke="#1dbbcc" strokeWidth={4} dot={{ r: 4, fill: '#1dbbcc', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5edf2' }}>
          <h3 className="font-black mb-2 text-lg" style={{ color: '#1b2f3e' }}>Order Status Distribution</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {allOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-400 font-bold text-lg">No orders found</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {(() => {
                  const pieData = [
                    { name: 'Processing', value: allOrders.filter(o => ['placed', 'processing'].includes(o.orderStatus?.toLowerCase())).length, color: '#f2823a' },
                    { name: 'Shipped', value: allOrders.filter(o => o.orderStatus?.toLowerCase() === 'shipped').length, color: '#3e6b82' },
                    { name: 'Delivered', value: allOrders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length, color: '#1dbbcc' },
                    { name: 'Cancelled', value: allOrders.filter(o => o.orderStatus?.toLowerCase() === 'cancelled').length, color: '#e53e3e' },
                  ].filter(s => s.value > 0);

                  return (
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1b2f3e' }} />
                    </PieChart>
                  );
                })()}
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5edf2' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#e5edf2' }}>
            <h3 className="font-black" style={{ color: '#1b2f3e' }}>Recent Users</h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(29,187,204,0.1)', color: '#1dbbcc' }}>
              {stats.totalUsers} Total
            </span>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ background: '#f4f7fa' }}>
              {['Name', 'Email', 'Phone', 'Joined'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 font-bold text-xs">No users yet</td></tr>
              ) : recentUsers.map((u) => (
                <tr key={u._id} className="border-t" style={{ borderColor: '#f0f5f8' }}>
                  <td className="px-5 py-3.5 font-bold text-xs" style={{ color: '#1b2f3e' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0" style={{ background: '#1b2f3e' }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#70a0b5' }}>{u.email}</td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#3e6b82' }}>{u.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: '#70a0b5' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5edf2' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#e5edf2' }}>
            <h3 className="font-black" style={{ color: '#1b2f3e' }}>Recent Orders</h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(62,107,130,0.1)', color: '#3e6b82' }}>Last 5</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ background: '#f4f7fa' }}>
              {['Order ID', 'Customer', 'Total', 'Status'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 font-bold text-xs">No orders yet</td></tr>
              ) : recentOrders.map((o) => {
                const s = badge(o.orderStatus);
                const customerName = o.shippingAddress?.name || o.shippingAddress?.fullName || o.user?.name || 'Guest';
                return (
                  <tr key={o._id} className="border-t" style={{ borderColor: '#f0f5f8' }}>
                    <td className="px-5 py-3.5 font-black text-xs" style={{ color: '#1dbbcc' }}>
                      {o.orderNumber || o._id?.substring(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-xs" style={{ color: '#1b2f3e' }}>{customerName}</td>
                    <td className="px-5 py-3.5 font-black text-xs" style={{ color: '#1b2f3e' }}>
                      ₹{o.totalPrice?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
                        {o.orderStatus === 'placed' ? 'Processing' : o.orderStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
