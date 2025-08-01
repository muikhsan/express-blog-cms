import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPageView extends Document {
  article: Types.ObjectId;
  viewedAt: Date;
  ipAddress: string;
  userAgent?: string;
  device?: {
    type: string; // mobile, tablet, desktop
    os?: string;
    browser?: string;
  };
}

const pageViewSchema = new Schema<IPageView>({
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    },
    os: String,
    browser: String
  }
});

pageViewSchema.index({ article: 1 });
pageViewSchema.index({ viewedAt: 1 });
pageViewSchema.index({ ipAddress: 1 });
pageViewSchema.index({ 'device.type': 1 });

export const PageView = mongoose.model<IPageView>('PageView', pageViewSchema);
