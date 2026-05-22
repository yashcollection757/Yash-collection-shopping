import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { fetchAllOrders } from '../services/api';
import * as XLSX from 'xlsx';

export default function AdminCustomerInfo() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const orders = await fetchAllOrders();
      
      // Extract unique customers from orders using shipping address
      const customerMap = new Map();
      
      orders.forEach(order => {
        const addr = order.shippingAddress || {};
        const email = addr.email || 'N/A';
        
        if (!customerMap.has(email)) {
          const orderCount = orders.filter(o => 
            (o.shippingAddress?.email === email)
          ).length;
          
          customerMap.set(email, {
            name: addr.name || 'N/A',
            email: email,
            phone: addr.phone || 'N/A',
            alternatePhone: addr.alternatePhone || '-',
            businessName: addr.businessName || '-',
            gstNumber: addr.gstNumber || '-',
            address: addr.address || 'N/A',
            city: addr.city || '-',
            state: addr.state || '-',
            pincode: addr.pincode || '-',
            dob: addr.dob || '-',
            anniversary: addr.anniversary || '-',
            orderCount: orderCount,
            lastOrderDate: order.createdAt,
            _id: email
          });
        }
      });
      
      const customerList = Array.from(customerMap.values())
        .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
      
      setCustomers(customerList);
      setError(null);
    } catch (err) {
      setError('Failed to load customer information');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.businessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadExcel = () => {
    try {
      const excelData = filtered.map(c => ({
        'Name': c.name,
        'Email': c.email,
        'Phone': c.phone,
        'Alternate Phone': c.alternatePhone,
        'Business Name': c.businessName,
        'GST Number': c.gstNumber,
        'Address': c.address,
        'City': c.city,
        'State': c.state,
        'Pincode': c.pincode,
        'Date of Birth': c.dob,
        'Anniversary': c.anniversary,
        'Total Orders': c.orderCount,
        'Last Order Date': new Date(c.lastOrderDate).toLocaleDateString('en-IN')
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const columnWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      const date = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
      XLSX.writeFile(workbook, `Customer_Info_${date}.xlsx`);
    } catch (err) {
      alert('Failed to download Excel file');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Layout title="Customer Information">
        <div className="p-10 text-center font-bold" style={{ color: '#70a0b5' }}>
          Loading customer information...
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Customer Information">
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <input
          type="text"
          placeholder="Search by name, email, phone, or business..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none"
          style={{ borderColor: '#e5edf2', color: '#1b2f3e' }}
        />
        <button
          onClick={downloadExcel}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap"
          style={{ background: '#1dbbcc', color: 'white' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v12m0 0l-3-3m3 3l3-3M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          Download Excel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl font-bold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5edf2' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f4f7fa' }}>
                {['Name', 'Email', 'Phone', 'Business Name', 'GST Number', 'Full Address', 'Orders', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#70a0b5' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const fullAddress = [
                  customer.address,
                  customer.city,
                  customer.state,
                  customer.pincode
                ].filter(Boolean).join(', ');

                return (
                  <tr key={customer._id} className="border-t hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0f5f8' }}>
                    <td className="px-4 py-3 font-semibold text-xs whitespace-nowrap" style={{ color: '#1b2f3e' }}>
                      {customer.name}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#70a0b5' }}>
                      <a href={`mailto:${customer.email}`} className="hover:text-[#1dbbcc] transition-colors">
                        {customer.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#70a0b5' }}>
                      <a href={`tel:${customer.phone}`} className="hover:text-[#1dbbcc] transition-colors">
                        {customer.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#70a0b5' }}>
                      {customer.businessName}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap font-mono" style={{ color: '#70a0b5' }}>
                      {customer.gstNumber}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[250px]" style={{ color: '#70a0b5' }}>
                      <p className="line-clamp-2">{fullAddress}</p>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full font-bold" style={{ background: 'rgba(29,187,204,0.12)', color: '#1dbbcc' }}>
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-3 py-1.5 text-[#1dbbcc] bg-[#1dbbcc]/10 hover:bg-[#1dbbcc] hover:text-white rounded-lg transition-colors text-xs font-bold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-16 h-16 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 font-bold text-lg">No Customers Found</p>
                      <p className="text-gray-400 text-sm">No matching customers in the database</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm" style={{ color: '#70a0b5' }}>
        Total Unique Customers: <span className="font-bold" style={{ color: '#1dbbcc' }}>{filtered.length}</span>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center" style={{ background: '#f4f7fa' }}>
              <h2 className="text-lg font-black" style={{ color: '#1b2f3e' }}>Customer Details</h2>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#70a0b5' }}>Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Name</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>{selectedCustomer.name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Email</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>
                      <a href={`mailto:${selectedCustomer.email}`} className="hover:text-[#1dbbcc] transition-colors">
                        {selectedCustomer.email}
                      </a>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Phone</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>
                      <a href={`tel:${selectedCustomer.phone}`} className="hover:text-[#1dbbcc] transition-colors">
                        {selectedCustomer.phone}
                      </a>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Alternate Phone</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>
                      {selectedCustomer.alternatePhone !== '-' ? (
                        <a href={`tel:${selectedCustomer.alternatePhone}`} className="hover:text-[#1dbbcc] transition-colors">
                          {selectedCustomer.alternatePhone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Date of Birth</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>{selectedCustomer.dob}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Anniversary</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>{selectedCustomer.anniversary}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#70a0b5' }}>Business Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Business Name</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>{selectedCustomer.businessName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>GST Number</p>
                    <p className="text-sm font-mono font-semibold mt-1" style={{ color: '#1b2f3e' }}>{selectedCustomer.gstNumber}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#70a0b5' }}>Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2" style={{ color: '#1b2f3e' }}>{selectedCustomer.address}</p>
                  <p className="text-sm" style={{ color: '#70a0b5' }}>
                    {[selectedCustomer.city, selectedCustomer.state].filter(v => v !== '-').join(', ')} - {selectedCustomer.pincode}
                  </p>
                </div>
              </div>

              {/* Order Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#70a0b5' }}>Order Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Total Orders</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1dbbcc' }}>{selectedCustomer.orderCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-bold" style={{ color: '#70a0b5' }}>Last Order</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: '#1b2f3e' }}>
                      {new Date(selectedCustomer.lastOrderDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3" style={{ background: '#f4f7fa' }}>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                style={{ background: '#e5edf2', color: '#1b2f3e' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
