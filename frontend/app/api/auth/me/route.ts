import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Answer from '@/models/Answer';
import Question from '@/models/Question';
import { headers } from 'next/headers';

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';

    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (e) {
      return NextResponse.json({ status: 'error', message: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).select('-password_hash');

    if (!user) {
      return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
    }

    // Fetch history
    const answers = await Answer.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('question', 'question_text');

    const history = answers.map((ans: any) => ({
      answer_id: ans._id,
      question: ans.question?.question_text || 'Unknown Question',
      prediction: ans.predicted_correct_count,
      score: ans.score,
      date: ans.date,
    }));

    // Calculate total score from all time
    const allAnswers = await Answer.find({ user: user._id });
    const total_score = allAnswers.reduce((acc, curr) => acc + (curr.score || 0), 0);

    return NextResponse.json({
      status: 'success',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        total_score,
        history
      }
    });

  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
