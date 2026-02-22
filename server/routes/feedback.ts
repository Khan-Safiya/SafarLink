import express, { Request, Response } from 'express';
import crypto from 'crypto';
import JourneyFeedback from '../models/JourneyFeedback';
import UserFeedbackStats, { LOYALTY_MILESTONES, MILESTONE_DISCOUNT_PCT } from '../models/UserFeedbackStats';

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCouponCode(milestone: number): string {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SAFARLINK${milestone}-${suffix}`;
}

function couponExpiryDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 3); // 3-month expiry
  return d;
}

/**
 * After a new feedback submission, check if the user crossed a milestone
 * and mint a coupon if so.
 */
async function checkAndMintCoupon(
  stats: InstanceType<typeof UserFeedbackStats>,
  newTotal: number
): Promise<null | { milestone: number; coupon: { code: string; discountPct: number; expiresAt: Date } }> {
  for (const milestone of LOYALTY_MILESTONES) {
    if (newTotal >= milestone && !stats.earnedMilestones.includes(milestone)) {
      const code = generateCouponCode(milestone);
      const expiresAt = couponExpiryDate();
      const coupon = {
        code,
        discountPct: MILESTONE_DISCOUNT_PCT,
        milestone,
        earned: new Date(),
        expiresAt,
        used: false,
      };
      stats.earnedMilestones.push(milestone);
      stats.availableCoupons.push(coupon);
      return { milestone, coupon: { code, discountPct: MILESTONE_DISCOUNT_PCT, expiresAt } };
    }
  }
  return null;
}

// ── POST /api/feedback/journey ─────────────────────────────────────────────────
// Submit journey feedback and get loyalty milestone info back
router.post('/journey', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.userId || !body.overallRating) {
      return res.status(400).json({ error: 'userId and overallRating are required.' });
    }

    // Save the feedback document
    const feedback = await JourneyFeedback.create(body);

    // Update or create user stats
    let stats = await UserFeedbackStats.findOne({ userId: body.userId });
    if (!stats) {
      stats = new UserFeedbackStats({ userId: body.userId });
    }

    stats.totalFeedbacks += 1;
    stats.routeAccuracySum += body.routeAccuracy ?? 0;
    stats.comfortSum       += body.comfortRating ?? 0;
    stats.waitTimeSum      += body.waitTimeRating ?? 0;
    if (body.fareMatch)        stats.fareMatchCount  += 1;
    if (body.journeyTimeMatch) stats.timeMatchCount  += 1;
    stats.updatedAt = new Date();

    const newMilestone = await checkAndMintCoupon(stats, stats.totalFeedbacks);
    await stats.save();

    return res.status(201).json({
      feedback: feedback._id,
      totalFeedbacks: stats.totalFeedbacks,
      newMilestone: newMilestone ?? null,
      nextMilestone: LOYALTY_MILESTONES.find(m => m > stats!.totalFeedbacks) ?? null,
      feedbacksUntilNext: LOYALTY_MILESTONES.find(m => m > stats!.totalFeedbacks)
        ? (LOYALTY_MILESTONES.find(m => m > stats!.totalFeedbacks)! - stats!.totalFeedbacks)
        : 0,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feedback/stats/:userId ────────────────────────────────────────────
// Get user's feedback stats + available coupons + progress to next milestone
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await UserFeedbackStats.findOne({ userId: req.params.userId });
    if (!stats) {
      return res.json({
        totalFeedbacks: 0,
        earnedMilestones: [],
        availableCoupons: [],
        nextMilestone: 25,
        feedbacksUntilNext: 25,
        progressPct: 0,
      });
    }
    const next = LOYALTY_MILESTONES.find(m => m > stats.totalFeedbacks) ?? null;
    const prev = [...LOYALTY_MILESTONES].reverse().find(m => m <= stats.totalFeedbacks) ?? 0;
    const progressPct = next ? Math.round(((stats.totalFeedbacks - prev) / (next - prev)) * 100) : 100;

    return res.json({
      totalFeedbacks: stats.totalFeedbacks,
      earnedMilestones: stats.earnedMilestones,
      availableCoupons: stats.availableCoupons.filter((c: any) => !c.used),
      nextMilestone: next,
      feedbacksUntilNext: next ? next - stats.totalFeedbacks : 0,
      progressPct,
      averages: {
        routeAccuracy: stats.totalFeedbacks > 0 ? +(stats.routeAccuracySum / stats.totalFeedbacks).toFixed(2) : 0,
        comfort: stats.totalFeedbacks > 0 ? +(stats.comfortSum / stats.totalFeedbacks).toFixed(2) : 0,
        waitTime: stats.totalFeedbacks > 0 ? +(stats.waitTimeSum / stats.totalFeedbacks).toFixed(2) : 0,
        fareMatchRate: stats.totalFeedbacks > 0 ? Math.round((stats.fareMatchCount / stats.totalFeedbacks) * 100) : 0,
        timeMatchRate: stats.totalFeedbacks > 0 ? Math.round((stats.timeMatchCount / stats.totalFeedbacks) * 100) : 0,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feedback/route-accuracy ──────────────────────────────────────────
// Get aggregated accuracy data by route type (for route suggestion algorithm)
router.get('/route-accuracy', async (req: Request, res: Response) => {
  try {
    const { origin, destination, journeyType } = req.query;
    const match: any = {};
    if (origin)      match.origin      = { $regex: origin as string, $options: 'i' };
    if (destination) match.destination = { $regex: destination as string, $options: 'i' };
    if (journeyType) match.journeyType = journeyType;

    const agg = await JourneyFeedback.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$journeyType',
          avgRouteAccuracy: { $avg: '$routeAccuracy' },
          avgComfort:        { $avg: '$comfortRating' },
          avgWaitTime:       { $avg: '$waitTimeRating' },
          fareMatchRate:     { $avg: { $cond: ['$fareMatch', 1, 0] } },
          timeMatchRate:     { $avg: { $cond: ['$journeyTimeMatch', 1, 0] } },
          count:             { $sum: 1 },
        }
      },
      { $sort: { avgRouteAccuracy: -1 } }
    ]);
    return res.json(agg);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/feedback/use-coupon ─────────────────────────────────────────────
router.post('/use-coupon', async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    const stats = await UserFeedbackStats.findOne({ userId });
    if (!stats) return res.status(404).json({ error: 'User not found.' });

    const couponIdx = stats.availableCoupons.findIndex((c: any) => c.code === code && !c.used);
    if (couponIdx === -1) return res.status(404).json({ error: 'Coupon not found or already used.' });

    const coupon = stats.availableCoupons[couponIdx];
    if (new Date() > coupon.expiresAt) return res.status(400).json({ error: 'Coupon has expired.' });

    stats.availableCoupons[couponIdx].used = true;
    stats.usedCoupons.push(stats.availableCoupons[couponIdx]);
    stats.availableCoupons.splice(couponIdx, 1);
    await stats.save();

    return res.json({ success: true, discountPct: coupon.discountPct });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/feedback/history/:userId ─────────────────────────────────────────
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const feedbacks = await JourneyFeedback.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    return res.json(feedbacks);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
