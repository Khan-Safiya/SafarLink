import express, { Request, Response } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { User } from '../models/User';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - clerkId
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         clerkId:
 *           type: string
 *           description: The Clerk user id
 *         email:
 *           type: string
 *           description: The user email
 *         name:
 *           type: string
 *           description: The user name
 *         role:
 *           type: string
 *           enum: [user, driver, admin]
 *           description: The user role
 *         isVerifiedDriver:
 *           type: boolean
 *           description: If the user is a verified driver
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management API
 */

/**
 * @swagger
 * /api/users/sync:
 *   post:
 *     summary: Sync User from Clerk to MongoDB
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: The synced user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

// Sync user from Clerk to MongoDB
router.post('/sync', ClerkExpressRequireAuth({}), async (req: any, res: Response) => {
  try {
    const { userId } = req.auth;
    const { email, name } = req.body;

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      user = new User({
        clerkId: userId,
        email,
        name,
      });
      await user.save();
    } else {
        // Update user info if needed
        if (email) user.email = email;
        if (name) user.name = name;
        await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', ClerkExpressRequireAuth({}), async (req: any, res: Response) => {
    try {
        const { userId } = req.auth;
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
