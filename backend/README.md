# Canvas Creator Backend README

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend folder (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
MONGODB_URI=mongodb://localhost:27017/canvas-creator
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:8080
```

### Running the Server

**Development Mode (with hot reload):**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication Routes

#### POST `/api/auth/signup`
Register a new user.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "123abc...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/login`
Login a user.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "123abc...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST `/api/auth/verify`
Verify a JWT token.

**Request body:**
```json
{
  "token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "message": "Token is valid",
  "user": {
    "id": "123abc...",
    "email": "john@example.com"
  }
}
```

#### GET `/api/auth/protected`
Protected route example (requires authentication).

**Headers:**
```
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "message": "You have access to protected route",
  "user": {
    "id": "123abc...",
    "email": "john@example.com"
  }
}
```

## Database Schema

### User Model
```typescript
{
  name: String (required, 2-50 chars, letters only)
  email: String (required, unique, valid email format)
  password: String (required, 8+ chars, uppercase, lowercase, numbers)
  createdAt: Date (auto-generated)
  updatedAt: Date (auto-generated)
}
```

### Password Security
- Passwords are hashed using bcryptjs (salt rounds: 10)
- Password validation on signup ensures strong passwords
- Never returned in API responses

## Error Handling

The API returns detailed error messages:

```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials/token)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

✅ **Password Hashing** - Bcryptjs with 10 salt rounds  
✅ **JWT Authentication** - Secure token generation and verification  
✅ **Input Validation** - Email format and password strength validation  
✅ **CORS Protection** - Restricted to frontend URL  
✅ **Error Sanitization** - Sensitive data not exposed in responses  
✅ **Environment Variables** - Sensitive data stored in .env  

## MongoDB Connection

The backend automatically connects to MongoDB on startup. Make sure:

1. MongoDB is running locally:
```bash
mongod
```

Or use MongoDB Atlas (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/canvas-creator
```

## Troubleshooting

**MongoDB Connection Fails:**
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env is correct
- Check firewall settings

**Token Errors:**
- Ensure JWT_SECRET is set in .env
- Verify token hasn't expired
- Check token format in Authorization header

**CORS Errors:**
- Ensure CLIENT_URL in .env matches your frontend URL
- Check browser console for exact error
