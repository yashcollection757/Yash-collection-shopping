import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  const MIN_ORDER_QTY = 18;
  const MAX_ORDER_VALUE = 67000;

  useEffect(() => {
    loadCart();

    // Listen for cart updates from other pages/tabs
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) setCartItems(JSON.parse(saved));
    } catch (e) {
      setCartItems([]);
    }
  };

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
    // Update navbar count
    window.dispatchEvent(new Event('cartUpdated'));

    // Sync with backend database (async, non-blocking)
    const token = localStorage.getItem('token');
    if (token) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      fetch(`${apiUrl}/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      }).catch(() => {
        // Silent fail - cart is already in localStorage
      });
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity <= 0) {
      saveCart(cartItems.filter(item => item.id !== id));
    } else {
      const targetItem = cartItems.find(item => item.id === id);
      if (!targetItem) return;
      
      // Enforce max stock strictly
      let finalQuantity = Math.max(0, parseInt(newQuantity) || 0);
      if (targetItem.maxStock !== undefined) {
        finalQuantity = Math.min(finalQuantity, targetItem.maxStock);
      }
      
      if (finalQuantity === 0) {
        saveCart(cartItems.filter(item => item.id !== id));
        return;
      }
      
      const updated = cartItems.map(item =>
        item.id === id ? { ...item, quantity: finalQuantity } : item
      );
      const newTotal = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);
      if (newTotal > MAX_ORDER_VALUE) {
        alert(`Maximum order value is ₹${MAX_ORDER_VALUE.toLocaleString('en-IN')}. Please reduce quantity.`);
        return;
      }
      saveCart(updated);
    }
  };

  const handleRemoveItem = (id) => {
    saveCart(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 200;
  const total = subtotal + shipping;
  const overLimit = subtotal > MAX_ORDER_VALUE;
  const moqMet = totalItems >= MIN_ORDER_QTY;

  if (cartItems.length === 0) {
    return (
      <div className="w-full bg-white min-h-screen">
        <div className="container mx-auto px-6 py-32 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-8">Add products from the shop to get started</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-brand-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-brand-600 transition-all shadow-lg"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen pt-20">
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-6xl">
        <h1 className="text-3xl font-black text-brand-900 mb-8">
          Shopping Cart
          <span className="ml-3 text-lg font-semibold text-gray-500">({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
                
                {/* Top Section: Image & Details */}
                <div className="flex gap-4 w-full sm:w-auto flex-1">
                  <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-100 shrink-0" />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 line-clamp-1 sm:truncate text-sm sm:text-base">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium bg-gray-100 w-fit px-2 py-0.5 rounded-md">Size: {item.size}</p>
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="sm:hidden text-gray-400 hover:text-red-500 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <p className="text-sm font-black text-brand-900 mt-2">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Bottom Section: Quantity & Total */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 mt-2 sm:mt-0">
                  <div className="flex flex-col">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm w-fit">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 6)}
                        disabled={item.quantity <= 0}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-brand-900 font-bold hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                      >−</button>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        min="0" 
                        max={item.maxStock || 999}
                        onChange={e => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-12 sm:w-14 text-center py-1.5 sm:py-2 focus:outline-none font-bold text-sm bg-white border-x border-gray-200"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 6)}
                        disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-brand-900 font-bold hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                      >+</button>
                    </div>
                    {item.maxStock !== undefined && (
                      <span className="text-[10px] text-gray-400 mt-1 pl-1 font-medium">Max available: {item.maxStock}</span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 font-medium mb-0.5 sm:hidden">Total</p>
                    <p className="font-black text-gray-900 text-base sm:text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    <button onClick={() => handleRemoveItem(item.id)} className="hidden sm:inline-block text-red-500 text-xs font-semibold hover:text-red-700 mt-1 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>

              </div>
            ))}

            <button onClick={() => navigate('/shop')} className="text-accent-cyan font-bold text-sm hover:underline mt-2 inline-flex items-center gap-1">
              ← Continue Shopping
            </button>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
              <h2 className="text-xl font-black text-gray-900 mb-5">Order Summary</h2>

              {/* Max limit warning */}
              {overLimit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
                  ⚠️ Max value per order is ₹{MAX_ORDER_VALUE.toLocaleString('en-IN')}. Please reduce quantity for this order (you can place multiple orders for remaining items).
                </div>
              )}

              {/* MOQ warning */}
              {!moqMet && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
                  <span className="block mb-1">Minimum Order: <span className="font-black">{MIN_ORDER_QTY} pieces total</span></span>
                  You have {totalItems} piece{totalItems !== 1 ? 's' : ''}. Add {MIN_ORDER_QTY - totalItems} more.
                </div>
              )}

              {/* Notice */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-500 text-center">
                Max value per order: ₹62,000 – ₹67,000<br/>
                <span className="text-[10px]">(You can place multiple orders)</span>
              </div>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({totalItems} items)</span>

                  <span className={`font-bold ${overLimit ? 'text-red-600' : 'text-gray-900'}`}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-bold">{shipping === 0 ? <span className="text-green-600">FREE</span> : `₹${shipping}`}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-black text-gray-900 text-lg">Total</span>
                <span className={`font-black text-2xl ${overLimit ? 'text-red-600' : 'text-brand-900'}`}>
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                disabled={overLimit || !moqMet}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all mb-3 ${
                  overLimit || !moqMet
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-brand-900 text-white hover:bg-brand-600 shadow-lg hover:shadow-xl'
                }`}
              >
                {!moqMet ? `ADD ${MIN_ORDER_QTY - totalItems} MORE TO CHECKOUT` : 'PROCEED TO CHECKOUT'}
              </button>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
