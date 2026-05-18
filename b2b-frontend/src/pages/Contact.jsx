import React from 'react';

const Contact = () => {
  return (
    <div className="w-full min-h-screen bg-white pt-32 pb-24 font-sans">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-brand-50 text-brand-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-block">
            Contact Us
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Get In Touch
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            We'd love to hear from you. Reach out to us through any of the channels below.
          </p>
        </div>

        {/* Contact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          
          {/* Phone Card */}
          <div className="bg-[#f9fafc] p-8 rounded-3xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100 group text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#1dbbcc] mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-500 text-sm mb-4">Mon-Sat, 10am to 7pm</p>
            <a href="tel:+919836190771" className="text-[#1dbbcc] font-bold text-lg hover:underline block">+91 98361 90771</a>
          </div>

          {/* Email Card */}
          <div className="bg-[#f9fafc] p-8 rounded-3xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100 group text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#1dbbcc] mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-500 text-sm mb-4">We reply within 24 hours</p>
            <a href="mailto:yashcollection757@gmail.com" className="text-[#1dbbcc] font-bold text-base hover:underline block break-all">yashcollection757@gmail.com</a>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-[#f9fafc] p-8 rounded-3xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100 group text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#1dbbcc] mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp</h3>
            <p className="text-gray-500 text-sm mb-4">Quick chat support</p>
            <a href="https://wa.me/919836190771" target="_blank" rel="noopener noreferrer" className="text-[#1dbbcc] font-bold text-lg hover:underline block">+91 98361 90771</a>
          </div>

        </div>

        {/* Address Section */}
        <div className="bg-[#f9fafc] rounded-3xl p-8 md:p-12 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#1dbbcc] shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Our Address</h3>
              <p className="text-gray-500 text-base leading-relaxed">
                Yash Collections<br />
                Wholesale Clothing & Fashion<br />
                Howrah, West Bengal, India
              </p>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="mt-8 bg-[#f9fafc] rounded-3xl p-8 md:p-12 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#1dbbcc] shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Monday - Saturday</span>
                  <span className="font-bold text-gray-900">10:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-gray-500">Sunday</span>
                  <span className="font-bold text-red-500">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
