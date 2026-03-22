# Production Deployment Checklist - Canvas Creator

## 🚀 Phase 1: Backend Deployment

### 1.1 Deploy Backend Server
Choose one platform (Recommended: Railway or Render for free tier, Heroku Pro for better performance)

**Option A: Railway (Recommended - Easiest)**
1. Sign up at https://railway.app
2. Connect GitHub repository
3. Add `.env.production` variables
4. Deploy automatically on push

**Option B: Render**
1. Sign up at https://render.com
2. Create new Web Service from GitHub
3. Set environment variables
4. Deploy

**Option C: Heroku**
1. Install Heroku CLI
2. Create app: `heroku create your-app-name`
3. Set config: `heroku config:set MONGODB_URI=...`
4. Deploy: `git push heroku main`

### 1.2 MongoDB Production Database
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist IP addresses (or allow all: 0.0.0.0/0)
5. Get connection string
6. Update backend `.env.production` with MongoDB Atlas URI

### 1.3 Backend Environment Variables (Production)
```
# backend/.env.production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/canvas-creator
PORT=5000
NODE_ENV=production
JWT_SECRET=generate_a_strong_random_secret_key_here_change_this
JWT_EXPIRE=7d
CLIENT_URL=https://your-vercel-domain.vercel.app
```

**Generate strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎨 Phase 2: Frontend Configuration

### 2.1 Update Frontend Environment Variables
**.env.production** (create this file):
```
VITE_API_URL=https://your-backend-domain.com/api
```

### 2.2 Update Vercel Environment Variables
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-backend-domain.com/api
   ```
3. Redeploy from Vercel dashboard

### 2.3 Build & Deploy
```bash
npm run build
# Deploy to Vercel (auto-deploy from Git or)
vercel deploy --prod
```

---

## 🔐 Phase 3: Security Hardening

### 3.1 Backend Security Headers
Add to `backend/src/index.ts`:
```typescript
import helmet from 'helmet';
app.use(helmet()); // Security headers
```

Add to package.json devDependencies:
```
"helmet": "^7.1.0"
```

### 3.2 Rate Limiting
Create `backend/src/middleware/rateLimiter.ts`:
```typescript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});
```

Apply to routes:
```typescript
import { authLimiter, apiLimiter } from '../middleware/rateLimiter';

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
app.use('/api/', apiLimiter);
```

### 3.3 CORS Configuration (Production)
Update `backend/src/index.ts`:
```typescript
app.use(
  cors({
    origin: [
      'https://your-vercel-domain.vercel.app',
      'https://your-custom-domain.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

### 3.4 Environment Validation
Create `backend/src/config/validateEnv.ts`:
```typescript
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'CLIENT_URL',
  'PORT',
];

const validateEnv = () => {
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Missing environment variable: ${envVar}`);
    }
  });
};

export default validateEnv;
```

Call in `backend/src/index.ts`:
```typescript
import validateEnv from './config/validateEnv';

validateEnv(); // Call before starting server
```

---

## 📊 Phase 4: Monitoring & Logging

### 4.1 Error Tracking (Sentry)
1. Sign up at https://sentry.io
2. Add to backend:
   ```bash
   npm install @sentry/node
   ```

3. Update `backend/src/index.ts`:
   ```typescript
   import * as Sentry from '@sentry/node';

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });

   app.use(Sentry.Handlers.errorHandler());
   ```

4. Set `SENTRY_DSN` in production env vars

### 4.2 Logging
Update logging in controllers:
```typescript
console.log(`[${new Date().toISOString()}] Event description`);
console.error(`[${new Date().toISOString()}] Error:`, error);
```

Or use Winston:
```bash
npm install winston
```

---

## 🎯 Phase 5: Performance Optimization

### 5.1 Frontend
```bash
npm run build
```

Verify bundle size:
```bash
npm install -D vite-plugin-visualizer
```

### 5.2 Database Indexes
Create `backend/scripts/createIndexes.ts`:
```typescript
import User from '../models/User';

export const createIndexes = async () => {
  await User.collection.createIndex({ email: 1 });
  console.log('Database indexes created');
};
```

### 5.3 Caching
Add to frontend `.env.production`:
```
VITE_API_CACHE=true
```

---

## ✅ Phase 6: Pre-Launch Checklist

### Backend
- [ ] MongoDB Atlas cluster created and backed up
- [ ] Backend deployed to Railway/Render/Heroku
- [ ] All production env vars set
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS configured for production domain
- [ ] Rate limiting implemented
- [ ] Security headers (helmet) enabled
- [ ] Error tracking (Sentry) configured
- [ ] Database indexes created
- [ ] SSL certificate (auto on most platforms)

### Frontend
- [ ] Vercel environment variables updated
- [ ] API URL points to production backend
- [ ] Build succeeds locally: `npm run build`
- [ ] No console errors in production build
- [ ] Tested signup/login with production DB
- [ ] API response times acceptable
- [ ] Error messages user-friendly

### Testing
- [ ] Signup flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Token persists in localStorage
- [ ] Token validation on page refresh
- [ ] Logout clears token
- [ ] Protected routes require token
- [ ] Error messages display correctly

### Documentation
- [ ] README.md updated with prod instructions
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment procedure documented

---

## 🚨 Phase 7: Post-Deployment

### 7.1 Monitor
- Check error tracking (Sentry) daily
- Monitor API response times
- Check database connection
- Monitor rate limiter hits

### 7.2 Backup Strategy
- Daily MongoDB backups (Atlas handles this)
- Keep backup of production env vars (secure)
- Document recovery procedure

### 7.3 Maintenance
- Check npm audit regularly: `npm audit`
- Update dependencies monthly
- Monitor JWT expiration settings
- Review logs for suspicious activity

---

## 📋 Deployment Commands Reference

### Deploy Backend
```bash
# Railway
git push
# (Auto-deploys)

# Render
git push
# (Auto-deploys from connected repo)

# Heroku
git push heroku main
```

### Deploy Frontend
```bash
# Auto-deploys on push to main branch
# Or redeploy from Vercel dashboard
vercel deploy --prod
```

### Check Logs
```bash
# Vercel Frontend
vercel logs [project-name] --tail

# Railway Backend
railway logs

# Heroku Backend
heroku logs --tail
```

---

## 🎓 Best Practices

1. **Never commit secrets** - Use .env files (in .gitignore)
2. **Use strong passwords** - 16+ characters with mixed case
3. **Rotate secrets regularly** - Every 90 days
4. **Version your API** - `/api/v1/auth/...`
5. **Monitor actively** - Set up alerts
6. **Document everything** - For future maintenance
7. **Test before deploying** - Staging environment
8. **Use CI/CD** - Auto-test and deploy
9. **Keep backups** - Weekly automated backups
10. **Update regularly** - Security patches, dependencies

---

## 🆘 Troubleshooting

**"CORS error on production"**
- Check CLIENT_URL in backend .env matches Vercel domain
- Ensure HTTPS is used

**"Database connection fails"**
- Verify MongoDB Atlas IP whitelist includes server IP
- Check MONGODB_URI format
- Ensure connection string username/password are correct

**"Token expired immediately"**
- Check JWT_SECRET is consistent between deployments
- Verify JWT_EXPIRE is appropriate (7d recommended)

**"Slow API responses"**
- Check MongoDB Atlas cluster tier
- Add database indexes
- Enable caching
- Consider upgrading hosting

**"Out of memory on backend"**
- Reduce query result limits
- Add pagination
- Clear old/unused data
- Upgrade server specs

