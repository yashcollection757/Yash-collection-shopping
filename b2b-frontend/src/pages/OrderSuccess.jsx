import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white min-h-screen flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Shopping Bag Illustration */}
        <div className="flex justify-center mb-8 relative">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <svg className="w-64 h-64 text-brand-900" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,97.4,-2.4C98,13.3,93.2,29.3,84.1,42.5C75,55.7,61.6,66.1,46.8,73.8C32,81.5,16,86.5,0.1,86.3C-15.8,86.1,-31.6,80.7,-45.3,72C-59,63.3,-70.6,51.3,-78.9,37C-87.2,22.7,-92.2,6.1,-90.4,-9.6C-88.6,-25.3,-80,-40.1,-68.1,-51.2C-56.2,-62.3,-41.1,-69.7,-26.8,-75C-12.5,-80.3,1.1,-83.5,15.6,-81.4C30.1,-79.3,44.5,-71.9,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>

          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-brand-900 z-10 relative">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
            
            {/* Sparkles */}
            <path d="M19 2l2 2-2 2-2-2 2-2z" fill="currentColor"></path>
            <path d="M4 14l1.5 1.5-1.5 1.5-1.5-1.5L4 14z" fill="currentColor"></path>
          </svg>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-brand-900 mb-4">
          Your Order Has Been Placed!
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          We'll notify you once your order ships.
        </p>

        <button
          onClick={() => navigate('/profile')}
          className="bg-brand-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-800 transition-colors shadow-lg hover:shadow-xl inline-flex items-center gap-2"
        >
          Track Order
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;
