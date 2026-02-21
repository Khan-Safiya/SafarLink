import express, { Request, Response } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import PoolRide from '../models/PoolRide';
import axios from 'axios';

const router = express.Router();

const WA_BOT_URL = process.env.WA_BOT_URL || 'http://localhost:3001';

// ── GET /api/pool-rides ───────────────────────────────────────────────────────
// Search for available pool rides
router.get('/', async (req: Request, res: Response) => {
    try {
        const { from, to, vehicleType, womenOnly } = req.query;
        let query: any = { status: 'active', availableSeats: { $gt: 0 } };

        // Exclude past rides
        query.departureTime = { $gt: new Date() };

        if (from) query.from = { $regex: from as string, $options: 'i' };
        if (to) query.to = { $regex: to as string, $options: 'i' };
        if (vehicleType && vehicleType !== 'All') query.vehicleType = vehicleType;

        // If womenOnly mode is on, ideally filter by host gender, but for this hackathon
        // we'll primarily simulate it by highlighting Scooter rides
        if (womenOnly === 'true') {
            query.vehicleType = 'Scooter';
        }

        const rides = await PoolRide.find(query).sort({ departureTime: 1 });
        res.json(rides);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/pool-rides ──────────────────────────────────────────────────────
// Host a new pool ride
router.post('/', ClerkExpressRequireAuth({}), async (req: any, res: Response) => {
    try {
        const {
            hostName, hostPhone, vehicleType, vehicleDetails,
            from, to, departureTime, totalSeats, farePerSeat, paymentDetails
        } = req.body;

        const dep = new Date(departureTime);
        const now = new Date();
        const diffMs = dep.getTime() - now.getTime();
        
        // Ensure less than or equal to 24 hours in advance
        if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) {
            return res.status(400).json({ error: 'Departure time must be between now and 24 hours in the future.' });
        }

        const ride = new PoolRide({
            hostId: req.auth.userId,
            hostName,
            hostPhone: hostPhone || '+917385875052', // Default to requested host number if missing
            vehicleType,
            vehicleDetails,
            from,
            to,
            departureTime: dep,
            totalSeats: parseInt(totalSeats),
            availableSeats: parseInt(totalSeats),
            farePerSeat: parseFloat(farePerSeat),
            paymentDetails
        });

        await ride.save();
        res.status(201).json(ride);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create pool ride' });
    }
});

// ── POST /api/pool-rides/:id/book ───────────────────────────────────────────
// Book a seat, pay advance, notify users via WhatsApp
router.post('/:id/book', async (req: Request, res: Response) => {
    try {
        const { userId, userName, userPhone } = req.body;
        
        const auto = await PoolRide.findById(req.params.id);
        if (!auto) return res.status(404).json({ error: 'Ride not found' });
        if (auto.availableSeats <= 0 || auto.status !== 'active')
            return res.status(409).json({ error: 'No seats available' });

        if (auto.riders.some(p => p.userId === userId))
            return res.status(409).json({ error: 'You have already booked this ride' });

        const advanceAmount = auto.farePerSeat * 0.10; // 10% advance

        const passengerNumber = userPhone || '+917058395184';
        const hostNumber = auto.hostPhone;

        auto.riders.push({
            userId,
            userName,
            userPhone: passengerNumber,
            bookedAt: new Date(),
            advancePaid: advanceAmount
        });

        auto.availableSeats -= 1;
        if (auto.availableSeats === 0) auto.status = 'full';

        await auto.save();

        // Send WhatsApp Notifications async
        try {
            // formatting time nicely
            const dt = new Date(auto.departureTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            // 1. Notify the Rider
            const riderMsg = `✅ *SafarLink Pool Ride Confirmed!*\n\n`
                + `📍 *${auto.from}* → *${auto.to}*\n`
                + `📅 *Time:* ${dt}\n`
                + `🚗 *Vehicle:* ${auto.vehicleType} (${auto.vehicleDetails})\n`
                + `👤 *Host:* ${auto.hostName}\n`
                + `📱 *Host Contact:* ${auto.hostPhone}\n\n`
                + `*Payment Details:*\n`
                + `Total Fare: ₹${auto.farePerSeat}\n`
                + `Advance Paid: ₹${advanceAmount.toFixed(2)}\n`
                + `To Pay Host: ₹${(auto.farePerSeat - advanceAmount).toFixed(2)}\n\n`
                + `Have a safe journey! 🙏`;

            await axios.post(`${WA_BOT_URL}/notify`, { phone: passengerNumber, message: riderMsg });

            // 2. Notify the Host
            const hostMsg = `🎉 *New Seat Booked in Your SafarLink Pool!*\n\n`
                + `📍 *${auto.from}* → *${auto.to}* at ${dt}\n`
                + `👤 *Rider:* ${userName}\n`
                + `📱 *Rider Contact:* ${passengerNumber}\n\n`
                + `Rider has paid 10% advance (₹${advanceAmount.toFixed(2)}). Collect ₹${(auto.farePerSeat - advanceAmount).toFixed(2)} during the ride.\n\n`
                + `*Remaining Seats:* ${auto.availableSeats}`;

            await axios.post(`${WA_BOT_URL}/notify`, { phone: hostNumber, message: hostMsg });

        } catch (botErr: any) {
            console.error("Failed to deliver WhatsApp notifications:", botErr.message);
            // We don't fail the booking if WA throws an error, just log it.
        }

        res.json({ ride: auto, advancePaid: advanceAmount });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
