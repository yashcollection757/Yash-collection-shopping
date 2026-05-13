import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    try {
      const data = localStorage.getItem('user');
      if (data && data !== 'undefined') {
        const u = JSON.parse(data);
        setUserName(u.name ? u.name.charAt(0).toUpperCase() : '?');
      }
    } catch (e) {}
  }, [location]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const loadCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    } catch (e) { setCartCount(0); }
  };

  useEffect(() => {
    loadCartCount();
    window.addEventListener('cartUpdated', loadCartCount);
    return () => window.removeEventListener('cartUpdated', loadCartCount);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Collections', path: '/collections' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-brand-100">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-brand-900 flex items-center justify-center shadow-md group-hover:bg-brand-600 transition-colors duration-300">
            <span className="text-white font-black text-xl leading-none">Y</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black text-brand-900 tracking-tight">Yash</span>
            <span className="text-[9px] font-bold tracking-[0.3em] text-brand-300 uppercase mt-0.5">Collection</span>
          </div>
        </Link>

        {/* Navigation — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-[13px] font-bold uppercase tracking-wide transition-colors duration-200 whitespace-nowrap ${
                location.pathname === item.path
                  ? 'text-accent-cyan border-b-2 border-accent-cyan pb-0.5'
                  : 'text-brand-600 hover:text-brand-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Search — visible on lg+ */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            }}
            className="hidden lg:flex items-center bg-brand-50 border border-brand-100 rounded-full px-4 py-2 gap-2 w-44 focus-within:border-brand-600 transition-colors"
          >
            <svg className="w-4 h-4 text-brand-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-brand-900 placeholder-brand-300 focus:outline-none w-full"
            />
          </form>

          {/* Profile or Login */}
          {isLoggedIn ? (
            <Link to="/profile" className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-900 to-accent-cyan text-white font-black text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" title="My Profile">
              {userName || '?'}
            </Link>
          ) : (
            <Link to="/login" className="hidden sm:block text-[13px] font-bold text-brand-600 hover:text-brand-900 transition-colors uppercase tracking-wide whitespace-nowrap">
              Login
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative flex items-center gap-1.5 bg-accent-cyan hover:bg-brand-600 text-white px-3 sm:px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            <span className="absolute -top-1.5 -right-1.5 bg-accent-orange text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">{cartCount}</span>
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-lg border border-brand-100 bg-white gap-1.5"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-brand-900 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-brand-900 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-brand-900 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-brand-100 shadow-lg px-6 pb-6 pt-4 flex flex-col gap-4 animate-fade-in">
          {/* Mobile Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                setMenuOpen(false);
              }
            }}
            className="flex items-center bg-brand-50 border border-brand-100 rounded-full px-4 py-2 gap-2"
          >
            <svg className="w-4 h-4 text-brand-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-brand-900 placeholder-brand-300 focus:outline-none w-full"
            />
          </form>

          {/* Nav Links */}
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`text-base font-bold uppercase tracking-wide py-1 border-b border-brand-50 ${
                location.pathname === item.path ? 'text-accent-cyan' : 'text-brand-700'
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Login/Profile */}
          {isLoggedIn ? (
            <Link to="/profile" className="text-base font-bold text-brand-700 uppercase tracking-wide py-1">
              My Profile
            </Link>
          ) : (
            <Link to="/login" className="text-base font-bold text-brand-700 uppercase tracking-wide py-1">
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
