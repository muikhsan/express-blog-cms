import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface JwtPayload {
  userId: string;
}

export const generateToken = (userId: Types.ObjectId): string => {
  const payload: JwtPayload = { userId: userId.toString() };
  const secret = process.env.JWT_SECRET || 'default_secret';

  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.verify(token, secret) as JwtPayload;
};
