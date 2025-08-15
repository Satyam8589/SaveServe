// File: /models/FoodListing.js
import mongoose from 'mongoose';

const foodListingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  freshnessStatus: {
    type: String,
    required: [true, 'Freshness status is required'],
    enum: ['Fresh', 'Safe to Eat for 2 hours', 'Safe to Eat for 4 hours', 'Safe to Eat for 6 hours', 'Safe to Eat for 12 hours']
  },
  availabilityWindow: {
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  expiryTime: {
    type: Date,
    required: [true, 'Expiry time is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  providerId: {
    type: String,
    required: [true, 'Provider ID is required']
  },
  providerName: {
    type: String,
    required: [true, 'Provider name is required']
  }
}, {
  timestamps: true
});

// Index for efficient querying
foodListingSchema.index({ expiryTime: 1, isActive: 1 });
foodListingSchema.index({ location: 1 });

// Middleware to automatically deactivate expired listings
foodListingSchema.pre('find', function() {
  this.where({
    isActive: true,
    expiryTime: { $gte: new Date() }
  });
});

foodListingSchema.pre('findOne', function() {
  this.where({
    isActive: true,
    expiryTime: { $gte: new Date() }
  });
});

const FoodListing = mongoose.models.FoodListing || mongoose.model('FoodListing', foodListingSchema);

export default FoodListing;