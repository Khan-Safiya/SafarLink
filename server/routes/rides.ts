import express, { Request, Response } from 'express';
import { ClerkExpressRequireAuth, RequireAuthProp } from '@clerk/clerk-sdk-node';
import Ride from '../models/Ride';

const router = express.Router();
console.log("Ride Routes Loaded");

/**
 * @swagger
 * components:
 *   schemas:
 *     Ride:
 *       type: object
 *       required:
 *         - driverId
 *         - driverName
 *         - from
 *         - to
 *         - departureTime
 *         - costPerSeat
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the ride
 *         driverId:
 *           type: string
 *           description: The driver's user id
 *         driverName:
 *           type: string
 *           description: The driver's name
 *         vehicleType:
 *           type: string
 *           description: Type of vehicle
 *         from:
 *           type: string
 *           description: Starting point
 *         to:
 *           type: string
 *           description: Destination
 *         departureTime:
 *           type: string
 *           format: date-time
 *           description: Departure time
 *         availableSeats:
 *           type: number
 *           description: Number of available seats
 *         costPerSeat:
 *           type: number
 *           description: Cost per seat
 *         womenOnly:
 *           type: boolean
 *           description: If the ride is for women only
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: Status of the ride
 */

/**
 * @swagger
 * tags:
 *   name: Rides
 *   description: Ride Pooling API
 */

/**
 * @swagger
 * /api/rides:
 *   post:
 *     summary: Create a new ride (Driver)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ride'
 *     responses:
 *       201:
 *         description: The created ride
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ride'
 *   get:
 *     summary: Get available rides
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Filter by destination
 *       - in: query
 *         name: womenOnly
 *         schema:
 *           type: boolean
 *         description: Filter for women-only rides
 *     responses:
 *       200:
 *         description: List of available rides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ride'
 */

// Post a new ride (Driver)
router.post('/', ClerkExpressRequireAuth({}), async (req: any, res: Response) => {
  try {
    const { driverName, vehicleType, from, to, departureTime, availableSeats, costPerSeat, womenOnly } = req.body;
    
    const newRide = new Ride({
      driverId: req.auth.userId,
      driverName,
      vehicleType,
      from,
      to,
      departureTime,
      availableSeats,
      costPerSeat,
      womenOnly
    });

    const savedRide = await newRide.save();
    res.status(201).json(savedRide);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Get available rides (Rider)
// Filters: to (destination), womenOnly, minSeats
router.get('/', ClerkExpressRequireAuth({}), async (req: Request, res: Response) => {
  try {
    const { to, womenOnly } = req.query;
    
    let query: any = { status: 'active', availableSeats: { $gt: 0 } };

    if (to) {
        // Simple case-insensitive match for demo
        query.to = { $regex: to as string, $options: 'i' };
    }

    if (womenOnly === 'true') {
        query.womenOnly = true;
    }

    const rides = await Ride.find(query).sort({ departureTime: 1 });
    res.json(rides);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

export default router;
