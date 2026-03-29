import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
      unique: true,
    },
    plan: {
      type: String,
      enum: ['free', 'professional'],
      default: 'free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active',
      required: true,
    },
    price: {
      type: Number,
      default: 0, // Free plan
      required: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      required: function() {
        return this.plan === 'professional';
      },
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    failedPaymentAttempts: {
      type: Number,
      default: 0,
    },
    lastPaymentError: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying (userId has unique: true which creates index automatically)
subscriptionSchema.index({ currentPeriodEnd: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
