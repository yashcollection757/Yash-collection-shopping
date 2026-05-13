import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// CSS for select dropdown styling
const selectStyles = `
  select {
    color-scheme: light;
  }
  select option {
    background-color: white;
    color: #1b2f3e;
    padding: 8px 12px;
  }
  select option:checked {
    background: #1dbbcc;
    background-color: #1dbbcc;
    color: white;
  }
`;

const prices = [
  { range: '₹0 to ₹500',       min: 0,    max: 500,      count: null },
  { range: '₹500 to ₹1000',    min: 500,  max: 1000,     count: null },
  { range: '₹1000 to ₹1500',   min: 1000, max: 1500,     count: null },
  { range: '₹1500 to ₹2500',   min: 1500, max: 2500,     count: null },
  { range: 'more than ₹2500',  min: 2500, max: Infinity,  count: null },
];

const Shop = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSizes, setSelectedSizes]           = useState([]);
  const [selectedPrices, setSelectedPrices]         = useState([]);
  const [sortBy, setSortBy]                         = useState('default');
  const [searchTerm, setSearchTerm]                 = useState('');

  /* ── Read category from URL ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category');
    const search = params.get('search');
    if (cat) {
      setSelectedCategories([cat]);
    }
    if (search) {
      setSearchTerm(search);
    } else {
      setSearchTerm('');
    }
  }, [location.search]);

  /* ── Fetch products from backend ── */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data.data?.products || []);
      } catch (err) {
        console.error('Shop fetch error:', err);
        setError('Could not load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ── Unique sizes from all variants ── */
  const allSizes = useMemo(() => {
    const s = new Set();
    products.forEach(p => p.variants?.forEach(v => s.add(v.size)));
    return Array.from(s);
  }, [products]);

  /* ── Dynamic Categories from Products ── */
  const dynamicCategories = useMemo(() => {
    const s = new Set(selectedCategories); // ensure URL category is always shown
    products.forEach(p => { if (p.category) s.add(p.category); });
    return Array.from(s).sort();
  }, [products, selectedCategories]);

  /* ── Filters ── */
  const toggle = (setter) => (val) =>
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const toggleCategory = toggle(setSelectedCategories);
  const toggleSize     = toggle(setSelectedSizes);
  const togglePrice    = toggle(setSelectedPrices);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedPrices([]);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedSizes.length > 0 || selectedPrices.length > 0;

  /* ── Filter + sort ── */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (selectedCategories.length > 0)
      list = list.filter(p => selectedCategories.includes(p.category));

    if (selectedSizes.length > 0)
      list = list.filter(p =>
        p.variants?.some(v => selectedSizes.includes(v.size))
      );

    if (selectedPrices.length > 0) {
      list = list.filter(p => {
        const minP = Math.min(...(p.variants?.map(v => v.price) || [Infinity]));
        return selectedPrices.some(r => {
          const range = prices.find(pr => pr.range === r);
          return range && minP >= range.min && minP <= range.max;
        });
      });
    }

    if (sortBy === 'price-low')
      list.sort((a, b) =>
        Math.min(...a.variants.map(v => v.price)) - Math.min(...b.variants.map(v => v.price)));
    else if (sortBy === 'price-high')
      list.sort((a, b) =>
        Math.min(...b.variants.map(v => v.price)) - Math.min(...a.variants.map(v => v.price)));
    else if (sortBy === 'newest')
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return list;
  }, [products, selectedCategories, selectedSizes, selectedPrices, sortBy]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ─── Sidebar checkbox style ─── */
  const SidebarCheck = ({ checked, onChange, label, count }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange}
        className="w-4 h-4 text-brand-900 rounded" />
      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{label}</span>
      {count != null && <span className="text-xs text-gray-400">{count}</span>}
    </label>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <style>{selectStyles}</style>

      {/* Breadcrumb */}
      <div className="bg-white border-b py-3 sm:py-4">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            <span className="hover:text-brand-900 cursor-pointer transition-colors" onClick={() => navigate('/')}>HOME</span>
            <span className="mx-2 text-gray-400">/</span>
            <span className="font-bold text-gray-900">SHOP</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">

        {/* Mobile Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 md:hidden">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl text-sm font-bold text-gray-700 bg-white hover:border-cyan-400 transition-all flex-1 sm:flex-none"
            style={{ borderColor: hasActiveFilters ? '#1dbbcc' : '#e5edf2' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="flex-1 text-left">{sidebarOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {hasActiveFilters && <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-cyan-600">{selectedCategories.length + selectedSizes.length + selectedPrices.length}</span>}
          </button>
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="appearance-none w-full px-4 py-3 pr-10 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all cursor-pointer bg-white"
              style={{
                borderColor: sortBy === 'default' ? '#e5edf2' : '#1dbbcc',
                color: '#1b2f3e',
              }}>
              <option value="default">Sort</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
              <option value="newest">Newest</option>
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        <div className="flex gap-6 lg:gap-8">

          {/* ── Sidebar ── */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block fixed md:relative inset-0 md:inset-auto z-40 md:z-0 w-full md:w-64 flex-shrink-0 bg-white md:border-r md:border-gray-100`}>
            {/* Mobile Overlay */}
            <div
              onClick={() => setSidebarOpen(false)}
              className={`${sidebarOpen ? 'fixed' : 'hidden'} inset-0 bg-black/50 z-30 md:hidden`}
            />
            {/* Mobile Header */}
            <div className="md:hidden flex justify-between items-center p-4 border-b bg-white sticky top-0 z-50 border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-140px)] md:max-h-none p-5 md:p-4 bg-white md:bg-gray-50/50">

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Active Filters</p>
                <div className="flex flex-wrap gap-2">
                  {[...selectedCategories, ...selectedSizes, ...selectedPrices].map(tag => (
                    <div key={tag} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-full text-xs font-medium text-cyan-700">
                      <span>{tag}</span>
                      <button onClick={() => {
                        if (selectedCategories.includes(tag)) toggleCategory(tag);
                        else if (selectedSizes.includes(tag)) toggleSize(tag);
                        else togglePrice(tag);
                      }} className="hover:bg-cyan-200 rounded-full p-0.5 transition-colors">×</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => { clearFilters(); setSidebarOpen(false); }} className="mt-4 text-sm font-bold text-cyan-600 hover:text-cyan-700 underline">
                  Clear all filters
                </button>
              </div>
            )}

            {/* Categories */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-800">Categories</h3>
              <ul className="space-y-2.5">
                {dynamicCategories.map(cat => (
                  <li key={cat}>
                    <SidebarCheck
                      checked={selectedCategories.includes(cat)}
                      onChange={() => { toggleCategory(cat); setSidebarOpen(false); }}
                      label={cat}
                      count={products.filter(p => p.category === cat).length || null}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Sizes */}
            {allSizes.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-800">Size</h3>
                <div className="space-y-2.5">
                  {allSizes.map(size => (
                    <SidebarCheck
                      key={size}
                      checked={selectedSizes.includes(size)}
                      onChange={() => { toggleSize(size); setSidebarOpen(false); }}
                      label={size}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-800">Price</h3>
              <div className="space-y-2.5">
                {prices.map(p => (
                  <SidebarCheck
                    key={p.range}
                    checked={selectedPrices.includes(p.range)}
                    onChange={() => { togglePrice(p.range); setSidebarOpen(false); }}
                    label={p.range}
                  />
                ))}
              </div>
            </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Header — desktop only */}
            <div className="hidden md:flex justify-between items-center mb-8 gap-4">
              <p className="text-sm font-medium text-gray-600">
                {loading ? 'Loading…' : `Showing ${filteredProducts.length} result${filteredProducts.length !== 1 ? 's' : ''}`}
              </p>
              <div className="relative inline-block min-w-max">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="appearance-none px-5 py-3 pr-10 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all cursor-pointer hover:border-cyan-300"
                  style={{
                    borderColor: sortBy === 'default' ? '#e5edf2' : '#1dbbcc',
                    backgroundColor: '#f8fafc',
                    color: '#1b2f3e',
                  }}>
                  <option value="default">Default sorting</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors" fill="none" stroke="#1dbbcc" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-100">
                    <div className="aspect-[450/560] bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-5 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center">
                <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4v2m0 6v.01M12 2.25c6.213 0 11.25 5.037 11.25 11.25S18.213 23.25 12 23.25 .75 18.213.75 12 5.787.75 12 .75z" />
                </svg>
                <p className="text-red-600 font-semibold mb-6">{error}</p>
                <button onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl font-bold text-white transition-all"
                  style={{ background: '#1dbbcc' }}>
                  Try Again
                </button>
              </div>
            )}

            {/* No products */}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="bg-white rounded-2xl border p-8 sm:p-16 text-center">
                <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 008.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <p className="text-gray-600 text-lg font-bold mb-2">
                  {products.length === 0 ? 'No products available' : 'No products match your filters'}
                </p>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filter criteria</p>
                {hasActiveFilters && (
                  <button onClick={() => { clearFilters(); setSidebarOpen(false); }}
                    className="px-6 py-3 rounded-xl font-bold text-white transition-all"
                    style={{ background: '#1dbbcc' }}>
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {filteredProducts.map(product => {
                  const minPrice = product.variants?.length
                    ? Math.min(...product.variants.map(v => v.price))
                    : 0;
                  const maxPrice = product.variants?.length
                    ? Math.max(...product.variants.map(v => v.price))
                    : 0;
                  const onSale = product.variants?.some(v => v.originalPrice > v.price);

                  return (
                    <div key={product._id}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-cyan-200 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/product/${product._id}`)}>

                      {/* Image Container */}
                      <div className="relative bg-gradient-to-br from-gray-50 via-gray-80 to-gray-100 aspect-[450/560] overflow-hidden">
                        <img
                          src={product.image || '/images/pro1.jpeg'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={e => { e.target.src = '/images/pro1.jpeg'; }}
                        />
                        {onSale && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 via-orange-450 to-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse">
                            SALE
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5 bg-gradient-to-b from-white to-gray-50/30">
                        <p className="text-xs font-bold uppercase tracking-widest mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">{product.category}</p>
                        <h3 className="text-sm font-black text-gray-900 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-600 transition-all">{product.name}</h3>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <span className="text-lg font-black bg-gradient-to-r from-cyan-500 to-cyan-600 text-transparent bg-clip-text">
                            ₹{minPrice.toLocaleString('en-IN')}
                            {maxPrice > minPrice && <span className="text-xs font-semibold text-gray-500"> – ₹{maxPrice.toLocaleString('en-IN')}</span>}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1">
                            <svg className="w-5 h-5 text-gradient-to-r from-cyan-500 to-blue-600" fill="none" stroke="url(#gradientIcon)" viewBox="0 0 24 24">
                              <defs>
                                <linearGradient id="gradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" style={{stopColor: '#06b6d4', stopOpacity: 1}} />
                                  <stop offset="100%" style={{stopColor: '#0ea5e9', stopOpacity: 1}} />
                                </linearGradient>
                              </defs>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
