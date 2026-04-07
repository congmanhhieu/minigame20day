import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  active_date: string; // YYYY-MM-DD
  question_text: string;
  options: string[];
  correct_option_id: number | null;
  createdAt: Date;
}

const QuestionSchema: Schema = new Schema({
  active_date: { type: String, required: true },
  question_text: { type: String, required: true },
  options: { type: [String], required: true },
  correct_option_id: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
