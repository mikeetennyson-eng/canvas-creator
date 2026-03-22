# ⚡ Quick Start Guide

## 🚀 Start Backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server is running on http://localhost:5000
```

## 🎨 Start Frontend (Terminal 2)

```bash
npm install
npm run dev
```

**Expected output:**
```
VITE v5.4.19  ready in 488 ms
➜  Local:   http://localhost:8080/
```

## ✅ Test the Stack

1. Open http://localhost:8080 in your browser
2. Click "Sign Up" button
3. Fill in the form:
   - Name: John Doe
   - Email: john@test.com
   - Password: TestPass123
4. Click "Create Account"
5. You should be redirected to `/editor`
6. Token saved in browser localStorage

## 🔧 Environment Files Already Set Up

### Backend `.env`:
```
MONGODB_URI=mongodb://localhost:27017/canvas-creator
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:8080
```

### Frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## 📊 MongoDB Setup

### Option 1: Local MongoDB (Recommended for development)

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer and follow steps
3. MongoDB runs on port 27017 by default

**Mac (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Option 2: MongoDB Atlas (Cloud)

1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `backend/.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/canvas-creator
```

## 🎯 Architecture Overview

```
User Browser (Port 8080)
       ↓
   Frontend (React)
       ↓ HTTP
   Backend API (Port 5000)
       ↓ Database
   MongoDB Database
```

**Flow:**
1. User signs up on frontend
2. Frontend sends data to backend API
3. Backend validates & hashes password
4. Saves user to MongoDB
5. Returns JWT token
6. Frontend stores token in localStorage
7. Token sent with every authenticated request

## 🔐 Security Features Implemented

✅ Password hashing with bcryptjs  
✅ JWT token authentication  
✅ Input validation & sanitization  
✅ CORS protection  
✅ Error message sanitization  
✅ Environment variable secrets  
✅ Password strength requirements  

## 📱 API Endpoints

```
POST /api/auth/signup
  Body: { name, email, password, confirmPassword }
  Returns: { token, user }

POST /api/auth/login
  Body: { email, password }
  Returns: { token, user }

POST /api/auth/verify
  Body: { token }
  Returns: { user, message }

GET /api/auth/protected
  Headers: { Authorization: "Bearer token" }
  Returns: { user, message }
```

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
- Start MongoDB: `mongod` (or `brew services start mongodb-community`)
- Check connection string in `.env`

### "CORS error"
- Ensure backend is running on port 5000
- Check CLIENT_URL in backend `.env`

### "Network error"
- Both servers must be running (backend on 5000, frontend on 8080)
- Check firewalls

### "Invalid token"
- Token expired? Generate new by logging in again
- Token in wrong format? Should have 3 parts separated by dots

## 📝 Test Credentials

After you create an account, use it to login:
```
Email: your@email.com
Password: (whatever you set)
```

## 🎉 You're All Set!

Access your app at: **http://localhost:8080**

Next steps:
- Run the full stack
- Create an account
- Login
- Access editor
- Come back when you want to add more features!
