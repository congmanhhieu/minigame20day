import mongoose, { Schema, Document } from 'mongoose';

export interface IPrize extends Document {
  date: string | null; // YYYY-MM-DD
  name: string;
  description: string;
  prize_type: 'daily' | 'grand';
  createdAt: Date;
}

const PrizeSchema: Schema = new Schema({
  date: { type: String, default: null },
  name: { type: String, required: true },
  description: { type: String, required: true },
  prize_type: { type: String, enum: ['daily', 'grand'], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Prize || mongoose.model<IPrize>('Prize', PrizeSchema);
