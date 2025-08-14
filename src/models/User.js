// models/User.js
import mongoose from 'mongoose';

// Base User Schema with common fields
const baseUserSchema = {
  id: { type: String, required: true, unique: true }, // Clerk user ID - unique will create index
  email: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  userType: { type: String, enum: ['PROVIDER', 'RECIPIENT'], required: true },
  
  // Location
  location: {
    address: String,
    latitude: Number,
    longitude: Number,
  },
  
  // Notification preferences
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    radius: { type: Number, default: 1000 }, // in meters
  },
  
  // Emergency contact
  emergencyContact: {
    name: String,
    phone: String,
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

// Provider Schema
const providerSchema = new mongoose.Schema({
  ...baseUserSchema,
  
  // Provider specific fields
  organizationName: { type: String, required: true },
  licenseNumber: String,
  avgDailyCapacity: Number,
  dietaryInfo: String, // e.g., "Vegetarian, Vegan, Halal"
  
  // Provider stats
  stats: {
    totalFoodListed: { type: Number, default: 0 },
    totalFoodDistributed: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
  },
});

// Recipient Schema  
const recipientSchema = new mongoose.Schema({
  ...baseUserSchema,
  subType: { type: String, enum: ['STUDENT', 'STAFF', 'NGO'], required: true },
  
  // Student/Staff specific fields
  campusId: String,
  department: String,
  yearOfStudy: String,
  hostel: String,
  
  // NGO specific fields
  ngoName: String,
  registrationNumber: String,
  maxPickupCapacity: Number,
  
  // Common recipient fields
  dietaryRestrictions: String, // e.g., "Vegetarian, No dairy"
  
  // Recipient stats
  stats: {
    totalFoodReceived: { type: Number, default: 0 },
    totalPickups: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
  },
});

// Add indexes for performance (remove duplicate id indexes since unique:true already creates them)
providerSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
providerSchema.index({ isActive: 1, isVerified: 1 });

recipientSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
recipientSchema.index({ isActive: 1, subType: 1 });

// Pre-save middleware to update timestamps
providerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

recipientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Export models
export const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);
export const Recipient = mongoose.models.Recipient || mongoose.model('Recipient', recipientSchema);

// Helper function to get the right model based on user type
export function getUserModel(userType) {
  switch (userType) {
    case 'PROVIDER':
      return Provider;
    case 'RECIPIENT':
      return Recipient;
    default:
      throw new Error(`Invalid user type: ${userType}`);
  }
}