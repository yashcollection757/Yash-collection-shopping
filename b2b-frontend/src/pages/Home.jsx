import React from 'react';
import Hero from '../components/home/Hero';
import Banners from '../components/home/Banners';
import PopularProducts from '../components/home/PopularProducts';
import MustHaves from '../components/home/MustHaves';

const Home = () => {
  return (
    <div className="w-full">
      <Hero />
      <Banners />
      <PopularProducts />
      <MustHaves />
    </div>
  );
};

export default Home;
