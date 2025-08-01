import { Request } from 'express';
import { IUser } from '../models/User';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface SanitizedUser {
  id: Types.ObjectId;
  name: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SanitizedUserMinimal {
  id: Types.ObjectId;
  name: string;
  username: string;
}

export interface SanitizedArticle {
  id: Types.ObjectId;
  title: string;
  content: string;
  status: 'draft' | 'published';
  author: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  error: string;
  stack?: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  error: string;
  details: ValidationErrorDetail[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: SanitizedUser;
}

export interface StandardResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export type ArticleStatus = 'draft' | 'published';

export interface ArticleFilters {
  status?: ArticleStatus;
  author?: Types.ObjectId | string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ArticleQueryParams extends PaginationParams {
  status?: ArticleStatus;
  author?: string;
}

export interface ArticleMatchFilter {
  [key: string]: any;
  author?: Types.ObjectId;
  status?: ArticleStatus | { $in: ArticleStatus[] };
  $or?: any[];
}

export interface PageViewAnalytics {
  date: string;
  count: number;
  articles: any;
}

export interface PageViewCountResponse {
  count: number;
  articles: any[];
}

export interface PageViewRequest {
  article: string;
}
