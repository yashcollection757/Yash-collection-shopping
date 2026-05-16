import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/auth.js';
import { logger } from './utils/logger.js';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants/appConstants.js';
import { sendError } from './utils/apiResponse.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

// Load env variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

// ============ MIDDLEWARE STACK ============

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
});

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// GZip compression — reduces response size up to 70%
app.use(compression());

// Keep-alive for faster repeated requests
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=30');
  next();
});

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ============ API ROUTES ============

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api', uploadRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/contact', contactRoutes);

// ============ ERROR HANDLERS ============

// 404 handler
app.use((req, res, next) => {
  return sendError(
    res, 
    HTTP_STATUS.NOT_FOUND, 
    `Route ${req.method} ${req.path} not found`
  );
});

// Global error handling middleware (MUST be second to last)
app.use(errorHandler);

// Final catch-all for any remaining errors
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  
  logger.error('Unhandled error in final middleware', { error: err.message });
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    statusCode: HTTP_STATUS.INTERNAL_ERROR,
    message: ERROR_MESSAGES.SERVER_ERROR
  });
});

// ============ SERVER STARTUP ============

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    logger.info('Initializing server...');
    
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('MongoDB connected successfully');
    
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Handle unhandled promise rejections - Log but don't exit
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    error: reason?.message || String(reason),
    promise: promise.toString().substring(0, 100)
  });
});

// Handle uncaught exceptions - Log but don't exit
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { 
    error: error.message,
    stack: error.stack?.split('\n')[0]
  });
});

startServer();

// Trigger nodemon restart for .env changes
