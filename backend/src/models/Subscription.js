import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    plan: { type: String, enum: ['free', 'professional'], default: 'free' },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    price: { type: Number, default: 0 },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    razorpaySubscriptionId: { type: String },
  },
  { timestamps: true }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
