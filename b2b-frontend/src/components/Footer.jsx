import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full">
      {/* Main Footer */}
      <div className="bg-gray-900 text-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-8">

            {/* Brand — full width on mobile */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-cyan flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-lg">Y</span>
                </div>
                <div>
                  <p className="font-black text-white text-lg leading-none">Yash</p>
                  <p className="text-[9px] tracking-[0.25em] text-gray-400 font-bold uppercase mt-0.5">Collection</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-xs">
                Premium kids wear collection with authentic quality and affordable prices for B2B businesses.
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-gray-300">📍 Howrah, West Bengal</p>
                <p className="font-semibold text-gray-300">📞 9836190771</p>
                <p className="text-gray-400">✉ yashcollection757@gmail.com</p>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs border-l-2 border-accent-cyan pl-3">Company</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Shop', path: '/shop' },
                  { label: 'Collections', path: '/collections' },
                  { label: 'About Us', path: '#' },
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.path} className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs border-l-2 border-accent-cyan pl-3">Support</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: 'Contact Us', path: '/contact' },
                ].map(item => (
                  <li key={item.label}>
                    <Link to={item.path} className="text-gray-400 hover:text-cyan-400 transition-colors duration-200">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social & Hours — full width on smallest, normal on sm+ */}
            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs border-l-2 border-accent-cyan pl-3">Connect</h4>
              <div className="space-y-4">
                {/* Social Links */}
                <div className="flex gap-3">
                  <a href="https://wa.me/919836190771" target="_blank" rel="noopener noreferrer" 
                    className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-lg flex items-center justify-center transition-all duration-200 group"
                    title="WhatsApp">
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-all duration-200 group"
                    title="Instagram">
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </a>
                </div>
                {/* Hours */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <p className="text-xs font-bold text-cyan-400 uppercase tracking-wide mb-1">Hours</p>
                  <p className="text-sm font-semibold text-gray-200">24/7 Available</p>
                  <p className="text-xs text-gray-400 mt-1">Always ready to serve you!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-6 sm:pt-8 mt-6 sm:mt-8 text-center sm:text-left">
            <p className="text-sm text-gray-400">© {currentYear} Yash Collection. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

