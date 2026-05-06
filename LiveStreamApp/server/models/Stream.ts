import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IStream extends Document {
  name?: string;
  url?: string;
  location?: string;
  isLive?: boolean;
  currentPassage?: Types.ObjectId;
  apiVideoLiveStreamId?: string;
  streamKey?: string;
}

const StreamSchema = new Schema<IStream>(
  {
    name: { type: String },
    url: { type: String },
    location: { type: String },
    isLive: { type: Boolean, default: false },
    currentPassage: { type: Schema.Types.ObjectId, ref: 'Passage' },
    apiVideoLiveStreamId: { type: String },
    streamKey: { type: String },
  },
  { timestamps: true }
);

const StreamModel: Model<IStream> = (mongoose.models.Stream as Model<IStream>) || mongoose.model<IStream>('Stream', StreamSchema);

export default StreamModel;
export { StreamModel };
