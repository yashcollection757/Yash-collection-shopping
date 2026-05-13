import multer from 'multer';
import path from 'path';

// Configure storage - store in memory (buffer → Cloudinary)
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB   = 1;

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024, // 1 MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

    const isValidMime = ALLOWED_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/');
    const isValidExt = allowedExts.includes(ext);

    if (!isValidMime && !isValidExt) {
      return cb(new Error(`Only JPG, JPEG, PNG images are allowed (max 1 MB). Got: ${ext}`), false);
    }
    cb(null, true);
  },
});

export default upload;


