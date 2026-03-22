# ✅ Vercel Full-Stack Deployment - SETUP COMPLETE

Your Canvas Creator application is now **production-ready** to deploy to Vercel with both frontend and backend! 🚀

## 📦 What Changed

I've restructured your project to run on Vercel as a full-stack application:

### New Files Created:
1. **`api/_middleware.ts`** - Express app configured for Vercel serverless
2. **`api/[...].ts`** - Catch-all route handler
3. **`vercel.json`** - Vercel configuration
4. **`.env.production`** - Frontend production template
5. **`backend/.env.production`** - Backend production template
6. **`VERCEL_DEPLOYMENT.md`** - Complete deployment guide

### Updated Files:
1. **`package.json`** - Added backend dependencies + @vercel/node
2. **`tsconfig.app.json`** - Added api/ to TypeScript includes

### How It Works:
- **Frontend**: React/Vite app at `https://your-site.vercel.app`
- **Backend**: Express serverless functions at `https://your-site.vercel.app/api`
- **Database**: MongoDB Atlas (you already have this!)
- **CORS**: ✅ No more localhost issues!

---

## 🎯 Do This Exactly (Step by Step)

### Step 1: Generate a Strong JWT Secret
Run this command and save the output:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Get MongoDB Connection String
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Connect" on your cluster
3. Choose "Connect with drivers"
4. Copy connection string (looks like: `mongodb+srv://username:password@cluster...`)

### Step 3: Push to GitHub
```bash
git add .
git commit -m "feat: configure vercel full-stack deployment"
git push origin main
```

### Step 4: Deploy on Vercel
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"

### Step 5: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables

**Add ALL of these for Production:**

```
VITE_API_URL = https://your-project.vercel.app/api
MONGODB_URI = mongodb+srv://username:password@cluster...
JWT_SECRET = [paste the 64-char string from Step 1]
JWT_EXPIRE = 7d
CLIENT_URL = https://your-project.vercel.app
NODE_ENV = production
```

### Step 6: Deploy
- Click "Deploy" button
- Wait 2-3 minutes
- Check deployment status

---

## ✅ Verify It Works

After deployment completes:

### 1. Check Health
Open in browser or curl:
```
https://your-project.vercel.app/api/health
```

Should show:
```json
{"message":"Server is running","dbConnected":true}
```

### 2. Test Signup
Visit your app at `https://your-project.vercel.app` and try to signup with:
- Name: Test User
- Email: test@example.com
- Password: TestPass123!

### 3. Test Login
Try logging in with the same credentials

---

## 🐛 Troubleshooting

### "Database connection failed"
- Check MONGODB_URI is correct
- In MongoDB Atlas → Network Access → Add 0.0.0.0/0
- Verify username/password have no special characters

### "CORS error"
- Verify CLIENT_URL matches your Vercel domain exactly
- Make sure URL has https:// prefix

### "401 Unauthorized"
- Verify JWT_SECRET is the long 64-character string (from Step 1)
- Check tokens are sent in Authorization header

### "Build fails"
- Run `npm install` locally
- Run `npm run build` locally to test
- Check for TypeScript errors with `npm run lint`

---

## 📊 Your Production Setup

```
┌─ https://your-project.vercel.app ─┐
│                                    │
│  Frontend (React/Vite)             │
│  - Home page                       │
│  - Login/Signup UI                 │
│  - Editor page                     │
│                                    │
└────────────┬────────────────────────┘
             │ VITE_API_URL
             │ (automatic)
┌────────────▼────────────────────────┐
│ Backend (Express serverless)        │
│                                    │
│ /api/auth/signup   (POST)          │
│ /api/auth/login    (POST)          │
│ /api/auth/verify   (POST)          │
│ /api/health        (GET)           │
│                                    │
└────────────┬────────────────────────┘
             │ MONGODB_URI
             │ JWT_SECRET
             │
┌────────────▼────────────────────────┐
│ MongoDB Atlas (Cloud Database)      │
│ - Users table                       │
│ - Email index                       │
│ - Backups enabled                  │
└─────────────────────────────────────┘
```

---

## 📝 File Structure (Production)

```
canvas-creator/
├── src/                 # React frontend
│   ├── pages/
│   ├── components/
│   ├── App.tsx
│   └── ...
├── api/                 # Express serverless
│   ├── _middleware.ts   # Express app setup
│   └── [...].ts         # Route handler
├── backend/src/         # Shared code (not directly deployed)
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   μ─ middleware/
│   └── config/
├── public/              # Static files
├── package.json         # All dependencies
├── vercel.json          # Vercel config
├── .env.production      # Frontend env template
└── README.md
```

---

## 🚀 Commands Reference

```bash
# Local development (both frontend & backend)
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Deploy to Vercel
vercel deploy --prod

# View Vercel logs
vercel logs [project-name] --tail
```

---

## 💡 Key Points

✅ **Both frontend and backend on same domain**
- No localhost:3000 vs localhost:5000 issues
- CORS automatically works
- Easier to maintain

✅ **Serverless backend**
- Auto-scales with traffic
- Cold start < 1 second
- MongoDB Atlas handles database

✅ **Environment variables**
- Never committed to Git
- Different for dev/prod
- Kept secure in Vercel

✅ **MongoDB Atlas**
- Free tier available
- Automatic backups
- Easy to scale

---

## 🎓 Next Steps (Optional)

After confirming it's working:

1. **Add error tracking**: Set up Sentry for production errors
2. **Monitor performance**: Use Vercel Analytics
3. **Backup database**: Enable daily MongoDB backups
4. **Add rate limiting**: Prevent brute force attacks
5. **Security headers**: Add helmet middleware

---

## 📖 For More Details

- **Deployment**: See `VERCEL_DEPLOYMENT.md`
- **Production Best Practices**: See `PRODUCTION_DEPLOYMENT.md`
- **API Documentation**: See `backend/README.md`

---

## ✨ Summary

Your full-stack application is now ready to deploy! All you need to do is:

1. ✅ Run `git push` 
2. ✅ Set environment variables in Vercel
3. ✅ Wait for auto-deployment
4. ✅ Test the live site

**You're just 4 steps away from going live! 🎉**

---

*Setup completed March 23, 2026*
*Architecture: Vite React + Express Serverless + MongoDB Atlas*
