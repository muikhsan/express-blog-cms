import mongoose, { Document, Schema } from 'mongoose';
import * as mongooseDelete from 'mongoose-delete';

export interface IArticle extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  status: 'draft' | 'published';
  author: mongoose.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
  deletedAt?: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [50000, 'Content cannot exceed 50000 characters']
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required']
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters']
    }]
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

articleSchema.plugin(mongooseDelete.default, { deletedAt: true });

articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ title: 'text', content: 'text' });

export const Article = mongoose.model<IArticle>('Article', articleSchema);
