import { Router, Request, Response } from 'express';
import Incident from '../models/Incident';

const router = Router();

// ── POST /api/incidents — report a new incident ───────────────────────────────
router.post('/', async (req: Request, res: Response) => {
    try {
        const { lat, lng, type, description, routeId, reportedBy } = req.body;
        const incident = await Incident.create({
            lat, lng, type, description,
            routeId: routeId || 'global',
            reportedBy: reportedBy || 'anonymous',
        });
        res.status(201).json(incident);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/incidents?routeId=... — get active incidents for a route ─────────
router.get('/', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.query;
        const filter: any = {
            active: true,
            expiresAt: { $gt: new Date() },
        };
        if (routeId) filter.routeId = routeId;
        const incidents = await Incident.find(filter).sort({ createdAt: -1 });
        res.json(incidents);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/incidents/:id/confirm — confirm an existing incident ────────────
router.post('/:id/confirm', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            {
                $addToSet: { confirmedBy: userId || 'anonymous' },
                $set: { severity: 'high' }, // auto-escalate on confirmation
            },
            { new: true }
        );
        if (!incident) return res.status(404).json({ error: 'Incident not found' });
        res.json(incident);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/incidents/:id — mark incident as resolved ─────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await Incident.findByIdAndUpdate(req.params.id, { active: false });
        res.json({ ok: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
