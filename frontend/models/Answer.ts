import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  chosen_option_id: number;
  predicted_correct_count: number;
  score: number;
  date: string; // Storing date directly for easier lookup
  createdAt: Date;
}

const AnswerSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  chosen_option_id: { type: Number, required: true },
  predicted_correct_count: { type: Number, required: true },
  score: { type: Number, default: 0 },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index to ensure a user only answers a question once
AnswerSchema.index({ user: 1, question: 1 }, { unique: true });

export default mongoose.models.Answer || mongoose.model<IAnswer>('Answer', AnswerSchema);
