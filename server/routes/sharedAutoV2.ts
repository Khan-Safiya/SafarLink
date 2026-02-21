import { Router, Request, Response } from 'express';
import SharedAuto from '../models/SharedAuto';

const router = Router();

const RAMESH = {
    driverId: 'driver_ramesh_001',
    driverName: 'Ramesh',
    driverPhone: '7385875052',
    vehicleNumber: 'MH 12 KM 7777',
    rating: 4.8,
    from: 'Bibwewadi',
    to: 'Swargate',
    farePerSeat: 15,
    estimatedMinutes: 12,
    distanceKm: 2.8,
    totalSeats: 3,
};

// ── Ensure Ramesh's auto exists (idempotent) ─────────────────────────────────

async function ensureRameshAuto() {
    const existing = await SharedAuto.findOne({
        driverId: RAMESH.driverId,
        status: { $in: ['waiting', 'full'] },
    });
    if (!existing) {
        await SharedAuto.create({
            ...RAMESH,
            availableSeats: RAMESH.totalSeats,
            passengers: [],
            status: 'waiting',
        });
        console.log('✅ Ramesh SharedAuto created');
    }
    return existing ?? await SharedAuto.findOne({ driverId: RAMESH.driverId, status: { $in: ['waiting', 'full'] } });
}

// ── GET /api/shared-autos/available?from=&to= ────────────────────────────────
// Returns all available (waiting/full) shared autos on a route

router.get('/available', async (req: Request, res: Response) => {
    try {
        await ensureRameshAuto();
        const { from, to } = req.query;
        const filter: any = { status: { $in: ['waiting', 'full'] } };
        if (from) filter.from = { $regex: from as string, $options: 'i' };
        if (to) filter.to = { $regex: to as string, $options: 'i' };
        const autos = await SharedAuto.find(filter).sort({ createdAt: -1 });
        res.json(autos);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/shared-autos/:id ────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const auto = await SharedAuto.findById(req.params.id);
        if (!auto) return res.status(404).json({ error: 'Not found' });
        res.json(auto);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/shared-autos/:id/book ─────────────────────────────────────────
// Book a seat — decrements availableSeats, adds passenger

router.post('/:id/book', async (req: Request, res: Response) => {
    try {
        const { userId, userName } = req.body;
        if (!userId || !userName) return res.status(400).json({ error: 'userId and userName required' });

        const auto = await SharedAuto.findById(req.params.id);
        if (!auto) return res.status(404).json({ error: 'Auto not found' });
        if (auto.availableSeats <= 0 || auto.status === 'full' || auto.status === 'departed')
            return res.status(409).json({ error: 'No seats available' });

        // Check already booked
        if (auto.passengers.some(p => p.userId === userId))
            return res.status(409).json({ error: 'Already booked' });

        auto.passengers.push({ userId, userName, bookedAt: new Date() });
        auto.availableSeats -= 1;
        if (auto.availableSeats === 0) auto.status = 'full';

        await auto.save();
        res.json(auto);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/shared-autos/:id/cancel ───────────────────────────────────────
// Cancel a booking — increments availableSeats, removes passenger

router.post('/:id/cancel', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const auto = await SharedAuto.findById(req.params.id);
        if (!auto) return res.status(404).json({ error: 'Auto not found' });
        if (auto.status === 'departed') return res.status(409).json({ error: 'Auto already departed — cannot cancel' });

        const before = auto.passengers.length;
        auto.passengers = auto.passengers.filter(p => p.userId !== userId) as typeof auto.passengers;
        if (auto.passengers.length === before)
            return res.status(404).json({ error: 'Booking not found for this user' });

        auto.availableSeats = Math.min(auto.availableSeats + 1, auto.totalSeats);
        if (auto.status === 'full' && auto.availableSeats > 0) auto.status = 'waiting';

        await auto.save();
        res.json(auto);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/shared-autos/:id/depart ───────────────────────────────────────
// Driver marks auto as departed

router.post('/:id/depart', async (req: Request, res: Response) => {
    try {
        const auto = await SharedAuto.findByIdAndUpdate(
            req.params.id,
            { status: 'departed', departsAt: new Date() },
            { new: true }
        );
        if (!auto) return res.status(404).json({ error: 'Auto not found' });
        res.json(auto);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/shared-autos/reset-ramesh ──────────────────────────────────────
// Resets Ramesh's auto to waiting state (for demo/hackathon testing)

router.post('/reset-ramesh', async (req: Request, res: Response) => {
    try {
        await SharedAuto.updateMany(
            { driverId: RAMESH.driverId },
            { status: 'completed' }
        );
        const fresh = await SharedAuto.create({
            ...RAMESH,
            availableSeats: RAMESH.totalSeats,
            passengers: [],
            status: 'waiting',
        });
        res.json(fresh);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
