import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Answer from '@/models/Answer';
import Question from '@/models/Question';
import { verifyUser } from '@/lib/authGuard';

export async function POST(req: Request) {
  try {
    const user = await verifyUser();
    if (!user) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const date = body.date || new Date().toISOString().split('T')[0];
    const { answers, predicted_correct_count } = body;

    // Payload answers should be array of: { question_id, chosen_option_id }

    if (!answers || predicted_correct_count === undefined) {
      return NextResponse.json({ status: 'error', message: 'Thiếu dữ liệu' }, { status: 400 });
    }

    await dbConnect();

    // Check conflict
    const existing = await Answer.findOne({ user: user._id, date });
    if (existing) {
      return NextResponse.json({ status: 'error', message: 'You have already submitted an answer for one or more questions.' }, { status: 409 });
    }

    const newAnswers = answers.map((ans: any) => ({
      user: user._id,
      question: ans.question_id,
      chosen_option_id: ans.chosen_option_id,
      predicted_correct_count: predicted_correct_count,
      score: 0,
      date: date
    }));

    await Answer.insertMany(newAnswers);

    return NextResponse.json({ status: 'success', message: 'Submission successful' });

  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ status: 'error', message: 'You have already submitted an answer for one or more questions.' }, { status: 409 });
    }
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
