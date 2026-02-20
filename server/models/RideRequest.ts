import mongoose, { Document, Schema } from 'mongoose';

export interface IRideRequest extends Document {
  userId: string;
  userName: string;
  from: string;
  to: string; // Destination Metro Station usually
  status: 'pending' | 'accepted' | 'cancelled';
  createdAt: Date;
}

const RideRequestSchema: Schema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IRideRequest>('RideRequest', RideRequestSchema);
