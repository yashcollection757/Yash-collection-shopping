import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const MIN_ORDER_QTY = 18;

const ProductDetail = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();

  const [product, setProduct]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantities, setQuantities]         = useState({});
  const [toast, setToast]                   = useState(null);
  const [previewImage, setPreviewImage]     = useState(null);

  /* ── Fetch product from backend ── */
  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load product');
      }

      setProduct(data.data?.product || null);
    } catch (err) {
      console.error('Product fetch error:', err);
      setProduct(null);
    }
  };

  useEffect(() => {
    const fetchProductInitial = async () => {
      try {
        setLoading(true);
        await fetchProduct();
      } finally {
        setLoading(false);
      }
    };

    fetchProductInitial();

    // Listen for stock updates from order placement
    const handleStockUpdate = () => {
      fetchProduct();
    };

    window.addEventListener('stockUpdated', handleStockUpdate);
    return () => window.removeEventListener('stockUpdated', handleStockUpdate);
  }, [id]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleQuantityChange = (variantId, value, maxStock) => {
    let newVal = Math.max(0, parseInt(value) || 0);
    if (maxStock !== undefined && newVal > maxStock) {
      newVal = maxStock;
      showToast('error', `Max available stock: ${maxStock} pieces`);
    }
    setQuantities(prev => ({ ...prev, [variantId]: newVal }));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (totalQty === 0) {
      showToast('error', 'Please select at least 1 piece to add to cart.');
      return;
    }

    const newItems = product.variants
      .filter(v => (quantities[v._id] || 0) > 0)
      .map(v => ({
        id: `${product._id}-${v._id}`,
        productId: product._id,
        variantId: v._id,
        name: product.name,
        size: v.size,
        sku: v.sku || `${product._id}-${v.size}`,
        price: v.price,
        quantity: quantities[v._id],
        maxStock: v.quantity,
        image: product.image,
        color: 'Default',
      }));

    try {
      const token = localStorage.getItem('token');
      const existing = JSON.parse(localStorage.getItem('cart') || '[]');
      let merged = [...existing];

      if (token) {
        // If logged in, call backend to reserve stock
        for (const item of newItems) {
          try {
            const res = await fetch(`${API_URL}/cart/add`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
              },
              body: JSON.stringify({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                size: item.size,
                sku: item.sku,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
              }),
            });

            const data = await res.json();

            if (!res.ok) {
              showToast('error', data.message || 'Failed to add to cart');
              return;
            }
          } catch (err) {
            console.error('Cart API error:', err);
            showToast('error', 'Failed to connect to server');
            return;
          }
        }
      }

      // Always update localStorage (for offline sync and Cart page display)
      newItems.forEach(ni => {
        const idx = merged.findIndex(e => e.id === ni.id);
        if (idx >= 0) {
          merged[idx].quantity += ni.quantity;
        } else {
          merged.push(ni);
        }
      });

      localStorage.setItem('cart', JSON.stringify(merged));
      window.dispatchEvent(new Event('cartUpdated'));

      const msg = token ? 'Stock reserved! Items added to cart.' : 'Items added to cart. (Login to reserve stock)';
      showToast('success', msg);
      setQuantities({});

      // Refetch product in real-time to show updated stock
      setTimeout(() => {
        fetchProduct();
      }, 300);
    } catch (e) {
      console.error('Add to cart error:', e);
      showToast('error', 'Failed to add to cart');
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="w-full bg-white pt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!product) {
    return (
      <div className="w-full bg-white">
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Product Not Found</h1>
          <button onClick={() => navigate('/shop')}
            className="bg-brand-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-800 transition">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const variant      = product.variants[selectedVariant] || product.variants[0];
  const allImages    = product.images && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : ['/images/pro1.jpeg']);
  const totalQty     = product.variants.reduce((sum, v) => sum + (quantities[v._id] || 0), 0);
  const totalAmount  = product.variants.reduce((sum, v) => sum + (quantities[v._id] || 0) * v.price, 0);
  const hasQty       = totalQty > 0;

  return (
    <div className="w-full bg-white">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full px-5 py-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
          toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : 'bg-white border-red-200 text-red-800'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {toast.type === 'success'
              ? <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            }
          </div>
          <div>
            <p className="font-bold text-sm">{toast.type === 'success' ? 'Added to Cart!' : 'Cannot Add'}</p>
            <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="border-b py-4">
        <div className="container mx-auto px-6">
          <button onClick={() => navigate('/shop')} className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Shop
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[550px] aspect-[5/4] shadow-sm border border-gray-100 flex items-center justify-center cursor-pointer group"
              onClick={() => setPreviewImage(allImages[selectedImageIndex])}>
              <img
                src={allImages[selectedImageIndex] || '/images/pro1.jpeg'}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                onError={e => { e.target.src = '/images/pro1.jpeg'; }}
              />
              <div className="absolute top-4 right-4 bg-white/90 text-gray-900 text-xs px-3 py-1 rounded-full font-semibold">
                {selectedImageIndex + 1}/{allImages.length}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-3">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                      selectedImageIndex === idx
                        ? 'border-cyan-500 ring-2 ring-cyan-300 scale-105 shadow-lg'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`thumbnail-${idx}`} 
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = '/images/pro1.jpeg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">{product.category}</p>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-2">{product.name}</h1>

            {product.variants?.length > 0 && (
              <p className="text-2xl font-bold text-gray-900 mb-6">
                ₹{Math.min(...product.variants.map(v => v.price)).toLocaleString('en-IN')}
                {' '}-{' '}
                ₹{Math.max(...product.variants.map(v => v.price)).toLocaleString('en-IN')}
              </p>
            )}

            {/* MOQ notice */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-amber-700">
                B2B Minimum Order: <span className="font-black">18 pieces total</span> — can be across multiple products
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-8">{product.description}</p>

            {/* Size buttons */}
            <div className="mb-8">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-bold">Select Size</p>
              <div className="flex flex-wrap gap-3">
                {product.variants?.map((v, idx) => (
                  <button key={v._id} onClick={() => { setSelectedVariant(idx); setQuantities({}); }}
                    className={`px-6 py-3 rounded-lg border-2 font-bold transition-all ${
                      selectedVariant === idx
                        ? 'border-brand-900 bg-brand-900 text-white shadow-lg'
                        : 'border-gray-300 text-gray-900 hover:border-gray-400 bg-white'
                    }`}>
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Variants table */}
            <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 font-bold text-gray-900 uppercase tracking-wide">SIZE</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900 uppercase tracking-wide">QUANTITY</th>
                      <th className="text-left py-4 px-6 font-bold text-gray-900 uppercase tracking-wide">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((v, idx) => {
                      const qty = quantities[v._id] || 0;
                      const inStock = v.quantity > 0;
                      return (
                        <tr key={v._id} className={`border-b border-gray-100 transition-colors ${inStock ? 'hover:bg-blue-50' : 'opacity-50 bg-gray-50'}`}>
                          <td className="py-4 px-6">
                            <button onClick={() => { setSelectedVariant(idx); setQuantities({}); }}
                              className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
                                selectedVariant === idx
                                  ? 'border-brand-900 bg-brand-900 text-white shadow-md'
                                  : 'border-gray-300 text-gray-900 hover:border-brand-900 bg-white'
                              }`}>
                              {v.size}
                            </button>
                            {inStock ? <span className="ml-2 text-xs text-green-600 font-semibold">{v.quantity} in stock</span> : <span className="ml-2 text-xs text-red-500 font-semibold">Out of Stock</span>}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg w-fit">
                              <button onClick={() => handleQuantityChange(v._id, Math.max(0, qty - 6), v.quantity)} disabled={!inStock || qty <= 0}
                                className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-bold">−</button>
                              <input type="number" value={qty} step="1" min="0" max={v.quantity}
                                onChange={e => {
                                  let val = parseInt(e.target.value) || 0;
                                  if (val > v.quantity) val = v.quantity;
                                  handleQuantityChange(v._id, val, v.quantity);
                                }}
                                disabled={!inStock}
                                className="w-12 text-center py-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed font-bold" />
                              <button onClick={() => handleQuantityChange(v._id, Math.min(v.quantity, qty + 6), v.quantity)} disabled={!inStock || qty >= v.quantity}
                                className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-bold">+</button>
                            </div>
                          </td>
                          <td className="py-4 px-6"><span className="font-bold text-gray-900">₹{v.price.toLocaleString('en-IN')}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {product.variants?.map((v, idx) => {
                  const qty = quantities[v._id] || 0;
                  const inStock = v.quantity > 0;
                  return (
                    <div key={v._id} className={`p-4 ${inStock ? '' : 'opacity-50 bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedVariant(idx); setQuantities({}); }}
                            className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
                              selectedVariant === idx
                                ? 'border-brand-900 bg-brand-900 text-white shadow-md'
                                : 'border-gray-300 text-gray-900 bg-white'
                            }`}>
                            {v.size}
                          </button>
                          {inStock
                            ? <span className="text-xs text-green-600 font-semibold">{v.quantity} in stock</span>
                            : <span className="text-xs text-red-500 font-semibold">Out of Stock</span>
                          }
                        </div>
                        <span className="font-bold text-gray-900 text-base">₹{v.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg w-fit">
                        <button onClick={() => handleQuantityChange(v._id, Math.max(0, qty - 6), v.quantity)} disabled={!inStock || qty <= 0}
                          className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-bold">−</button>
                        <input type="number" value={qty} step="1" min="0" max={v.quantity}
                          onChange={e => {
                            let val = parseInt(e.target.value) || 0;
                            if (val > v.quantity) val = v.quantity;
                            handleQuantityChange(v._id, val, v.quantity);
                          }}
                          disabled={!inStock}
                          className="w-14 text-center py-2 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed font-bold text-base" />
                        <button onClick={() => handleQuantityChange(v._id, Math.min(v.quantity, qty + 6), v.quantity)} disabled={!inStock || qty >= v.quantity}
                          className="px-3 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed font-bold">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button onClick={handleAddToCart} disabled={!hasQty}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                  hasQty
                    ? 'bg-brand-900 text-white hover:bg-brand-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}>
                {hasQty
                  ? '🛒  ADD TO CART'
                  : 'SELECT QUANTITY TO ORDER'
                }
              </button>
            </div>

            {/* Availability / Shipping */}
            <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-bold">AVAILABILITY</p>
                <p className="font-semibold text-gray-900">{(variant?.quantity || 0) > 0 ? `${variant.quantity} in stock` : 'Out of Stock'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-bold">SHIPPING</p>
                <p className="font-semibold text-gray-900">Approved by Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition z-10 shadow-lg"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="flex items-center justify-center h-full bg-gray-50 p-4">
              <img
                src={previewImage}
                alt="preview"
                className="max-w-full max-h-[80vh] object-contain"
                onError={e => { e.target.src = '/images/pro1.jpeg'; }}
              />
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
              {selectedImageIndex + 1} / {allImages.length}
            </div>

            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const newIdx = (selectedImageIndex - 1 + allImages.length) % allImages.length;
                    setSelectedImageIndex(newIdx);
                    setPreviewImage(allImages[newIdx]);
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition shadow-lg z-20"
                >
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const newIdx = (selectedImageIndex + 1) % allImages.length;
                    setSelectedImageIndex(newIdx);
                    setPreviewImage(allImages[newIdx]);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition shadow-lg z-20"
                >
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
