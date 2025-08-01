import { Router } from 'express';
import { auth } from '../middleware/auth';
import { validatePageView } from '../middleware/validation';
import {
  trackPageView,
  getPageViewCount,
  getAggregatedPageViews
} from '../controllers/pageViewController';

const router = Router();

router.post('/', validatePageView, trackPageView);

router.get('/count', auth, getPageViewCount);
router.get('/aggregate-date', auth, getAggregatedPageViews);

export default router;
