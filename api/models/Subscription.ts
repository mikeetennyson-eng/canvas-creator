import mongoose, { Schema, Document } from 'mongoose';

export type PlanType = 'free' | 'professional';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired';

export interface ISubscription extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  plan: PlanType;
  status: SubscriptionStatus;
  price: number; // in paise (400 Rs = 40000 paise for professional)
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  autoRenewal: boolean;
  paymentMethod?: string;
  transactionId?: string;
  notificationSent?: boolean; // Track if renewal reminder sent
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
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
    autoRenewal: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
