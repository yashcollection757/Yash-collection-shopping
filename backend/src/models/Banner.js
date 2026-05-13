import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  banner1: { type: String, default: '/images/pro4.jpeg' },
  banner2: { type: String, default: '/images/pro5.jpeg' },
  banner3: { type: String, default: '/images/pro6.jpeg' },
});

export default mongoose.model('Banner', bannerSchema);
