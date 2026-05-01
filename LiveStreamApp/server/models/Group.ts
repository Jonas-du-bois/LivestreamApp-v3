import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  canton?: string;
  category?: string;
  subCategory?: string;
  logo?: string;
  description?: string;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    canton: { type: String, index: true },
    logo: { type: String },
    category: { type: String, index: true },
    subCategory: { type: String, index: true },
  },
  { timestamps: true }
);

const GroupModel: Model<IGroup> = (mongoose.models.Group as Model<IGroup>) || mongoose.model<IGroup>('Group', GroupSchema);

export default GroupModel;
export { GroupModel };
