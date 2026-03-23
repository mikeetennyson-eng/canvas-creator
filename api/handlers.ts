import { verifyToken as verifyJWT } from './config/jwt.js';
import Canvas from './models/Canvas.js';
import User from './models/User.js';
import Subscription from './models/Subscription.js';
import { connectDB } from './config/db.js';

// Helper to get header from Node.js or Web API request objects
function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

// Helper to parse JSON body from Node.js or Web API request objects
async function parseBody(req: any): Promise<any> {
  if (req.body) {
    // Already parsed (some frameworks do this)
    return req.body;
  }
  
  // Read from readable stream (Node.js)
  if (req.on) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }

  // Web API Request
  return req.json();
}

export async function handleAuth(req: any): Promise<Response> {
  try {
    // Ensure database connection is established
    await connectDB();
    
    const host = getHeader(req.headers, 'host') || 'localhost';
    const url = new URL(req.url || '/', `https://${host}`);
    let path = url.pathname;
    
    // Remove query string and trailing slashes for matching
    path = path.split('?')[0].replace(/\/$/, '');

    console.log(`[Auth] Method: ${req.method}, Path: ${path}`);

    if (path.match(/\/auth\/signup$/) && req.method === 'POST') {
      const body = await parseBody(req);
      const { name, email, password, confirmPassword } = body;

      if (!name || !email || !password || !confirmPassword) {
        return new Response(JSON.stringify({ message: 'All fields required' }), { status: 400 });
      }

      if (password !== confirmPassword) {
        return new Response(JSON.stringify({ message: 'Passwords do not match' }), { status: 400 });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return new Response(JSON.stringify({ message: 'Email already registered' }), { status: 400 });
      }

      const user = await User.create({ name, email: email.toLowerCase(), password });
      
      // Create free subscription for new user
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      await Subscription.create({
        userId: (user as any)._id,
        plan: 'free',
        status: 'active',
        price: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenewal: false,
      });
      
      const { generateToken } = await import('./config/jwt.js');
      const token = generateToken({ id: (user as any)._id.toString(), email: user.email });

      return new Response(
        JSON.stringify({
          message: 'User registered successfully',
          token,
          user: { id: (user as any)._id, name: user.name, email: user.email },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (path.match(/\/auth\/login$/) && req.method === 'POST') {
      const body = await parseBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ message: 'Email and password required' }), { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password') as any;
      if (!user || !(await user.comparePassword(password))) {
        return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
      }

      const { generateToken } = await import('./config/jwt.js');
      const token = generateToken({ id: user._id.toString(), email: user.email });

      return new Response(
        JSON.stringify({
          message: 'Login successful',
          token,
          user: { id: user._id, name: user.name, email: user.email },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (path.match(/\/auth\/verify$/) && req.method === 'POST') {
      const body = await parseBody(req);
      const { token } = body;

      if (!token) {
        return new Response(JSON.stringify({ message: 'Token required' }), { status: 400 });
      }

      try {
        const decoded = verifyJWT(token);
        const user = await User.findById(decoded.id);
        return new Response(
          JSON.stringify({
            message: 'Token valid',
            user: { id: (user as any)?._id, email: user?.email },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch {
        return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
      }
    }

    console.log(`[Auth] No matching route for ${req.method} ${path}`);
    return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function handleCanvas(req: any): Promise<Response> {
  try {
    // Ensure database connection is established
    await connectDB();
    
    const host = getHeader(req.headers, 'host') || 'localhost';
    const url = new URL(req.url || '/', `https://${host}`);
    let path = url.pathname;
    
    // Remove query string and trailing slashes for matching
    path = path.split('?')[0].replace(/\/$/, '');

    console.log(`[Canvas] Method: ${req.method}, Path: ${path}`);

    // Get token
    const authHeader = getHeader(req.headers, 'authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(JSON.stringify({ message: 'No token provided' }), { status: 401 });
    }

    let userId: string;
    try {
      const decoded = verifyJWT(token);
      userId = decoded.id;
    } catch {
      return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
    }

    // Save canvas
    if (path.match(/\/canvas\/save$/) && (req.method === 'POST' || req.method === 'PUT')) {
      const body = await parseBody(req);
      const { _id, title, description, canvasData, thumbnail } = body;

      if (!title || !canvasData) {
        return new Response(JSON.stringify({ message: 'Title and canvas data required' }), { status: 400 });
      }

      let canvas;
      if (req.method === 'PUT' && _id) {
        canvas = await Canvas.findByIdAndUpdate(_id, { title, description, canvasData, thumbnail }, { new: true });
        if (canvas && (canvas as any).userId.toString() !== userId) {
          return new Response(JSON.stringify({ message: 'Not authorized' }), { status: 403 });
        }
      } else {
        canvas = await Canvas.create({ userId, title, description, canvasData, thumbnail });
      }

      return new Response(
        JSON.stringify({
          message: req.method === 'PUT' ? 'Canvas updated' : 'Canvas saved',
          canvas: { _id: (canvas as any)._id, title: canvas?.title, createdAt: canvas?.createdAt },
        }),
        { status: req.method === 'PUT' ? 200 : 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get canvas list
    if (path.match(/\/canvas\/list$/) && req.method === 'GET') {
      const canvases = await Canvas.find({ userId }).sort({ updatedAt: -1 }).limit(5).select('_id title description thumbnail createdAt updatedAt');
      return new Response(JSON.stringify({ message: 'Canvases retrieved', canvases }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Get single canvas
    const canvasMatch = path.match(/\/canvas\/([a-z0-9]+)$/i);
    if (canvasMatch && (req.method === 'GET' || req.method === 'DELETE')) {
      const canvasId = canvasMatch[1];
      const canvas = await Canvas.findById(canvasId);

      if (!canvas) {
        return new Response(JSON.stringify({ message: 'Canvas not found' }), { status: 404 });
      }

      if ((canvas as any).userId.toString() !== userId) {
        return new Response(JSON.stringify({ message: 'Not authorized' }), { status: 403 });
      }

      if (req.method === 'DELETE') {
        await Canvas.findByIdAndDelete(canvasId);
        return new Response(JSON.stringify({ message: 'Canvas deleted' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(
        JSON.stringify({
          message: 'Canvas retrieved',
          canvas: { _id: (canvas as any)._id, title: canvas?.title, description: canvas?.description, canvasData: canvas?.canvasData, thumbnail: canvas?.thumbnail, createdAt: canvas?.createdAt },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Canvas] No matching route for ${req.method} ${path}`);
    return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
  } catch (error) {
    console.error('Canvas error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
