import { connectDB } from '../../backend/src/config/db.js';

// Initialize database connection
connectDB().then(() => {
  console.log('✅ Database connected in Vercel');
}).catch((error) => {
  console.error('❌ Database connection failed in Vercel:', error);
});