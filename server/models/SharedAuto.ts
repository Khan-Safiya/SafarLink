import mongoose, { Schema, Document } from 'mongoose';

export interface IPassenger {
    userId: string;
    userName: string;
    bookedAt: Date;
}

export interface ISharedAuto extends Document {
    // Driver info (fixed: Ramesh)
    driverId: string;
    driverName: string;
    driverPhone: string;
    vehicleNumber: string;
    rating: number;

    // Route
    from: string;
    to: string;
    farePerSeat: number;
    estimatedMinutes: number;
    distanceKm: number;

    // Seats
    totalSeats: number;
    availableSeats: number;
    passengers: IPassenger[];

    // Status
    status: 'waiting' | 'full' | 'departed' | 'completed';
    departsAt: Date | null;
    createdAt: Date;
}

const PassengerSchema = new Schema<IPassenger>({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    bookedAt: { type: Date, default: Date.now },
}, { _id: false });

const SharedAutoSchema = new Schema<ISharedAuto>({
    driverId:     { type: String, required: true },
    driverName:   { type: String, required: true },
    driverPhone:  { type: String, required: true },
    vehicleNumber:{ type: String, default: 'MH 12 KM 7777' },
    rating:       { type: Number, default: 4.6 },

    from:             { type: String, required: true },
    to:               { type: String, required: true },
    farePerSeat:      { type: Number, default: 15 },
    estimatedMinutes: { type: Number, default: 12 },
    distanceKm:       { type: Number, default: 2.8 },

    totalSeats:     { type: Number, default: 3 },
    availableSeats: { type: Number, default: 3 },
    passengers:     { type: [PassengerSchema], default: [] },

    status:    { type: String, enum: ['waiting', 'full', 'departed', 'completed'], default: 'waiting' },
    departsAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model<ISharedAuto>('SharedAuto', SharedAutoSchema);
