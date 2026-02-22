import mongoose, { Document, Schema } from 'mongoose';

export interface IJourneyFeedback extends Document {
  userId: string;
  journeyId: string;          // route identifier or booking reference
  journeyType: 'bus' | 'metro' | 'auto' | 'pool' | 'walk';
  origin: string;
  destination: string;

  // Journey accuracy metrics
  routeAccuracy: number;       // 1-5: how accurate was the suggested route?
  comfortRating: number;       // 1-5: overall comfort
  waitTimeRating: number;      // 1-5: was wait time as predicted?
  journeyTimeMatch: boolean;   // did actual journey time match estimate?
  actualJourneyMinutes?: number;
  estimatedJourneyMinutes?: number;
  fareMatch: boolean;          // did fare match?
  actualFare?: number;
  estimatedFare?: number;
  overallRating: number;       // 1-5: overall journey rating

  // Driver feedback (only for auto/pool)
  hasDriverFeedback: boolean;
  driverId?: string;
  driverName?: string;
  driverPunctuality?: number;   // 1-5
  driverBehavior?: number;      // 1-5
  vehicleCondition?: number;    // 1-5
  driverOverallRating?: number; // 1-5

  comment?: string;
  createdAt: Date;
}

const JourneyFeedbackSchema: Schema = new Schema({
  userId:              { type: String, required: true, index: true },
  journeyId:           { type: String, required: true },
  journeyType:         { type: String, enum: ['bus', 'metro', 'auto', 'pool', 'walk'], required: true },
  origin:              { type: String, required: true },
  destination:         { type: String, required: true },

  routeAccuracy:       { type: Number, min: 1, max: 5, required: true },
  comfortRating:       { type: Number, min: 1, max: 5, required: true },
  waitTimeRating:      { type: Number, min: 1, max: 5, required: true },
  journeyTimeMatch:    { type: Boolean, required: true },
  actualJourneyMinutes:    { type: Number },
  estimatedJourneyMinutes: { type: Number },
  fareMatch:           { type: Boolean, required: true },
  actualFare:          { type: Number },
  estimatedFare:       { type: Number },
  overallRating:       { type: Number, min: 1, max: 5, required: true },

  hasDriverFeedback:   { type: Boolean, default: false },
  driverId:            { type: String },
  driverName:          { type: String },
  driverPunctuality:   { type: Number, min: 1, max: 5 },
  driverBehavior:      { type: Number, min: 1, max: 5 },
  vehicleCondition:    { type: Number, min: 1, max: 5 },
  driverOverallRating: { type: Number, min: 1, max: 5 },

  comment:             { type: String, maxlength: 500 },
  createdAt:           { type: Date, default: Date.now }
});

export default mongoose.model<IJourneyFeedback>('JourneyFeedback', JourneyFeedbackSchema);
