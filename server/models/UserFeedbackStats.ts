import mongoose, { Document, Schema } from 'mongoose';

// Loyalty milestones: at these feedback counts, user earns a discount coupon
export const LOYALTY_MILESTONES = [25, 50, 75, 100];
export const MILESTONE_DISCOUNT_PCT = 25; // 25% off on next ride

export interface IUserFeedbackStats extends Document {
  userId: string;
  totalFeedbacks: number;
  earnedMilestones: number[];   // which milestones have been reached e.g. [25, 50]
  availableCoupons: ICoupon[];
  usedCoupons: ICoupon[];

  // Aggregated ratings this user's feedback contributed to (for route accuracy)
  routeAccuracySum: number;
  comfortSum: number;
  waitTimeSum: number;
  fareMatchCount: number;       // how many rides had fare match = true
  timeMatchCount: number;
  updatedAt: Date;
}

export interface ICoupon {
  code: string;
  discountPct: number;           // e.g. 25
  milestone: number;             // which milestone unlocked this
  earned: Date;
  expiresAt: Date;
  used: boolean;
}

const CouponSchema = new Schema({
  code:        { type: String, required: true },
  discountPct: { type: Number, required: true },
  milestone:   { type: Number, required: true },
  earned:      { type: Date, default: Date.now },
  expiresAt:   { type: Date, required: true },
  used:        { type: Boolean, default: false }
}, { _id: false });

const UserFeedbackStatsSchema: Schema = new Schema({
  userId:           { type: String, required: true, unique: true, index: true },
  totalFeedbacks:   { type: Number, default: 0 },
  earnedMilestones: { type: [Number], default: [] },
  availableCoupons: { type: [CouponSchema], default: [] },
  usedCoupons:      { type: [CouponSchema], default: [] },

  routeAccuracySum: { type: Number, default: 0 },
  comfortSum:       { type: Number, default: 0 },
  waitTimeSum:      { type: Number, default: 0 },
  fareMatchCount:   { type: Number, default: 0 },
  timeMatchCount:   { type: Number, default: 0 },
  updatedAt:        { type: Date, default: Date.now }
});

export default mongoose.model<IUserFeedbackStats>('UserFeedbackStats', UserFeedbackStatsSchema);
