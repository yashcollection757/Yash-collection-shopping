import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../services/api';

const tabs = ['Featured', 'Latest', 'Popular'];

const PopularProducts = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch a larger set so we can sort/slice meaningfully
        const data = await productAPI.getAllProducts({ limit: 20 });
        let list = data.data?.products || [];

        if (activeTab === 0) {
          // Featured — shuffle for a "curated" feel
          list = [...list].sort(() => Math.random() - 0.5);
        } else if (activeTab === 1) {
          // Latest — newest first
          list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (activeTab === 2) {
          // Popular — highest price first (proxy for "premium/popular")
          list = [...list].sort((a, b) => {
            const aMax = Math.max(...(a.variants?.map(v => v.price) || [0]));
            const bMax = Math.max(...(b.variants?.map(v => v.price) || [0]));
            return bMax - aMax;
          });
        }

        setProducts(list.slice(0, 4));
      } catch (err) {
        console.error('PopularProducts fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeTab]);

  const getMinPrice = (variants) => {
    if (!variants?.length) return null;
    return Math.min(...variants.map(v => v.price));
  };

  return (
    <section className="py-14 md:py-20 bg-brand-50/50">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        {/* Header */}
        <p className="text-accent-cyan text-xs font-bold uppercase tracking-[0.3em] mb-2">Trending Now</p>
        <h2 className="text-2xl sm:text-3xl font-black text-brand-900 mb-3">Popular Products</h2>
        <div className="w-12 h-[3px] bg-accent-cyan mx-auto mb-8"></div>

        {/* Tabs — scrollable on mobile, centered on desktop */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="inline-flex border border-brand-100 rounded-full bg-white shadow-sm overflow-hidden shrink-0">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 sm:px-7 py-2.5 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === i
                    ? 'bg-accent-cyan text-white'
                    : 'text-brand-600 hover:bg-brand-50'
                } ${i > 0 ? 'border-l border-brand-100' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-brand-100 rounded-2xl overflow-hidden bg-white animate-pulse">
                <div className="aspect-[450/560] bg-gray-200" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {products.map((item) => {
              const minPrice = getMinPrice(item.variants);
              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/product/${item._id}`)}
                  className="border border-brand-100 rounded-2xl overflow-hidden relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white text-left cursor-pointer"
                >
                  {/* Image */}
                  <div className="aspect-[450/560] overflow-hidden bg-brand-50">
                    <img
                      src={item.image || '/images/pro1.jpeg'}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={e => { e.target.src = '/images/pro1.jpeg'; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-bold text-brand-900 mb-1 line-clamp-1">{item.name}</p>
                    {minPrice != null && (
                      <p className="text-brand-900 font-black text-sm sm:text-base">
                        ₹{minPrice.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div className="py-12">
            <p className="text-brand-400 text-sm">No products yet. Check back soon!</p>
          </div>
        )}

        {/* View All */}
        <div className="mt-10 sm:mt-12">
          <button
            onClick={() => navigate('/shop')}
            className="border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white px-8 sm:px-10 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all duration-300"
          >
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default PopularProducts;
