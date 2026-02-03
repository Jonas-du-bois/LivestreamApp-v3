import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export const PASSAGE_STATUS = ['SCHEDULED', 'LIVE', 'FINISHED'] as const;
export type PassageStatus = typeof PASSAGE_STATUS[number];

export interface IPassageHistoryEntry {
  year: number;
  score: number;
}

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
  history?: IPassageHistoryEntry[];
  // Tracking pour éviter les notifications en double
  notifiedAt15?: Date;  // Notification 15 min avant
  notifiedAt3?: Date;   // Notification 3 min avant
}

const PassageSchema = new Schema<IPassage>(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    apparatus: { type: Schema.Types.ObjectId, ref: 'Apparatus', required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    location: { type: String },
    score: { type: Number, min: 0, max: 10, default: null },
    isPublished: { type: Boolean, default: false },
    status: { type: String, enum: [...PASSAGE_STATUS], default: 'SCHEDULED' },
    monitors: { type: [String], default: [] },
    history: { 
      type: [{
        year: { type: Number, required: true },
        score: { type: Number, required: true }
      }], 
      default: [] 
    },
    // Tracking pour éviter les notifications en double
    notifiedAt15: { type: Date, default: null },
    notifiedAt3: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for frequent queries
PassageSchema.index({ status: 1, isPublished: 1 });
PassageSchema.index({ apparatus: 1, status: 1, isPublished: 1 });

const PassageModel: Model<IPassage> = (mongoose.models.Passage as Model<IPassage>) || mongoose.model<IPassage>('Passage', PassageSchema);

export default PassageModel;
export { PassageModel };
