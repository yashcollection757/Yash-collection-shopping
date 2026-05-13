import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchAllOrders, updateOrderStatusAdmin, deleteOrderAdmin } from '../services/api';

const badgeStyle = (s) => {
  const status = s?.toLowerCase() || '';
  if (status === 'delivered')  return { background: 'rgba(29,187,204,0.12)',  color: '#1dbbcc' };
  if (status === 'shipped')    return { background: 'rgba(62,107,130,0.12)',  color: '#3e6b82' };
  if (status === 'cancelled')  return { background: 'rgba(229,62,62,0.12)',   color: '#e53e3e' };
  return                         { background: 'rgba(242,130,58,0.12)',  color: '#f2823a' }; // placed/processing/pending
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
    // Refresh orders every 3 seconds for real-time updates
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const updatedOrder = await updateOrderStatusAdmin(orderId, newStatus.toLowerCase());
      setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: updatedOrder.orderStatus } : o));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrderAdmin(orderId);
      setOrders(orders.filter(o => o._id !== orderId));
    } catch (err) {
      alert('Failed to delete order');
    }
  };

  const printInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = (order.totalPrice || order.subtotal || 0) - subtotal;
    const date = new Date(order.createdAt).toLocaleDateString();

    const html = `
      <html>
        <head>
          <title>Invoice - ${order.orderNumber || order._id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1b2f3e; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .box { padding: 15px; background: #f9f9f9; border-radius: 8px; width: 45%; }
            .box h3 { margin-top: 0; color: #70a0b5; font-size: 14px; text-transform: uppercase; }
            table { w-full; width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { background: #f4f7fa; font-weight: bold; }
            .totals { width: 300px; margin-left: auto; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .totals-row.grand { font-weight: bold; font-size: 18px; color: #1dbbcc; border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Yash Collections</div>
            <div style="text-align: right;">
              <h2>INVOICE</h2>
              <p><strong>Order #:</strong> ${order.orderNumber || order._id}<br><strong>Date:</strong> ${date}</p>
            </div>
          </div>
          <div class="details">
            <div class="box">
              <h3>Customer Information</h3>
              <p>
                <strong>${order.shippingAddress?.name || order.user?.name || 'Guest'}</strong><br>
                ${order.shippingAddress?.email || order.user?.email || 'N/A'}<br>
                ${order.shippingAddress?.phone || order.user?.phone || 'N/A'}<br>
                ${order.shippingAddress?.businessName ? `Business: ${order.shippingAddress.businessName}<br>` : ''}
                ${order.shippingAddress?.gstNumber ? `GST: ${order.shippingAddress.gstNumber}<br>` : ''}
              </p>
            </div>
            <div class="box">
              <h3>Shipping Address</h3>
              <p>
                ${order.shippingAddress?.address || 'No address'}<br>
                ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}
              </p>
              ${order.orderNote ? `<div style="margin-top: 10px; padding: 10px; background: #fff3cd; color: #856404; border-left: 4px solid #ffeeba; border-radius: 4px; font-size: 13px;"><strong>Note:</strong> ${order.orderNote}</div>` : ''}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(i => `
                <tr>
                  <td>${i.name || 'Product'} ${i.size ? `<span style="color:#70a0b5; font-size:12px;">(Size: ${i.size})</span>` : ''}</td>
                  <td>₹${(i.price || 0).toLocaleString()}</td>
                  <td>${i.quantity}</td>
                  <td>₹${((i.price || 0) * (i.quantity || 1)).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="totals-row"><span>Total Quantity:</span> <span>${totalItems} units</span></div>
            <div class="totals-row"><span>Subtotal:</span> <span>₹${subtotal.toLocaleString()}</span></div>
            <div class="totals-row"><span>Shipping:</span> <span>₹${shipping.toLocaleString()}</span></div>
            <div class="totals-row grand"><span>Total:</span> <span>₹${(order.totalPrice || order.subtotal || 0).toLocaleString()}</span></div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const shown = filter === 'All' ? orders : orders.filter(o => {
    const s = o.orderStatus?.toLowerCase() || '';
    return filter.toLowerCase() === s || (filter === 'Processing' && (s === 'placed' || s === 'processing'));
  });

  if (loading) {
    return <Layout title="Orders Management"><div className="p-10 text-center font-bold" style={{color: '#70a0b5'}}>Loading Orders...</div></Layout>;
  }

  return (
    <Layout title="Orders Management">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-5 py-2 rounded-full text-sm font-bold transition-all"
            style={{ background: filter===f ? '#1b2f3e' : 'white', color: filter===f ? 'white' : '#3e6b82', border: `2px solid ${filter===f ? '#1b2f3e' : '#e5edf2'}` }}>
            {f}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl font-bold">{error}</div>}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5edf2' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f4f7fa' }}>
                {['Order ID','Customer Name','Product Details','Total Amount','Order Date','Delivery Address','Order Status','Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#70a0b5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((o) => {
                const s = badgeStyle(o.orderStatus);
                const firstItem = o.items?.[0] || {};
                const customerName = o.shippingAddress?.name || o.shippingAddress?.fullName || o.user?.name || 'Guest';
                const date = new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                const fullAddress = o.shippingAddress ? `${o.shippingAddress.address || o.shippingAddress.addressLine1}, ${o.shippingAddress.city}` : 'N/A';
                
                return (
                  <tr key={o._id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0f5f8' }}>
                    <td className="px-3 py-3 font-black text-xs whitespace-nowrap" style={{ color: '#1dbbcc' }}>
                      {o.orderNumber || o._id.substring(0,8)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-xs whitespace-nowrap" style={{ color: '#1b2f3e' }}>
                      {customerName}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {firstItem.image ? (
                          <img src={firstItem.image} alt="item" className="w-8 h-8 min-w-[32px] rounded-lg object-cover bg-gray-100 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gray-200 shrink-0"></div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate max-w-[100px]" title={firstItem.name || 'Unknown Item'}>{firstItem.name || 'Unknown Item'}</p>
                          {o.items?.length > 1 && <p className="text-[10px] text-gray-500 font-bold mt-0.5">+{o.items.length - 1} more</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-black text-xs whitespace-nowrap" style={{ color: '#1b2f3e' }}>
                      ₹{o.totalPrice?.toLocaleString('en-IN') || o.subtotal?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap font-medium" style={{ color: '#70a0b5' }}>
                      {date}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-normal max-w-[130px]" style={{ color: '#70a0b5' }}>
                      <p className="line-clamp-2">{fullAddress}</p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <select value={o.orderStatus || 'placed'} onChange={e => updateStatus(o._id, e.target.value)}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer"
                        style={{ borderColor: '#e5edf2', color: s.color, background: s.background }}>
                        <option value="placed">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedOrder(o)} className="p-1.5 text-[#1dbbcc] bg-[#1dbbcc]/10 hover:bg-[#1dbbcc] hover:text-white rounded-lg transition-colors" title="View Order">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(o._id)} className="p-1.5 text-red-500 bg-red-100 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete Order">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 font-bold text-lg">No Orders Found</p>
                      <p className="text-gray-400 text-sm">Orders will appear here as customers place them</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#f4f7fa]">
              <h2 className="text-lg font-black text-[#1b2f3e]">Order #{selectedOrder.orderNumber || selectedOrder._id.substring(0,8)}</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => printInvoice(selectedOrder)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print PDF
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-[#70a0b5] uppercase tracking-wider mb-3 border-b pb-2">Customer Info</p>
                  <div className="space-y-1.5">
                    <p className="text-sm"><span className="font-semibold text-gray-500">Name:</span> <span className="font-bold text-[#1b2f3e]">{selectedOrder.shippingAddress?.name || selectedOrder.user?.name || 'Guest'}</span></p>
                    <p className="text-sm"><span className="font-semibold text-gray-500">Email:</span> <span className="text-gray-800">{selectedOrder.shippingAddress?.email || selectedOrder.user?.email || 'N/A'}</span></p>
                    <p className="text-sm"><span className="font-semibold text-gray-500">Phone:</span> <span className="text-gray-800">{selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'N/A'}</span></p>
                    {selectedOrder.shippingAddress?.businessName && (
                      <p className="text-sm"><span className="font-semibold text-gray-500">Business:</span> <span className="text-gray-800">{selectedOrder.shippingAddress.businessName}</span></p>
                    )}
                    {selectedOrder.shippingAddress?.gstNumber && (
                      <p className="text-sm"><span className="font-semibold text-gray-500">GST:</span> <span className="text-gray-800 uppercase">{selectedOrder.shippingAddress.gstNumber}</span></p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-[#70a0b5] uppercase tracking-wider mb-3 border-b pb-2">Shipping Address</p>
                  <div className="space-y-1.5">
                    <p className="text-sm text-gray-800">{selectedOrder.shippingAddress?.address || 'No address provided'}</p>
                    <p className="text-sm text-gray-800">
                      {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-sm text-gray-800">
                      PIN: <span className="font-bold">{selectedOrder.shippingAddress?.pincode || selectedOrder.shippingAddress?.zipCode || 'N/A'}</span>
                    </p>
                    {selectedOrder.orderNote && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Order Note / Special Instructions</p>
                        <p className="text-sm text-yellow-900">{selectedOrder.orderNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-[#70a0b5] uppercase tracking-wider mb-2">Order Items ({selectedOrder.items?.length || 0})</p>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 items-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1b2f3e] truncate">{item.name || 'Product'}</p>
                        <p className="text-xs text-gray-500 font-bold">Qty: {item.quantity || 1}</p>
                      </div>
                      <p className="font-black text-[#1dbbcc]">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-5 rounded-xl border border-gray-100 gap-4">
                <div className="w-full sm:w-auto text-left">
                  <p className="text-xs font-bold text-[#70a0b5] uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-3xl font-black text-[#1dbbcc]">₹{(selectedOrder.totalPrice || selectedOrder.subtotal || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="w-full sm:w-auto sm:text-right">
                  <p className="text-xs font-bold text-[#70a0b5] uppercase tracking-wider mb-1">Update Status</p>
                  <select 
                    value={selectedOrder.orderStatus || 'placed'} 
                    onChange={e => {
                      updateStatus(selectedOrder._id, e.target.value);
                      setSelectedOrder({...selectedOrder, orderStatus: e.target.value});
                    }}
                    className="text-sm font-bold px-4 py-2.5 rounded-xl border focus:outline-none cursor-pointer bg-white shadow-sm w-full sm:w-auto"
                    style={{ borderColor: '#e5edf2', color: '#1b2f3e' }}
                  >
                    <option value="placed">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
