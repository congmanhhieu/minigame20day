import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { verifyAdmin } from '@/lib/authGuard';

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const questions = await Question.find().sort({ active_date: -1, _id: -1 });

    const mapped = questions.map(q => ({
      id: q._id.toString(),
      active_date: q.active_date,
      question_text: q.question_text,
      options: q.options,
      correct_option_id: q.correct_option_id
    }));

    return NextResponse.json({ status: 'success', data: mapped });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    await dbConnect();

    const newQ = new Question({
      active_date: body.active_date,
      question_text: body.question_text,
      options: body.options,
      correct_option_id: body.correct_option_id,
    });

    await newQ.save();

    return NextResponse.json({ status: 'success', message: 'Question created', data: { id: newQ._id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Failed to create question' }, { status: 500 });
  }
}
