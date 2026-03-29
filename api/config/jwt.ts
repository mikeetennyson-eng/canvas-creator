import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

export interface ITokenPayload {
  id: string;
  email: string;
  sid?: string;
}

export const generateToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

export const verifyToken = (token: string): ITokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);
  
  if (typeof decoded === 'string') {
    throw new Error('Invalid token');
  }

  return {
    id: decoded.id as string,
    email: decoded.email as string,
    sid: decoded.sid as string | undefined,
  };
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
