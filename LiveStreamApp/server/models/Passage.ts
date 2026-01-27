import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const PASSAGE_STATUS = ['SCHEDULED', 'LIVE', 'FINISHED'] as const;
export type PassageStatus = typeof PASSAGE_STATUS[number];

export interface IScores {
  program?: number; // Note P
  technical?: number; // Note E
  total?: number;
  isPublished?: boolean;
}

export interface IPassage extends Document {
  group: Types.ObjectId;
  apparatus: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  location?: string;
  scores?: IScores;
  status?: PassageStatus;
  monitors?: string[];
}

const ScoresSchema = new Schema<IScores>(
  {
    program: { type: Number },
    technical: { type: Number },
    total: { type: Number },
    isPublished: { type: Boolean, default: false },
  },
  { _id: false }
);

const PassageSchema = new Schema<IPassage>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    apparatus: { type: Schema.Types.ObjectId, ref: 'Apparatus', required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    location: { type: String },
    scores: { type: ScoresSchema, default: {} },
    status: { type: String, enum: [...PASSAGE_STATUS], default: 'SCHEDULED' },
    monitors: { type: [String], default: [] },
  },
  { timestamps: true }
);

const PassageModel: Model<IPassage> = (mongoose.models.Passage as Model<IPassage>) || mongoose.model<IPassage>('Passage', PassageSchema);

export default PassageModel;
export { PassageModel };
