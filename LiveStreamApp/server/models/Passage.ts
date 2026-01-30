import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const PASSAGE_STATUS = ['SCHEDULED', 'LIVE', 'FINISHED'] as const;
export type PassageStatus = typeof PASSAGE_STATUS[number];

export interface IPassage extends Document {
  group: Types.ObjectId;
  apparatus: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  location?: string;
  score?: number;
  isPublished?: boolean;
  status?: PassageStatus;
  monitors?: string[];
}

const PassageSchema = new Schema<IPassage>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    apparatus: { type: Schema.Types.ObjectId, ref: 'Apparatus', required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    location: { type: String },
    score: { type: Number, min: 0, max: 10 },
    isPublished: { type: Boolean, default: false },
    status: { type: String, enum: [...PASSAGE_STATUS], default: 'SCHEDULED' },
    monitors: { type: [String], default: [] },
  },
  { timestamps: true }
);

const PassageModel: Model<IPassage> = (mongoose.models.Passage as Model<IPassage>) || mongoose.model<IPassage>('Passage', PassageSchema);

export default PassageModel;
export { PassageModel };
