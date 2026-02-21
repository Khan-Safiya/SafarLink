import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
    lat: number;
    lng: number;
    type: 'road_blocked' | 'accident' | 'waterlogging' | 'police_naka' | 'oil_spill' | 'other';
    description: string;
    routeId: string;       // stringified origin+destination key
    reportedBy: string;    // userId or socket id
    confirmedBy: string[]; // user IDs who confirmed
    severity: 'low' | 'medium' | 'high';
    active: boolean;
    expiresAt: Date;
    createdAt: Date;
}

const IncidentSchema = new Schema<IIncident>({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    type: {
        type: String,
        enum: ['road_blocked', 'accident', 'waterlogging', 'police_naka', 'oil_spill', 'other'],
        default: 'other',
    },
    description: { type: String, default: '' },
    routeId: { type: String, required: true },
    reportedBy: { type: String, required: true },
    confirmedBy: { type: [String], default: [] },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    active: { type: Boolean, default: true },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 60 * 1000), // 90 min TTL
    },
}, { timestamps: true });

// Auto-expire index
IncidentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IIncident>('Incident', IncidentSchema);
