import mongoose, { Document, Schema } from 'mongoose';

export interface IRide extends Document {
  driverId: string;
  driverName: string;
  vehicleType: 'car' | 'bike' | 'scooter';
  from: string;
  to: string; // Destination Metro Station usually
  departureTime: Date;
  availableSeats: number;
  costPerSeat: number;
  womenOnly: boolean;
  status: 'active' | 'full' | 'completed' | 'cancelled';
  riders: string[]; // Array of User IDs
  createdAt: Date;
}

const RideSchema: Schema = new Schema({
  driverId: { type: String, required: true },
  driverName: { type: String, required: true },
  vehicleType: { type: String, enum: ['car', 'bike', 'scooter'], required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departureTime: { type: Date, required: true },
  availableSeats: { type: Number, required: true, min: 1, max: 6 },
  costPerSeat: { type: Number, default: 0 },
  womenOnly: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'full', 'completed', 'cancelled'], default: 'active' },
  riders: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRide>('Ride', RideSchema);
