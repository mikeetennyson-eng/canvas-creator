# Vercel Deployment - Canvas Creator (Full Stack)

## ✅ What's Been Done

Your project is now set up to deploy **BOTH frontend and backend on Vercel** from a single repository:

```
canvas-creator/
├── src/                 # Frontend (React/Vite)
├── api/                 # Backend (Express as serverless)
│   ├── [...].ts        # Catch-all route handler
│   └── _middleware.ts  # Express app setup
├── backend/src/        # Original backend code (imported by api/)
├── public/             # Static assets
├── package.json        # Root packages (frontend + backend deps)
├── vercel.json         # Vercel configuration
└── .env.production     # Production env template
```

---

## 🚀 Step 1: Deploy to Vercel

### 1.1 Push to GitHub
```bash
git add .
git commit -m "feat: add serverless backend for Vercel deployment"
git push origin main
```

### 1.2 Connect to Vercel
1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose your GitHub repo
4. Click "Import"

---

## 🔐 Step 2: Set Environment Variables in Vercel

### 2.1 Frontend Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables

Add these for **Production** environment:

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | Your API endpoint | `https://your-project.vercel.app/api` |

### 2.2 Backend Environment Variables
Add these for **Production** environment:

| Variable | Value | Example |
|----------|-------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/canvas-creator` |
| `JWT_SECRET` | Strong random secret | `your_32_character_secret_key_here` |
| `JWT_EXPIRE` | Token expiration | `7d` |
| `CLIENT_URL` | Frontend domain | `https://your-project.vercel.app` |
| `NODE_ENV` | Environment | `production` |

**Generate strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 MongoDB Atlas Setup (if not done)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/canvas-creator`
5. Copy to `MONGODB_URI` in Vercel

---

## 📋 Environment Variables Checklist

```
Frontend:
- [ ] VITE_API_URL = https://your-project.vercel.app/api

Backend:
- [ ] MONGODB_URI = mongodb+srv://...
- [ ] JWT_SECRET = [32-char random string]
- [ ] JWT_EXPIRE = 7d
- [ ] CLIENT_URL = https://your-project.vercel.app
- [ ] NODE_ENV = production
```

---

## 🔗 API Endpoints (After Deployment)

Once deployed, your API will be at:

```
https://your-project.vercel.app/api/auth/signup    → POST
https://your-project.vercel.app/api/auth/login     → POST
https://your-project.vercel.app/api/auth/verify    → POST
https://your-project.vercel.app/api/health        → GET
```

---

## 🧪 Test After Deployment

### 3.1 Check Health
```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "message": "Server is running",
  "timestamp": "2024-03-23T...",
  "dbConnected": true
}
```

### 3.2 Test Signup
```bash
curl -X POST https://your-project.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### 3.3 Test Login
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 🐛 Troubleshooting

### "Database connection failed" 
**Solution:**
1. Check `MONGODB_URI` in Vercel env vars
2. Verify MongoDB Atlas IP whitelist includes Vercel (add `0.0.0.0/0`)
3. Test connection locally: `npm run dev`

### "CORS error"
**Solution:**
1. Verify `CLIENT_URL` in backend env vars
2. Check that it matches your Vercel domain exactly
3. Ensure protocol is `https://` (not `http://`)

### "401 Unauthorized"
**Solution:**
1. Verify `JWT_SECRET` is consistent between deployments
2. Check token is being sent in `Authorization: Bearer <token>` header
3. Ensure `JWT_EXPIRE` is appropriate

### "Cannot find module"
**Solution:**
1. Run `npm install` locally to verify dependencies
2. Check `package.json` has all backend dependencies
3. Redeploy from Vercel dashboard

---

## 📊 Monitoring

### View Logs
1. Vercel Dashboard → Your Project → Deployments
2. Click latest deployment
3. Click "Functions" tab to see API logs

### Monitor Errors
1. Set up error tracking (optional):
   - Sentry integration (see PRODUCTION_DEPLOYMENT.md)
   - Vercel analytics

---

## 🔄 Redeploying

### Automatic
- Pushes to `main` branch auto-deploy

### Manual
```bash
vercel deploy --prod
```

### From Vercel Dashboard
- Projects → Your Project → Deployments → Click "Redeploy"

---

## 📝 Files Changed

Files created/modified for Vercel deployment:

1. **`api/_middleware.ts`** - Express app exported as serverless function
2. **`api/[...].ts`** - Catch-all route handler for all API requests
3. **`vercel.json`** - Vercel configuration
4. **`.env.production`** - Production environment template
5. **`backend/.env.production`** - Backend production env template
6. **`package.json`** - Added backend dependencies + @vercel/node

---

## ✨ Architecture Overview

```
REQUEST → https://your-project.vercel.app/api/auth/login
          ↓
        Vercel Edge (Router)
          ↓
        api/[...].ts (Serverless Function)
          ↓
        api/_middleware.ts (Express App)
          ↓
        backend/src/routes/auth.ts
          ↓
        backend/src/controllers/authController.ts
          ↓
        MongoDB Atlas ← (via MONGODB_URI)
          ↓
        JWT Token ← (signed with JWT_SECRET)
          ↓
        Response back through API
```

---

## 🎯 Next Steps

1. **Set environment variables** in Vercel dashboard (Step 2)
2. **Commit and push** code to GitHub
3. **Vercel auto-deploys** on push to main
4. **Test endpoints** (Step 3.2-3.3)
5. **Monitor logs** via Vercel dashboard

---

## 📞 Quick Reference

**Project URL:** `https://your-project.vercel.app`
**API Base URL:** `https://your-project.vercel.app/api`
**Dashboard:** https://vercel.com/dashboard

**Local Development:**
```bash
npm run dev          # Start frontend + backend locally
```

**Production Build:**
```bash
npm run build
vercel deploy --prod
```

---

*Last Updated: March 23, 2026*
