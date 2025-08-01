import { Request, Response } from 'express';
import { PageView } from '../models/PageView';
import { Article } from '../models/Article';
import { Types } from 'mongoose';
import { StandardResponse, PageViewAnalytics, PageViewCountResponse, PageViewRequest } from '../types';
import { getDeviceAndIP } from '../utils/deviceDetection';

export const trackPageView = async (req: Request<{}, StandardResponse, PageViewRequest>, res: Response<StandardResponse>): Promise<void> => {
  try {
    const { article } = req.body;

    const articleCheck = await Article.findOne({
      _id: new Types.ObjectId(article),
      deleted: { $ne: true },
      status: 'published'
    });

    if (!articleCheck) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    // Extract device and IP information
    const { ipAddress, userAgent, device } = getDeviceAndIP(req);

    const pageView = new PageView({
      article: new Types.ObjectId(article),
      ipAddress,
      userAgent,
      device
    });
    await pageView.save();

    res.status(201).json({
      message: 'Page view tracked successfully',
      data: {
        id: articleCheck._id,
        title: articleCheck.title,
        status: articleCheck.status
      }
    });
  } catch (error) {
    console.error('Track page view error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getPageViewCount = async (req: Request, res: Response<PageViewCountResponse | StandardResponse>): Promise<void> => {
  try {
    const { article, startAt, endAt } = req.query;
    const matchStage: any = {};

    if (article) {
      matchStage.article = new Types.ObjectId(article as string);
    }

    if (startAt || endAt) {
      matchStage.viewedAt = {};
      if (startAt) {
        matchStage.viewedAt.$gte = new Date(startAt as string);
      }
      if (endAt) {
        matchStage.viewedAt.$lte = new Date(endAt as string);
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'articles',
          localField: 'article',
          foreignField: '_id',
          as: 'articleInfo'
        }
      },
      {
        $unwind: '$articleInfo'
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          articles: {
            $addToSet: {
              id: '$articleInfo._id',
              title: '$articleInfo.title',
              status: '$articleInfo.status'
            }
          }
        }
      }
    ];

    const result = await PageView.aggregate(pipeline);

    if (result.length === 0) {
      res.json({ count: 0, articles: [] });
      return;
    }

    res.json({
      count: result[0].totalViews,
      articles: result[0].articles
    });
  } catch (error) {
    console.error('Get page view count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAggregatedPageViews = async (req: Request, res: Response<PageViewAnalytics[] | StandardResponse>): Promise<void> => {
  try {
    const { interval = 'daily', article, startAt, endAt } = req.query;

    const matchStage: any = {};

    if (article) {
      matchStage.article = new Types.ObjectId(article as string);
    }

    if (startAt || endAt) {
      matchStage.viewedAt = {};
      if (startAt) {
        matchStage.viewedAt.$gte = new Date(startAt as string);
      }
      if (endAt) {
        matchStage.viewedAt.$lte = new Date(endAt as string);
      }
    }

    let groupId: any;

    switch (interval) {
      case 'hourly':
        groupId = {
          year: { $year: '$viewedAt' },
          month: { $month: '$viewedAt' },
          day: { $dayOfMonth: '$viewedAt' },
          hour: { $hour: '$viewedAt' }
        };
        break;
      case 'monthly':
        groupId = {
          year: { $year: '$viewedAt' },
          month: { $month: '$viewedAt' }
        };
        break;
      case 'daily':
        groupId = {
          year: { $year: '$viewedAt' },
          month: { $month: '$viewedAt' },
          day: { $dayOfMonth: '$viewedAt' }
        };
        break;
      default:
        res.status(400).json({ error: 'Invalid interval.' });
        return;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'articles',
          localField: 'article',
          foreignField: '_id',
          as: 'articleInfo'
        }
      },
      {
        $unwind: '$articleInfo'
      },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          articles: {
            $addToSet: {
              id: '$articleInfo._id',
              title: '$articleInfo.title',
              status: '$articleInfo.status'
            }
          }
        }
      },
      { $sort: { '_id': 1 as const } }
    ];

    const results = await PageView.aggregate(pipeline);

    const formattedResults = results.map((result: any) => {
      let dateStr = '';
      const { year, month, day, hour } = result._id;

      if (interval === 'hourly') {
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:00`;
      } else if (interval === 'monthly') {
        dateStr = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      return {
        date: dateStr,
        count: result.count,
        articles: result.articles
      };
    });

    res.json(formattedResults);
  } catch (error) {
    console.error('Get aggregated page views error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
