import { Router } from 'express';
import { auth, canModifyArticle, optionalAuth } from '../middleware/auth';
import { validateArticle } from '../middleware/validation';
import {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle
} from '../controllers/articleController';

const router = Router();

router.get('/', optionalAuth, getArticles);
router.get('/:id', optionalAuth, getArticle);

router.post('/', auth, validateArticle, createArticle);
router.patch('/:id', auth, canModifyArticle, validateArticle, updateArticle);
router.delete('/:id', auth, canModifyArticle, deleteArticle);

export default router;
