import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AddProductModal from '../components/AddProductModal';
import { fetchAllProducts, deleteProduct, updateProduct } from '../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewImgIdx, setPreviewImgIdx] = useState(0);

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

  const handleToggleVisibility = async (productId, currentStatus) => {
    try {
      await updateProduct(productId, { isActive: !currentStatus });
      setProducts(products.map(p => 
        p._id === productId ? { ...p, isActive: !currentStatus } : p
      ));
    } catch (err) {
      alert('Failed to update product visibility');
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

  // Keyboard navigation for table image preview
  useEffect(() => {
    if (!previewProduct) return;
    const images = [
      ...(previewProduct.images && previewProduct.images.length > 0 ? previewProduct.images : []),
      ...(previewProduct.image ? [previewProduct.image] : [])
    ];
    const uniqueImages = Array.from(new Set(images));
    if (uniqueImages.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPreviewProduct(null);
      } else if (e.key === 'ArrowLeft') {
        setPreviewImgIdx((prev) => (prev > 0 ? prev - 1 : uniqueImages.length - 1));
      } else if (e.key === 'ArrowRight') {
        setPreviewImgIdx((prev) => (prev < uniqueImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewProduct]);

  const openTableImagePreview = (product) => {
    setPreviewProduct(product);
    setPreviewImgIdx(0);
  };

  const getProductImageList = (product) => {
    if (!product) return [];
    const imgs = [
      ...(product.images && product.images.length > 0 ? product.images : []),
      ...(product.image ? [product.image] : [])
    ];
    return Array.from(new Set(imgs));
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
                              <div
                                className="relative group cursor-pointer flex-shrink-0"
                                onClick={() => openTableImagePreview(p)}
                                title="Click to preview full image"
                              >
                                <img 
                                  src={p.image} 
                                  alt={p.name}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 group-hover:border-cyan-500 transition-all group-hover:scale-105 shadow-sm"
                                  onError={e => { e.target.style.display='none'; }}
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                                {p.images && p.images.length > 1 && (
                                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow">
                                    {p.images.length}
                                  </span>
                                )}
                              </div>
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
                              onClick={() => handleToggleVisibility(p._id, p.isActive)}
                              className="px-3 py-1 rounded text-xs font-bold text-white transition-all"
                              style={{ background: p.isActive ? '#10b981' : '#9ca3af' }}
                              title={p.isActive ? 'Hide from website' : 'Show on website'}
                            >
                              {p.isActive ? '👁 Visible' : '👁‍🗨 Hidden'}
                            </button>
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

          {/* Table Product Image Preview Lightbox */}
          {previewProduct && (() => {
            const productImages = getProductImageList(previewProduct);
            if (productImages.length === 0) return null;
            return (
              <div
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 select-none"
                onClick={() => setPreviewProduct(null)}
              >
                {/* Top Bar */}
                <div
                  className="absolute top-0 left-0 right-0 p-4 sm:px-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="text-white font-bold text-base sm:text-lg">
                      {previewProduct.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Image {previewImgIdx + 1} of {productImages.length}
                      </span>
                      <span className="bg-white/10 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        Category: {previewProduct.category}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewProduct(null)}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold text-xl flex items-center justify-center transition"
                    title="Close preview (Esc)"
                  >
                    ✕
                  </button>
                </div>

                {/* Main Enlarged Image */}
                <div
                  className="relative max-w-4xl w-full max-h-[72vh] flex items-center justify-center p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {productImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImgIdx((prev) => (prev > 0 ? prev - 1 : productImages.length - 1))
                      }
                      className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-cyan-600 border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold transition shadow-2xl z-10"
                      title="Previous image (← Arrow key)"
                    >
                      ‹
                    </button>
                  )}

                  <img
                    src={productImages[previewImgIdx]}
                    alt={`${previewProduct.name} Preview`}
                    className="max-h-[68vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 bg-black/40"
                  />

                  {productImages.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImgIdx((prev) => (prev < productImages.length - 1 ? prev + 1 : 0))
                      }
                      className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-cyan-600 border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-3xl font-bold transition shadow-2xl z-10"
                      title="Next image (→ Arrow key)"
                    >
                      ›
                    </button>
                  )}
                </div>

                {/* Bottom Thumbnails */}
                {productImages.length > 1 && (
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {productImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImgIdx(i)}
                        className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                          i === previewImgIdx
                            ? 'ring-2 ring-cyan-400 scale-110 shadow-lg opacity-100'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        <img src={img} alt={`thumb-${i}`} className="w-12 h-12 object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </Layout>
  );
}
