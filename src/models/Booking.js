// File: /models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodListing',
    required: [true, 'Listing ID is required']
  },
  providerId: {
    type: String,
    required: [true, 'Provider ID is required']
  },
  providerName: {
    type: String,
    required: [true, 'Provider name is required']
  },
  recipientId: {
    type: String,
    required: [true, 'Recipient ID is required']
  },
  recipientName: {
    type: String,
    required: [true, 'Recipient name is required']
  },
  requestedQuantity: {
    type: Number,
    required: [true, 'Requested quantity is required'],
    min: [1, 'Requested quantity must be at least 1']
  },
  approvedQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Approved quantity cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'collected', 'expired', 'cancelled'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    trim: true,
    maxlength: [300, 'Request message cannot exceed 300 characters']
  },
  qrCode: {
    type: String,
    unique: true,
  },
  qrCodeExpiry: {
    type: Date,
    required: true
  },
  collectionCode: {
    type: String,
    required: true,
    length: 6 // 6-digit verification code as backup
  },
  collectedAt: {
    type: Date,
    default: null
  },
  collectionVerifiedBy: {
    type: String, // Provider's user ID who verified the collection
    default: null
  },
  providerResponse: {
    type: String,
    trim: true,
    maxlength: [300, 'Provider response cannot exceed 300 characters']
  },
  scheduledPickupTime: Date,
  actualPickupTime: Date,
  
  // Timestamps for different status changes
  requestedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  rejectedAt: Date,
  collectedAt: Date,
  cancelledAt: Date,
  
  // Rating and feedback
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  
  // Additional tracking
  pickupLocation: String,
  pickupInstructions: String,
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Notification tracking
  notificationsSent: [{
    type: {
      type: String,
      enum: ['request_created', 'request_approved', 'request_rejected', 'pickup_reminder', 'collection_confirmed']
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
bookingSchema.index({ listingId: 1 });
bookingSchema.index({ providerId: 1, status: 1 });
bookingSchema.index({ recipientId: 1, status: 1 });
bookingSchema.index({ status: 1, scheduledPickupTime: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for time remaining until scheduled pickup
bookingSchema.virtual('timeUntilPickup').get(function() {
  if (!this.scheduledPickupTime) return null;
  return this.scheduledPickupTime.getTime() - Date.now();
});

// Virtual for booking duration
bookingSchema.virtual('bookingDuration').get(function() {
  if (!this.collectedAt) return null;
  return this.collectedAt.getTime() - this.requestedAt.getTime();
});

// Middleware to set timestamp when status changes
bookingSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'approved':
        if (!this.approvedAt) this.approvedAt = now;
        break;
      case 'rejected':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
      case 'collected':
        if (!this.collectedAt) this.collectedAt = now;
        if (!this.actualPickupTime) this.actualPickupTime = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
  next();
});

// Static methods for common queries
bookingSchema.statics.findByProvider = function(providerId, status = null) {
  const query = { providerId };
  if (status) query.status = status;
  return this.find(query).populate('listingId').sort({ createdAt: -1 });
};

bookingSchema.statics.findByRecipient = function(recipientId, status = null) {
  const query = { recipientId };
  if (status) query.status = status;
  return this.find(query).populate('listingId').sort({ createdAt: -1 });
};

bookingSchema.statics.findByListing = function(listingId, status = null) {
  const query = { listingId };
  if (status) query.status = status;
  return this.find(query).sort({ createdAt: -1 });
};

// Method to check if booking can be modified
bookingSchema.methods.canBeModified = function() {
  return ['pending', 'approved'].includes(this.status);
};

// Method to check if booking is expired
bookingSchema.methods.isExpired = function() {
  if (!this.scheduledPickupTime) return false;
  return this.scheduledPickupTime < new Date() && this.status !== 'collected';
};

// Method to add notification record
bookingSchema.methods.addNotification = function(type) {
  this.notificationsSent.push({ type });
  return this.save();
};

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;