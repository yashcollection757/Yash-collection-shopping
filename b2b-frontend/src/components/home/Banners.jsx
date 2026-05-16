import React, { useState, useEffect } from 'react';
import { bannerAPI } from '../../services/api';

const Banners = () => {
  const [banners, setBanners] = useState({ 
    banner1: '/images/pro4.jpeg', 
    banner2: '/images/pro5.jpeg', 
    banner3: '/images/pro6.jpeg' 
  });

  useEffect(() => {
    bannerAPI.getBanners()
      .then(data => {
        if (data.data?.banner) {
          setBanners(data.data.banner);
        }
      })
      .catch(err => console.error('Failed to load banners', err));
  }, []);

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* NEW OFFERS TITLE ADDED AS REQUESTED */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 inline-block relative">
            New Offers
            <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-[#1dbbcc] rounded-full"></span>
          </h2>
          <p className="text-gray-500 mt-5 font-medium">Grab the best deals before they are gone!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Large Banner 1 */}
          <div className="rounded-2xl relative overflow-hidden min-h-[300px] sm:min-h-[420px] shadow-sm hover:shadow-md transition-shadow group">
            <img
              src={banners.banner1}
              alt="Banner 1"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Right — 2 small banners stacked */}
          <div className="flex flex-col gap-5">
            {/* Small Banner 2 */}
            <div className="rounded-2xl relative overflow-hidden flex-1 min-h-[170px] sm:min-h-[200px] shadow-sm hover:shadow-md transition-shadow group">
              <img
                src={banners.banner2}
                alt="Banner 2"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Small Banner 3 */}
            <div className="rounded-2xl relative overflow-hidden flex-1 min-h-[170px] sm:min-h-[200px] shadow-sm hover:shadow-md transition-shadow group">
              <img
                src={banners.banner3}
                alt="Banner 3"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banners;
