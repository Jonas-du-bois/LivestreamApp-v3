import mongoose, { Document, Model, Schema } from 'mongoose';

export interface HistoryEntry {
  year: number;
  competition: string;
  apparatusCode: string;
  score: number;
}

export interface IGroup extends Document {
  name: string;
  canton?: string;
  category?: 'ACTIVE' | 'MIXTE';
  logo?: string;
  description?: string;
  gymnastsCount?: number;
  monitors?: string[];
  history?: HistoryEntry[];
}

const HistorySchema = new Schema<HistoryEntry>(
  {
    year: { type: Number, required: true },
    competition: { type: String, required: true },
    apparatusCode: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    description: { type: String },
    canton: { type: String },
    logo: { type: String },
    gymnastsCount: { type: Number },
    monitors: { type: [String], default: [] },
    history: { type: [HistorySchema], default: [] },
    category: { type: String, enum: ['ACTIVE', 'MIXTE'] },
  },
  { timestamps: true }
);

const GroupModel: Model<IGroup> = (mongoose.models.Group as Model<IGroup>) || mongoose.model<IGroup>('Group', GroupSchema);

export default GroupModel;
export { GroupModel };
