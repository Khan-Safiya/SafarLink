import mongoose, { Document, Schema } from 'mongoose';

export interface IPoolPassenger {
    userId: string;
    userName: string;
    userPhone: string;
    bookedAt: Date;
    advancePaid: number;
}

export interface IPoolRide extends Document {
    hostId: string;
    hostName: string;
    hostPhone: string;
    vehicleType: 'Bike' | 'Car' | 'Scooter';
    vehicleDetails: string; // e.g., Model, License Plate
    from: string;
    to: string;
    departureTime: Date; // validated to be <= 24h
    totalSeats: number;
    availableSeats: number;
    farePerSeat: number;
    paymentDetails: string; // UPI ID or similar
    riders: IPoolPassenger[];
    status: 'active' | 'full' | 'departed' | 'cancelled';
    createdAt: Date;
}

const PoolPassengerSchema = new Schema<IPoolPassenger>({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    bookedAt: { type: Date, default: Date.now },
    advancePaid: { type: Number, required: true }
}, { _id: false });

const PoolRideSchema: Schema = new Schema({
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    hostPhone: { type: String, required: true },
    vehicleType: { type: String, enum: ['Bike', 'Car', 'Scooter'], required: true },
    vehicleDetails: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureTime: { type: Date, required: true },
    totalSeats: { type: Number, required: true, min: 1, max: 6 },
    availableSeats: { type: Number, required: true },
    farePerSeat: { type: Number, required: true, min: 0 },
    paymentDetails: { type: String, required: true },
    riders: { type: [PoolPassengerSchema], default: [] },
    status: { type: String, enum: ['active', 'full', 'departed', 'cancelled'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPoolRide>('PoolRide', PoolRideSchema);
