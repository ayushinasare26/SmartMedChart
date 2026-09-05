import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import prescriptionRoutes from './routes/prescription.routes';
import scheduleRoutes from './routes/schedule.routes';
import alertRoutes from './routes/alert.routes';
import auditRoutes from './routes/audit.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import wardRoutes from './routes/ward.routes';
import administrationRoutes from './routes/administration.routes';

import { errorHandler } from './middleware/error.middleware';
import { prisma } from './config/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-workstation', 'X-Workstation', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['*'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 5000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SmartMedChart API', version: '2.4.1', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/administrations', administrationRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wards', wardRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Error handler
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database via Prisma');
    
    app.listen(PORT, () => {
      console.log(`🏥 SmartMedChart API running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  main();
}

export default app;
