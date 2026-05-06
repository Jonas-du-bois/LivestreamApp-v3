import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IStream extends Document {
  name?: string;
  url?: string;
  location?: string;
  isLive?: boolean;
  currentPassage?: Types.ObjectId;
  apiVideoLiveStreamId?: string;
  streamKey?: string;
  liveStartedAt?: Date;
  cameraName?: string;
  record?: boolean;
  timeshift?: boolean;
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
    liveStartedAt: { type: Date },
    cameraName: { type: String },
    record: { type: Boolean, default: true },
    timeshift: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const StreamModel: Model<IStream> = (mongoose.models.Stream as Model<IStream>) || mongoose.model<IStream>('Stream', StreamSchema);

export default StreamModel;
export { StreamModel };
