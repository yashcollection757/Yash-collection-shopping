import React, { useState, useEffect } from 'react';
import { collectionAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

const MustHaves = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    collectionAPI.getAllCollections()
      .then(res => {
        setCollections(res.data?.collections || []);
      })
      .catch(err => console.error('Failed to load collections', err))
      .finally(() => setLoading(false));
  }, []);

  const displayedCollections = showAll ? collections : collections.slice(0, 10);

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-10">
          <p className="text-accent-cyan text-xs font-bold uppercase tracking-[0.3em] mb-2">Curated For You</p>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-900 uppercase tracking-widest">Collections</h2>
        </div>

        {/* Grid — 2 cols on mobile, 4 on tablet, 5 on desktop */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-900 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
              {displayedCollections.map((item, i) => (
                <div 
                  key={item._id || i} 
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(item.name)}`)}
                  className={`group relative cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gray-50 border border-gray-100 ${!showAll && i >= 8 ? 'hidden lg:block' : ''}`}
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  {/* Elegant Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b2f3e]/90 via-[#1b2f3e]/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-4 sm:p-5 flex items-end justify-center">
                    <h3 className="text-white text-center text-xs sm:text-sm font-bold tracking-widest uppercase drop-shadow-md translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                      {item.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Button */}
            {collections.length > 10 && (
              <div className="text-center mt-12">
                <Link
                  to="/collections"
                  className="inline-block px-10 py-3.5 bg-brand-900 border-2 border-brand-900 text-white font-bold uppercase tracking-wider text-sm rounded-lg shadow-md hover:bg-white hover:text-brand-900 hover:-translate-y-0.5 transition-all duration-300"
                >
                  More Collection Type
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MustHaves;
