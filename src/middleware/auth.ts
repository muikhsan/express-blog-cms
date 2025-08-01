import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User, IUser } from '../models/User';
import { Article } from '../models/Article';
import { AuthRequest } from '../types';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';

export { AuthRequest };

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization');

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(cleanToken);
    if (isBlacklisted) {
      res.status(401).json({ message: 'Token has been invalidated' });
      return;
    }

    const decoded = verifyToken(cleanToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization');

    if (!token) {
      next();
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(cleanToken);
    if (isBlacklisted) {
      next();
      return;
    }

    const decoded = verifyToken(cleanToken);
    const user = await User.findById(decoded.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Invalid token, continue without authentication
    next();
  }
};

export const canModifyUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (req.user._id.toString() !== userId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authorization check.' });
  }
};

export const canModifyArticle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const articleId = req.params.id;

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const article = await Article.findById(articleId);

    if (!article) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    if (article.author.toString() !== req.user._id.toString()) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during authorization check.' });
  }
};
