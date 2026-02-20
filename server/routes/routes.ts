import express, { Request, Response } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Journey Planning API
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get journey routes between two locations
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Starting location
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination location
 *     responses:
 *       200:
 *         description: List of suggested routes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [cheapest, fastest, safest]
 *                   totalCost:
 *                     type: number
 *                   totalDuration:
 *                     type: number
 *                   safetyScore:
 *                     type: number
 *                   segments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         mode:
 *                           type: string
 *                         duration:
 *                           type: number
 *                         cost:
 *                           type: number
 *                         description:
 *                           type: string
 */

interface SubRoute {
  mode: 'walking' | 'bus' | 'metro' | 'auto' | 'shared-auto' | 'pooling';
  duration: number; // minutes
  cost: number; // currency units
  description: string;
}

interface JourneyRoute {
  id: string;
  type: 'cheapest' | 'fastest' | 'safest';
  totalCost: number;
  totalDuration: number;
  safetyScore: number; // 1-10
  segments: SubRoute[];
  color: string;
}

// Mock data generator
const generateRoutes = (from: string, to: string): JourneyRoute[] => {
  return [
    {
      id: 'r1',
      type: 'cheapest',
      totalCost: 25,
      totalDuration: 45,
      safetyScore: 7,
      color: 'green',
      segments: [
        { mode: 'walking', duration: 10, cost: 0, description: 'Walk into bus stop' },
        { mode: 'bus', duration: 30, cost: 15, description: 'Bus 543 to Metro Station' },
        { mode: 'shared-auto', duration: 5, cost: 10, description: 'Shared Auto to Destination' },
      ]
    },
    {
      id: 'r2',
      type: 'fastest',
      totalCost: 80,
      totalDuration: 25,
      safetyScore: 8,
      color: 'blue',
      segments: [
        { mode: 'auto', duration: 25, cost: 80, description: 'Direct Auto Ride' },
      ]
    },
    {
      id: 'r3',
      type: 'safest',
      totalCost: 40,
      totalDuration: 35,
      safetyScore: 9.5,
      color: 'green',
      segments: [
        { mode: 'walking', duration: 5, cost: 0, description: 'Walk to Metro' },
        { mode: 'metro', duration: 20, cost: 30, description: 'Metro Yellow Line' },
        { mode: 'walking', duration: 10, cost: 0, description: 'Walk through Main Market' },
      ]
    }
  ];
};

router.get('/', ClerkExpressRequireAuth({}), (req: any, res: Response) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
      return res.status(400).json({ error: "From and To locations are required" });
  }

  const routes = generateRoutes(from as string, to as string);
  res.json(routes);
});

export default router;
