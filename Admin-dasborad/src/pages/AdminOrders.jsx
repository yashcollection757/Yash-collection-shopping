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
    loadOrders(true);
    // Refresh orders every 30 seconds for real-time updates without blinking
    const interval = setInterval(() => loadOrders(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      if (showLoading) setError('Failed to load orders');
    } finally {
      if (showLoading) setLoading(false);
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
    const gst = Math.round(subtotal * 0.05); // 5% GST
    const total = order.totalPrice || (subtotal + gst);
    const date = new Date(order.createdAt || Date.now());
    const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    const logoUrl = `${window.location.origin}/images/logo1.png`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.orderNumber || order._id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; color: #333; padding: 20px; background: white; }
            .container { max-width: 900px; margin: 0 auto; border: 2px solid #333; }
            
            /* Top Header Section */
            .top-header { display: flex; border-bottom: 2px solid #333; }
            .company-section { flex: 1; padding: 20px; border-right: 2px solid #333; }
            .invoice-section { flex: 1; padding: 20px; }
            .company-name { font-size: 20px; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
            .company-logo { width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; }
            .company-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
            .company-details { font-size: 12px; line-height: 1.6; }
            .invoice-title { font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 15px; }
            .invoice-info { font-size: 13px; line-height: 1.8; text-align: right; }
            .invoice-info .label { font-weight: bold; display: inline-block; width: 80px; }
            
            /* Address Sections */
            .address-section { display: flex; border-bottom: 2px solid #333; min-height: 120px; }
            .address-box { flex: 1; padding: 15px; font-size: 12px; line-height: 1.8; border-right: 2px solid #333; }
            .address-box:last-child { border-right: none; }
            .address-label { font-weight: bold; font-size: 13px; margin-bottom: 8px; text-transform: uppercase; }
            
            /* Items Table */
            .items-section { padding: 0; }
            table { width: 100%; border-collapse: collapse; }
            .table-header { display: flex; border-bottom: 2px solid #333; font-weight: bold; font-size: 12px; }
            .table-header > div { padding: 10px; display: flex; align-items: center; }
            .col-si { flex: 0.5; border-right: 1px solid #333; text-align: center; }
            .col-desc { flex: 3; border-right: 1px solid #333; }
            .col-qty { flex: 1; border-right: 1px solid #333; text-align: center; }
            .col-rate { flex: 1; border-right: 1px solid #333; text-align: center; }
            .col-per { flex: 0.8; border-right: 1px solid #333; text-align: center; }
            .col-disc { flex: 1; border-right: 1px solid #333; text-align: center; }
            .col-amt { flex: 1; text-align: right; }
            
            .table-row { display: flex; border-bottom: 1px solid #333; font-size: 12px; }
            .table-row > div { padding: 8px; display: flex; align-items: center; }
            
            /* Totals */
            .totals-section { display: flex; border-top: 2px solid #333; }
            .totals-left { flex: 1; padding: 15px; border-right: 2px solid #333; font-size: 12px; }
            .totals-right { flex: 1; padding: 15px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total-row.grand { font-weight: bold; font-size: 14px; border-top: 1px solid #333; padding-top: 8px; margin-top: 8px; }
            .grand-total { color: #1b2f3e; font-size: 16px; font-weight: bold; }
            
            @media print {
              body { padding: 0; margin: 0; }
              .container { border: 1px solid #333; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Top Header -->
            <div class="top-header">
              <div class="company-section">
                  <div class="company-name">
                  <div class="company-logo">
                    <img src="${logoUrl}" alt="Yash Collection Logo">
                  </div>
                  <div>YASH COLLECTION</div>
                </div>
                <div class="company-details">
                  12/1/a, DR P K BANERJEE ROAD<br>
                  HOWRAH-711101<br>
                  PH: 8482098000<br>
                  GSTIN/UIN: 19BKHPK3278C1Z3<br>
                  State Name : West Bengal, Code : 19<br>
                  E-Mail : yashcollection2@gmail.com
                </div>
              </div>
              <div class="invoice-section">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-info">
                  <div><span class="label">Order Date</span>: ${formattedDate}</div>
                  <div><span class="label">Order No.</span>: ${order.orderNumber || order._id}</div>
                </div>
              </div>
            </div>
            
            <!-- Address Sections -->
            <div class="address-section">
              <div class="address-box">
                <div class="address-label">Consignee (Ship to)</div>
                <strong>${order.shippingAddress?.name || 'Guest'}</strong><br>
                ${order.shippingAddress?.businessName || ''}<br>
                ${order.shippingAddress?.address || ''}<br>
                ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
                <br>
                State Name : ${order.shippingAddress?.state || ''}<br>
                Contact : ${order.shippingAddress?.phone || ''}<br>
                ${order.shippingAddress?.businessName ? `Place of Supply : ${order.shippingAddress.state}<br>` : ''}
                ${order.shippingAddress?.gstNumber ? `GSTIN/UIN : ${order.shippingAddress.gstNumber}<br>` : ''}
              </div>
              <div class="address-box">
                <div class="address-label">Buyer (Bill to)</div>
                <strong>${order.shippingAddress?.name || 'Guest'}</strong><br>
                ${order.shippingAddress?.businessName || ''}<br>
                ${order.shippingAddress?.address || ''}<br>
                ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
                <br>
                State Name : ${order.shippingAddress?.state || ''}<br>
                Contact : ${order.shippingAddress?.phone || ''}<br>
                Business : ${order.shippingAddress?.businessName || ''}<br>
                ${order.shippingAddress?.gstNumber ? `GSTIN/UIN : ${order.shippingAddress.gstNumber}<br>` : ''}
              </div>
            </div>
            
            <!-- Items Table -->
            <div class="items-section">
              <div class="table-header">
                <div class="col-si">SI<br>No</div>
                <div class="col-desc">Description of Goods</div>
                <div class="col-qty">Quantity</div>
                <div class="col-rate">Rate</div>
                <div class="col-per">per</div>
                <div class="col-disc">Disc. %</div>
                <div class="col-amt">Amount</div>
              </div>
              ${order.items.map((item, idx) => `
                <div class="table-row">
                  <div class="col-si">${idx + 1}</div>
                  <div class="col-desc">${item.name || 'Product'} ${item.size ? `(Size: ${item.size})` : ''}</div>
                  <div class="col-qty">${item.quantity} PCS</div>
                  <div class="col-rate">${(item.price || 0).toLocaleString('en-IN')}</div>
                  <div class="col-per">PCS</div>
                  <div class="col-disc">-</div>
                  <div class="col-amt">${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</div>
                </div>
              `).join('')}
              
              <!-- Total Row -->
              <div class="table-row" style="font-weight: bold;">
                <div class="col-si"></div>
                <div class="col-desc">Total</div>
                <div class="col-qty">${totalItems} PCS</div>
                <div class="col-rate"></div>
                <div class="col-per"></div>
                <div class="col-disc"></div>
                <div class="col-amt">${subtotal.toLocaleString('en-IN')}</div>
              </div>
            </div>
            
            <!-- Totals Section -->
            <div class="totals-section">
              <div class="totals-left">
                <div class="total-row">
                  <span>Total Quantity:</span>
                  <span>${totalItems} units</span>
                </div>
              </div>
              <div class="totals-right">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>₹${subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row">
                  <span>GST (5% included):</span>
                  <span>₹${gst.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-row grand">
                  <span>Total:</span>
                  <span class="grand-total">₹${total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = () => { window.print(); }
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
