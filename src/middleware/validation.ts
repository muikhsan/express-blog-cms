import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ValidationErrorDetail, ValidationErrorResponse } from '../types';

type ValidationMiddleware = ValidationChain | ((req: Request, res: Response, next: NextFunction) => void);

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const sanitizedErrors: ValidationErrorDetail[] = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg
    }));

    const response: ValidationErrorResponse = {
      error: 'Validation failed',
      details: sanitizedErrors
    };

    res.status(400).json(response);
    return;
  }
  next();
};

export const validateUser: ValidationMiddleware[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateLogin: ValidationMiddleware[] = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const validateArticle: ValidationMiddleware[] = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  handleValidationErrors
];

export const validatePageView: ValidationMiddleware[] = [
  body('article').isMongoId().withMessage('Valid article ID is required'),
  handleValidationErrors
];
