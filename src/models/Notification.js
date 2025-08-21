// models/Notification.js

import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'new-food', 'success', 'expiring-soon', 'reminder', 'expired', 'report', 'connection',
      'new_listing', 'listing_created_confirmation', 'booking_confirmed', 'new_booking',
      'collection_confirmed', 'collection_completed_confirmation', 'general'
    ],
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodListing',
    required: false,
  },
  // Additional metadata fields for different notification types
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodListing',
    required: false,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
  },
  providerId: {
    type: String,
    required: false,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;