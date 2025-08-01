import { IUser } from '../models/User';
import { IArticle } from '../models/Article';
import { IPageView } from '../models/PageView';
import {
  SanitizedUser,
  SanitizedUserMinimal,
  SanitizedArticle,
  ApiError
} from '../types';

export const sanitizeUser = (user: IUser): SanitizedUser => {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const sanitizeUserMinimal = (user: IUser): SanitizedUserMinimal => {
  return {
    id: user._id,
    name: user.name,
    username: user.username
  };
};

export const sanitizeArticle = (article: IArticle): SanitizedArticle => {
  return {
    id: article._id,
    title: article.title,
    content: article.content,
    status: article.status,
    author: article.author ? (
      typeof article.author === 'object' && 'name' in article.author
        ? (article.author as any).name
        : article.author
    ) : null,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt
  };
};

export const sanitizeArticles = (articles: IArticle[]): SanitizedArticle[] => {
  return articles.map(sanitizeArticle);
};

export const sanitizeUsers = (users: IUser[]): SanitizedUser[] => {
  return users.map(sanitizeUser);
};

export const sanitizeError = (error: Error | any, isDevelopment: boolean = false): ApiError => {
  if (isDevelopment) {
    return {
      error: error.message || 'Server error',
      stack: error.stack
    };
  }

  return {
    error: error.message || 'Server error'
  };
};
