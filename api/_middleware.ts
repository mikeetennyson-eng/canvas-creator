import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:8080').split(',').map(url => url.trim());

app.use(
  cors({
    origin: CLIENT_URLS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

let dbConnected = false;

// Load backend routes dynamically - this runs once at startup
let authRoutesLoadPromise: Promise<void> | null = null;

const loadAuthRoutes = async () => {
  if (authRoutesLoadPromise) return authRoutesLoadPromise;
  
  authRoutesLoadPromise = (async () => {
    try {
      console.log('Loading backend authentication routes...');
      const { connectDB } = await import('../backend/src/config/db.js');
      const authRoutesModule = await import('../backend/src/routes/auth.js');
      const authRoutes = authRoutesModule.default;
      
      // Connect to database
      try {
        await connectDB();
        dbConnected = true;
        console.log('✅ Database connected');
      } catch (dbError) {
        console.error('❌ Database connection error:', dbError);
        dbConnected = false;
      }
      
      // Mount auth routes
      app.use('/api/auth', authRoutes);
      console.log('✅ Auth routes loaded');
    } catch (error) {
      console.error('❌ Failed to load auth routes:', error);
      throw error;
    }
  })();
  
  return authRoutesLoadPromise;
};

// Load routes immediately at startup
loadAuthRoutes().catch(err => {
  console.error('Critical: Failed to load auth routes at startup:', err);
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  console.log('Health check requested');
  res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date(),
    dbConnected,
    env: {
      mongodb_connected: !!process.env.MONGODB_URI,
      jwt_secret_exists: !!process.env.JWT_SECRET,
      client_url: process.env.CLIENT_URL
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message || err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message || String(err)
  });
});

export default app;

