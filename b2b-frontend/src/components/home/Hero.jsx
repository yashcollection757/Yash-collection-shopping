import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative w-full flex items-center min-h-screen bg-[#f8fbfe] pt-20 pb-10 overflow-hidden">

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="max-w-xl text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-brand-900 leading-[1.1] mb-4 sm:mb-6 tracking-tight">
              Premium <br /> Kids Wear
            </h1>
            <p className="text-brand-600 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed font-medium">
              Elevate your retail collection with our premium kids' wear. High-quality fabrics, vibrant designs, and wholesale pricing that maximizes your margins. Built for comfort, styled for everyday adventures!
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8">
              <Link to="/shop">
                <button 
                  className="text-white font-bold text-sm tracking-wider uppercase px-8 sm:px-10 py-3 sm:py-4 rounded-full shadow-[0_8px_20px_rgba(27,47,62,0.3)] transition-all hover:-translate-y-0.5"
                  style={{ background: '#1b2f3e' }}
                  onMouseOver={e => e.currentTarget.style.background = '#1dbbcc'}
                  onMouseOut={e => e.currentTarget.style.background = '#1b2f3e'}
                >
                  Shop Now
                </button>
              </Link>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex items-center justify-center lg:justify-end w-full mt-8 lg:mt-0">
            <div className="relative w-full max-w-[320px] sm:max-w-[450px] lg:max-w-[650px] h-[300px] sm:h-[400px] lg:h-[480px] bg-gradient-to-b from-brand-50 to-brand-100/50 rounded-[2rem] sm:rounded-[2.5rem] border-[4px] sm:border-[6px] border-white shadow-2xl flex items-center justify-center overflow-hidden group">
              <img 
                src="/images/newhero.png" 
                alt="Kids illustration" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Hero;
