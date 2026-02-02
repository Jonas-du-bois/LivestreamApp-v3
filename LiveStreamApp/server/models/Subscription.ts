import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  favorites: string[]; // List of Passage IDs
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    favorites: [{ type: String }],
  },
  { timestamps: true }
);

const SubscriptionModel: Model<ISubscription> =
  (mongoose.models.Subscription as Model<ISubscription>) ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default SubscriptionModel;
