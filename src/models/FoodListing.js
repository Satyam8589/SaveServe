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
  category: {
    type: String,
    enum: ['Cooked Food', 'fruits', 'snacks', 'Raw Ingredients', 'Packaged Food', 'Beverages'],
    required: [true, 'Category is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unit: {
    type: String,
    enum: ['plates', 'servings', 'kg', 'packets', 'pieces', 'liters'],
    required: [true, 'Unit is required']
  },
  freshnessStatus: {
    type: String,
    required: [true, 'Freshness status is required'],
    enum: ['Fresh', 'Safe to Eat for 2 hours', 'Safe to Eat for 4 hours', 'Safe to Eat for 6 hours', 'Safe to Eat for 8 hours', 'Safe to Eat for 12 hours']
  },
  freshnessHours: {
    type: Number,
    default: 24,
    min: [1, 'Freshness hours must be at least 1']
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
  },
  imageUrl: {
    type: String,
    trim: true
  },
  
  // NEW BOOKING FIELDS
  bookings: [{
    recipientId: {
      type: String,
      required: true
    },
    recipientName: {
      type: String,
      required: true
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: [1, 'Requested quantity must be at least 1']
    },
    approvedQuantity: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'collected', 'expired', 'cancelled'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: Date,
    collectedAt: Date,
    requestMessage: {
      type: String,
      maxlength: [200, 'Request message cannot exceed 200 characters']
    },
    providerResponse: {
      type: String,
      maxlength: [200, 'Provider response cannot exceed 200 characters']
    },
    scheduledPickupTime: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      maxlength: [300, 'Feedback cannot exceed 300 characters']
    },
    bookingRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    }
  }],
  
  totalBookedQuantity: {
    type: Number,
    default: 0
  },
  
  listingStatus: {
    type: String,
    enum: ['active', 'partially_booked', 'fully_booked', 'expired', 'completed'],
    default: 'active'
  },
  
  pickupInstructions: {
    type: String,
    maxlength: [300, 'Pickup instructions cannot exceed 300 characters']
  },
  
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  }
}, {
  timestamps: true
});

// Virtual field for available quantity
foodListingSchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.quantity - this.totalBookedQuantity);
});

// Index for efficient querying
foodListingSchema.index({ expiryTime: 1, isActive: 1 });
foodListingSchema.index({ location: 1 });
foodListingSchema.index({ category: 1 });
foodListingSchema.index({ listingStatus: 1 });
foodListingSchema.index({ providerId: 1 });

// Middleware to update listing status based on bookings
foodListingSchema.pre('save', function(next) {
  // Calculate total booked quantity from approved bookings
  this.totalBookedQuantity = this.bookings
    .filter(booking => booking.status === 'approved')
    .reduce((total, booking) => total + booking.approvedQuantity, 0);
  
  // Update listing status
  if (this.expiryTime <= new Date()) {
    this.listingStatus = 'expired';
    this.isActive = false;
  } else if (this.totalBookedQuantity >= this.quantity) {
    this.listingStatus = 'fully_booked';
  } else if (this.totalBookedQuantity > 0) {
    this.listingStatus = 'partially_booked';
  } else {
    this.listingStatus = 'active';
  }
  
  next();
});

// Method to add a booking request
foodListingSchema.methods.addBookingRequest = function(bookingData) {
  this.bookings.push(bookingData);
  return this.save();
};

// Method to update booking status
foodListingSchema.methods.updateBookingStatus = function(bookingId, status, additionalData = {}) {
  const booking = this.bookings.id(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }
  
  booking.status = status;
  Object.assign(booking, additionalData);
  
  if (status === 'approved' && additionalData.approvedQuantity) {
    booking.approvedAt = new Date();
  } else if (status === 'collected') {
    booking.collectedAt = new Date();
  }
  
  return this.save();
};

// Static method to find available listings
foodListingSchema.statics.findAvailable = function(filters = {}) {
  const query = {
    isActive: true,
    expiryTime: { $gte: new Date() },
    listingStatus: { $in: ['active', 'partially_booked'] }
  };
  
  if (filters.location) {
    query.location = { $regex: filters.location, $options: 'i' };
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.providerId) {
    query.providerId = { $ne: filters.providerId }; // Exclude own listings
  }
  
  return this.find(query);
};

const FoodListing = mongoose.models.FoodListing || mongoose.model('FoodListing', foodListingSchema);

export default FoodListing;