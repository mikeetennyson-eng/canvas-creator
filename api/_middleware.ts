import { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../backend/src/config/db';
import { errorHandler } from '../backend/src/middleware/auth';
import authRoutes from '../backend/src/routes/auth';

dotenv.config();

let dbConnected = false;

const app: Express = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:8080').split(',');

app.use(
  cors({
    origin: CLIENT_URLS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date(),
    dbConnected 
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

export const connectDatabase = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
};

export default app;
