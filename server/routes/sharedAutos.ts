import express, { Request, Response } from 'express';
import { ClerkExpressRequireAuth, RequireAuthProp } from '@clerk/clerk-sdk-node';
import RideRequest from '../models/RideRequest';
import Ride from '../models/Ride';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RideRequest:
 *       type: object
 *       required:
 *         - from
 *         - to
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the ride request
 *         userId:
 *           type: string
 *           description: The user id
 *         userName:
 *           type: string
 *           description: The user name
 *         from:
 *           type: string
 *           description: Starting point
 *         to:
 *           type: string
 *           description: Destination
 *         status:
 *           type: string
 *           enum: [pending, accepted, cancelled]
 *           description: Status of the request
 *       example:
 *         id: d5fE_asz
 *         userId: user_123
 *         userName: John Doe
 *         from: Sector 18
 *         to: Noida Electronic City
 *         status: pending
 */

/**
 * @swagger
 * tags:
 *   name: SharedAuto
 *   description: Shared Auto Grouping API
 */

/**
 * @swagger
 * /api/shared-autos/request:
 *   post:
 *     summary: Request a Shared Auto Ride
 *     tags: [SharedAuto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *               - userName
 *             properties:
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               userName:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created ride request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RideRequest'
 */
router.post('/request', ClerkExpressRequireAuth({}), async (req: any, res: Response) => {
  try {
    const { from, to, userName } = req.body;
    
    const newRequest = new RideRequest({
      userId: req.auth.userId,
      userName,
      from,
      to
    });

    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ride request' });
  }
});

/**
 * @swagger
 * /api/shared-autos/grouped:
 *   get:
 *     summary: Get grouped ride requests (For Drivers)
 *     tags: [SharedAuto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Filter by destination
 *     responses:
 *       200:
 *         description: List of grouped requests
 */
router.get('/grouped', ClerkExpressRequireAuth({}), async (req: Request, res: Response) => {
    try {
        const { to } = req.query;
        let query: any = { status: 'pending' };

        if (to) {
            query.to = { $regex: to as string, $options: 'i' };
        }

        // Fetch all pending requests
        const requests = await RideRequest.find(query);

        // Simple mock grouping: Group by 'to' destination
        // In a real app, this would use geospatial clustering
        const groups: any = {};
        
        requests.forEach(req => {
            const key = req.to.toLowerCase(); // Simple grouping key
            if (!groups[key]) {
                groups[key] = {
                    destination: req.to,
                    count: 0,
                    riders: [],
                    requestIds: []
                };
            }
            groups[key].count++;
            groups[key].riders.push(req.userName);
            groups[key].requestIds.push(req._id);
        });

        res.json(Object.values(groups));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch grouped rides' });
    }
});

export default router;
