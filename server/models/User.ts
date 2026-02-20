import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['user', 'driver'], default: 'user' },
  isDriverMode: { type: Boolean, default: false },
  gender: { type: String },
  emergencyContact: { type: String },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
