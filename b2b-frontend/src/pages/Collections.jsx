import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GRADIENT_OPTS = [
  'bg-gradient-to-br from-pink-100 to-purple-100',
  'bg-gradient-to-br from-blue-100 to-cyan-100',
  'bg-gradient-to-br from-pink-100 to-rose-100',
  'bg-gradient-to-br from-purple-100 to-indigo-100',
  'bg-gradient-to-br from-blue-100 to-slate-100',
  'bg-gradient-to-br from-amber-100 to-orange-100',
  'bg-gradient-to-br from-teal-100 to-green-100',
  'bg-gradient-to-br from-red-100 to-pink-100',
  'bg-gradient-to-br from-violet-100 to-purple-100',
];

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const res  = await fetch(`${API_URL}/collections`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');
        setCollections(data.data?.collections || []);
      } catch (err) {
        console.error('Collections fetch error:', err);
        setError('Could not load collections. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white pt-20 pb-20">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">Collections</h1>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl aspect-[3/4] bg-gray-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-cyan-500 text-white rounded-full font-semibold hover:bg-cyan-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && collections.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No collections available yet. Check back soon!</p>
          </div>
        )}

        {/* Categories Grid */}
        {!loading && !error && collections.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {collections.map((category, i) => (
              <Link
                key={category._id}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/4] sm:aspect-square flex items-center justify-center ${GRADIENT_OPTS[i % GRADIENT_OPTS.length]} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
              >
                {/* Image */}
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-7xl font-black opacity-20 text-gray-700">
                    {category.name?.charAt(0)}
                  </span>
                )}

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

                {/* Category Label */}
                <div className="absolute bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 bg-white text-gray-900 font-bold px-4 sm:px-6 py-2 rounded-full shadow-lg text-xs sm:text-sm tracking-wide text-center whitespace-normal sm:whitespace-nowrap">
                  {category.name}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Collections;
