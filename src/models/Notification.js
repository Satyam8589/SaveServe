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
    enum: ['new-food','success', 'expiring-soon', 'reminder', 'expired', 'report','connection'],
    required: true,
  },
  data: {
    type: Object,
    default: {},
    required: false,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;