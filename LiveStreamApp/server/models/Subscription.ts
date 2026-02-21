import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubscription extends Document {
  /** Unique identifier: Web Push URL pour 'web', FCM registration token pour 'fcm' */
  endpoint: string;
  /** Type de canal de notification */
  type: 'web' | 'fcm';
  /** Présent uniquement pour les subscriptions Web Push */
  keys?: {
    p256dh: string;
    auth: string;
  };
  favorites: string[]; // List of Passage IDs
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    endpoint: { type: String, required: true, unique: true },
    type: { type: String, enum: ['web', 'fcm'], required: true, default: 'web' },
    keys: {
      p256dh: { type: String },
      auth: { type: String },
    },
    favorites: [{ type: String }],
  },
  { timestamps: true }
);

// Optimize notification lookups (finding subscribers for a passage)
SubscriptionSchema.index({ favorites: 1 });
// Index for dispatching per channel
SubscriptionSchema.index({ type: 1 });

const SubscriptionModel: Model<ISubscription> =
  (mongoose.models.Subscription as Model<ISubscription>) ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default SubscriptionModel;
