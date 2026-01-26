import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IApparatus extends Document {
  code: string;
  name: string;
  icon?: string;
  isActive: boolean;
}

const ApparatusSchema = new Schema<IApparatus>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ApparatusModel: Model<IApparatus> = (mongoose.models.Apparatus as Model<IApparatus>) || mongoose.model<IApparatus>('Apparatus', ApparatusSchema);

export default ApparatusModel;
export { ApparatusModel };
