import Banner from '../models/Banner.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getBanners = async (req, res) => {
  try {
    let banner = await Banner.findOne();
    if (!banner) {
      banner = await Banner.create({});
    }
    return sendSuccess(res, 'Banners retrieved', { banner });
  } catch (error) {
    return sendError(res, 500, 'Server Error');
  }
};

export const updateBanners = async (req, res) => {
  try {
    let banner = await Banner.findOne();
    if (!banner) {
      banner = await Banner.create({});
    }
    const { banner1, banner2, banner3 } = req.body;
    if (banner1) banner.banner1 = banner1;
    if (banner2) banner.banner2 = banner2;
    if (banner3) banner.banner3 = banner3;
    await banner.save();
    return sendSuccess(res, 'Banners updated', { banner });
  } catch (error) {
    return sendError(res, 500, 'Server Error');
  }
};
