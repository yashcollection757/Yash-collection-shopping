import express from 'express';
import { getBanners, updateBanners } from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', getBanners);
router.put('/', updateBanners);

export default router;
