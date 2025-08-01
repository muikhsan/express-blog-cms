import { Request, Response } from 'express';
import { Article } from '../models/Article';
import { sanitizeArticle, sanitizeArticles } from '../utils/sanitizers';
import { Types } from 'mongoose';
import {
  AuthRequest,
  SanitizedArticle,
  StandardResponse,
  ArticleQueryParams,
  ArticleStatus,
  ArticleMatchFilter,
  PaginatedResponse,
  PaginationMeta
} from '../types';

export const createArticle = async (req: AuthRequest, res: Response<StandardResponse<{ article: SanitizedArticle }>>): Promise<void> => {
  try {
    const { title, content, status = 'draft' }: { title: string; content: string; status?: ArticleStatus } = req.body;

    const existingArticleCheck = await Article.findOne({
      title: title,
      author: req.user?._id,
      deleted: { $ne: true }
    });
    if (existingArticleCheck) {
      res.status(400).json({ error: 'An article with this title already exists.' });
      return;
    }

    const article = new Article({
      title,
      content,
      status,
      author: req.user?._id
    });

    await article.save();

    res.status(201).json({
      message: 'Article created successfully',
      data: { article: sanitizeArticle(article) }
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getArticles = async (req: Request<{}, PaginatedResponse<SanitizedArticle> | StandardResponse, {}, ArticleQueryParams>, res: Response<PaginatedResponse<SanitizedArticle> | StandardResponse>): Promise<void> => {
  try {
    const { status, author, page = 1, limit = 10 } = req.query;
    const authReq = req as AuthRequest;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    let matchFilter: ArticleMatchFilter = {};

    if (author) {
      matchFilter.author = new Types.ObjectId(author);
    }

    let statusArray: ArticleStatus[] = [];
    if (status) {
      if (Array.isArray(status)) {
        statusArray = status.filter((s): s is ArticleStatus =>
          s === 'published' || s === 'draft'
        );
      } else {
        const validStatus = status === 'published' || status === 'draft' ? status as ArticleStatus : null;
        if (validStatus) statusArray = [validStatus];
      }

      if (statusArray.length === 0) {
        res.status(400).json({ error: 'Status must be either "published" or "draft"' });
        return;
      }
    }

    if (!authReq.user) {
      if (statusArray.length === 0) {
        matchFilter.status = 'published';
      } else {
        const allowedStatuses = statusArray.filter(s => s !== 'draft');
        if (allowedStatuses.length === 0) {
          // Only draft requested - return empty paginated response
          const emptyPagination: PaginatedResponse<SanitizedArticle> = {
            data: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limitNum,
              hasNextPage: false,
              hasPrevPage: false
            }
          };
          res.json(emptyPagination);
          return;
        }
        matchFilter.status = { $in: allowedStatuses };
      }
    } else {
      // Authenticated users
      if (statusArray.length === 0) {
        matchFilter.$or = [
          { status: 'published' },
          // { status: 'draft', author: authReq.user._id }
        ];
      } else if (statusArray.includes('draft')) {
        // Draft requested - show user's drafts + other requested statuses
        const otherStatuses = statusArray.filter(s => s !== 'draft');
        const conditions: any[] = [{ status: 'draft', author: authReq.user._id }];

        if (otherStatuses.length > 0) {
          conditions.push({ status: { $in: otherStatuses } });
        }

        matchFilter.$or = conditions;
      } else {
        matchFilter.status = { $in: statusArray };
      }
    }

    // Count total documents for pagination
    const countPipeline = [
      { $match: { ...matchFilter, deleted: { $ne: true } } },
      { $count: "total" }
    ];

    const countResult = await Article.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].total : 0;
    const totalPages = Math.ceil(totalItems / limitNum);

    const pipeline: any[] = [
      { $match: { ...matchFilter, deleted: { $ne: true } } },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1
              }
            }
          ]
        }
      },
      { $unwind: '$authorInfo' },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $project: {
          _id: 1,
          title: 1,
          content: {
            $cond: {
              if: { $gte: [{ $strLenCP: "$content" }, 50] },
              then: { $concat: [{ $substr: ["$content", 0, 50] }, "..."] },
              else: "$content"
            }
          },
          status: 1,
          author: '$authorInfo',
          createdAt: 1,
          updatedAt: 1
        }
      }
    ];

    const articles = await Article.aggregate(pipeline);

    const paginationMeta: PaginationMeta = {
      currentPage: pageNum,
      totalPages,
      totalItems,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    };

    const response: PaginatedResponse<SanitizedArticle> = {
      data: sanitizeArticles(articles),
      pagination: paginationMeta
    };

    res.json(response);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getArticle = async (req: Request, res: Response<SanitizedArticle | StandardResponse>): Promise<void> => {
  try {
    const articleId = req.params.id;
    const authReq = req as AuthRequest;

    const article = await Article.findOne({
      _id: new Types.ObjectId(articleId),
      deleted: { $ne: true }
    }).populate({
      path: 'author',
      select: 'name'
    });
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    if (article.status === 'draft') {
      if (!authReq.user) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (article.author._id.toString() !== authReq.user._id.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json(sanitizeArticle(article));
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateArticle = async (req: AuthRequest, res: Response<StandardResponse<{ article: SanitizedArticle }>>): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;

    const article = await Article.findById(id).select('_id title author');
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    if (article.author.toString() !== req.user?._id.toString()) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const existingArticle = await Article.findOne({
      _id: { $ne: id },
      title,
      author: req.user?._id
    });
    if (existingArticle) {
      res.status(400).json({ error: 'An article with this title already exists.' });
      return;
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      { title, content, status },
      { new: true, runValidators: true }
    ).populate({ path: 'author', select: 'name' });

    if (!updatedArticle) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({
      message: 'Article updated successfully',
      data: { article: sanitizeArticle(updatedArticle) }
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteArticle = async (req: AuthRequest, res: Response<StandardResponse>): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id).select('_id title author');

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    if (article.author.toString() !== req.user?._id.toString()) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await Article.findByIdAndUpdate(id, { deleted: true, status: 'deleted' }, { new: true });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
