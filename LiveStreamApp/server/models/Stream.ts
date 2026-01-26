import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IStream extends Document {
  name?: string;
  url?: string;
  location?: string;
  isLive?: boolean;
  currentPassage?: Types.ObjectId;
}

const StreamSchema = new Schema<IStream>(
  {
    name: { type: String },
    url: { type: String },
    location: { type: String },
    isLive: { type: Boolean, default: false },
    currentPassage: { type: Schema.Types.ObjectId, ref: 'Passage' },
  },
  { timestamps: true }
);

const StreamModel: Model<IStream> = (mongoose.models.Stream as Model<IStream>) || mongoose.model<IStream>('Stream', StreamSchema);

export default StreamModel;
export { StreamModel };
