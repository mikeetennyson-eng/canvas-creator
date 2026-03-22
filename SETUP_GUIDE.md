# Canvas Creator - Full Stack Setup Guide

## Project Structure

```
canvas-creator/
├── frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── context/          # AuthContext for global state
│   │   ├── pages/            # Page components (Home, Login, Signup, Editor)
│   │   ├── lib/              # Utilities (apiClient.ts)
│   │   └── App.tsx           # Main app with routing
│   ├── .env                  # Frontend environment config
│   └── package.json
│
└── backend (Node.js + Express + MongoDB)
    ├── src/
    │   ├── config/           # Database and JWT config
    │   ├── controllers/       # Request handlers (authController)
    │   ├── middleware/        # Auth middleware and error handling
    │   ├── models/           # MongoDB schemas (User model)
    │   ├── routes/           # API routes (auth routes)
    │   └── index.ts          # Main server file
    ├── .env                  # Backend environment config
    └── package.json
```

## Prerequisites

- **Node.js** v16+ (download from https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas cloud)
- **npm** (comes with Node.js)

## Setup Instructions

### Step 1: Backend Setup

#### 1.1 Navigate to backend folder
```bash
cd backend
```

#### 1.2 Install dependencies
```bash
npm install
```

#### 1.3 Configure environment variables
The `.env` file is already created with default values:
```
MONGODB_URI=mongodb://localhost:27017/canvas-creator
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:8080
```

**For MongoDB Atlas (Cloud):**
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get connection string
- Update MONGODB_URI in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/canvas-creator
```

#### 1.4 Start the backend server
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server is running on http://localhost:5000
📡 CORS enabled for: http://localhost:8080
```

### Step 2: Frontend Setup

#### 2.1 Navigate to frontend folder (in a new terminal)
```bash
cd ..
```

#### 2.2 Verify `.env` file exists with:
```
VITE_API_URL=http://localhost:5000/api
```

#### 2.3 Install dependencies (if not already done)
```bash
npm install
```

#### 2.4 Start frontend dev server
```bash
npm run dev
```

The frontend will be available at: **http://localhost:8080**

## API Endpoints

### Authentication

**POST** `/api/auth/signup`
- Register new user
- Body: `{ name, email, password, confirmPassword }`

**POST** `/api/auth/login`
- Login existing user
- Body: `{ email, password }`

**POST** `/api/auth/verify`
- Verify JWT token
- Body: `{ token }`

**GET** `/api/auth/protected`
- Protected route example (requires Bearer token)

## User Flow

1. User visits http://localhost:8080 (home page)
2. Clicks "Sign Up" button
3. Fills signup form with name, email, password
4. Frontend sends request to `POST /api/auth/signup`
5. Backend validates and saves user to MongoDB
6. Backend returns JWT token
7. Frontend saves token in localStorage
8. User redirected to editor at `/editor`
9. Token automatically sent in requests via Auth header

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, hashed with bcryptjs),
  createdAt: Date (auto-created),
  updatedAt: Date (auto-updated)
}
```

## Password Security

✅ Passwords are hashed using **bcryptjs** with 10 salt rounds  
✅ Passwords never returned in API responses  
✅ Password validation enforces: uppercase, lowercase, numbers, 8+ chars  
✅ Passwords never logged or exposed in errors  

## Authentication Flow

1. User creates account with email/password
2. Password hashed before storing in MongoDB
3. On login, password compared with stored hash
4. JWT token generated with user ID and email
5. Token stored in browser localStorage
6. Token sent in Authorization header for protected requests
7. Middleware verifies token on each request

## Error Handling

Server returns detailed error messages:

```json
{
  "message": "Error description",
  "error": "Technical error details"
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials/token)
- `404` - Not Found
- `500` - Server Error

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`
- For MongoDB Atlas, ensure IP is whitelisted
- Check firewall/network settings

### CORS Errors
- Ensure CLIENT_URL in backend `.env` matches frontend URL
- Normally: `http://localhost:8080`
- Check browser console for exact error

### Token Errors
- Ensure JWT_SECRET is set in backend `.env`
- Token may have expired (default 7 days)
- Check token is sent in Authorization header

### Port Already in Use
- Backend default: 5000, Frontend default: 8080
- Kill process or change PORT in `.env`
- On Windows: `netstat -ano | findstr :5000`
- On Mac/Linux: `lsof -i :5000`

## Development Tips

### Testing Login/Signup
Use these test credentials after signup:
```
Email: test@example.com
Password: TestPassword123
```

### Check Token in Console
```javascript
// In browser console
localStorage.getItem('auth_token')
```

### API Testing
Use Postman, Insomnia, or curl:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"Pass123"}'
```

## Production Deployment

### Backend (Heroku, Railway, Render, etc.)
1. Set environment secrets in deployment platform
2. Build: `npm run build`
3. Start: `npm start`

### Frontend (Vercel, Netlify, GitHub Pages, etc.)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Add backend API URL to environment variables
4. Update VITE_API_URL to production backend

##  Next Steps

After completing setup:
1. ✅ Create account at http://localhost:8080/signup
2. ✅ Login at http://localhost:8080/login
3. ✅ Access editor at http://localhost:8080/editor
4. 🔜 Implement subscription/pricing plans
5. 🔜 Add user profile management
6. 🔜 Add project persistence

## Support

For issues or questions:
- Check error messages in terminal
- Enable verbose logging
- Check MongoDB connection
- Verify all .env variables are set
