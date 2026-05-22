import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AddProductModal from '../components/AddProductModal';
import { fetchAllProducts, deleteProduct } from '../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
      setShowDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p =>
    (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p._id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const getPriceRange = (variants) => {
    if (!variants || variants.length === 0) return 'N/A';
    const prices = variants.map(v => v.price).filter(p => p);
    if (prices.length === 0) return 'N/A';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  };

  const getTotalStock = (variants) => {
    if (!variants) return 0;
    return variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
  };

  return (
    <Layout title="Products">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p style={{ color: '#70a0b5' }} className="text-lg font-semibold">Loading products...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <p className="text-red-700 font-semibold">{error}</p>
          <button 
            onClick={loadProducts}
            className="mt-4 px-6 py-2 rounded-xl font-semibold text-white transition-all"
            style={{ background: '#1dbbcc' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: 'Total Products', value: filteredProducts.length },
              { label: 'Categories', value: [...new Set(filteredProducts.map(p => p.category))].length },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border text-center" style={{ borderColor: '#e5edf2' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#70a0b5' }}>{c.label}</p>
                <p className="text-2xl font-black" style={{ color: '#1b2f3e' }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Top Bar - Search & Add */}
          <div className="flex gap-4 mb-8 items-center">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" fill="none" stroke="#70a0b5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by product name, category, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none transition-all"
                style={{ 
                  borderColor: searchTerm ? '#1dbbcc' : '#e5edf2', 
                  color: '#1b2f3e',
                  boxShadow: searchTerm ? '0 0 0 3px rgba(29,187,204,0.1)' : 'none'
                }}
              />
            </div>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setShowAddModal(true);
              }}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm whitespace-nowrap transition-all hover:opacity-90"
              style={{ background: '#1dbbcc' }}
            >
              + Add Product
            </button>
          </div>

          {/* Product Table */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border" style={{ borderColor: '#e5edf2' }}>
              <p style={{ color: '#70a0b5' }} className="text-lg font-semibold">
                {searchTerm ? 'No products found matching your search' : 'No products available'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: '#e5edf2' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#f8fbfd', borderBottom: '1px solid #e5edf2' }}>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>Product</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>Price Range</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>Variants</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>Stock</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider" style={{ color: '#70a0b5' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e5edf2' }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {p.image && (
                              <img 
                                src={p.image} 
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={e => { e.target.style.display='none'; }}
                              />
                            )}
                            <div>
                              <p className="font-bold text-sm" style={{ color: '#1b2f3e' }}>{p.name}</p>
                              <p className="text-xs" style={{ color: '#70a0b5' }}>ID: {p._id?.substring(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-xs font-bold px-2.5 py-1 rounded-full inline-block"
                            style={{ background: 'rgba(29,187,204,0.1)', color: '#1dbbcc' }}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold" style={{ color: '#f2823a' }}>{getPriceRange(p.variants)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold" style={{ color: '#3e6b82' }}>{p.variants?.length || 0}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold" style={{ color: '#3e6b82' }}>{getTotalStock(p.variants)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-center">
                            <button 
                              onClick={() => {
                                setEditingProduct(p);
                                setShowAddModal(true);
                              }}
                              className="px-3 py-1 rounded text-xs font-bold border transition-all"
                              style={{ borderColor: '#1b2f3e', color: '#1b2f3e' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(p._id)}
                              className="px-3 py-1 rounded text-xs font-bold text-white transition-all"
                              style={{ background: '#e53e3e' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
                <p className="font-bold text-lg mb-4" style={{ color: '#1b2f3e' }}>Delete Product?</p>
                <p className="text-sm mb-6" style={{ color: '#70a0b5' }}>This action cannot be undone. Are you sure?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all"
                    style={{ borderColor: '#1b2f3e', color: '#1b2f3e' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 py-2 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: '#e53e3e' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Product Modal */}
          <AddProductModal 
            isOpen={showAddModal}
            productToEdit={editingProduct}
            categories={[...new Set(products.map(p => p.category).filter(Boolean))]}
            onClose={() => {
              setShowAddModal(false);
              setEditingProduct(null);
            }}
            onProductAdded={() => {
              setShowAddModal(false);
              setEditingProduct(null);
              loadProducts();
            }}
          />
        </>
      )}
    </Layout>
  );
}
