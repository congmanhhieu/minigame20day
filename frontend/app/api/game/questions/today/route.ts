import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import Answer from '@/models/Answer';
import { verifyUser } from '@/lib/authGuard';

export async function GET(req: Request) {
  try {
    const user = await verifyUser();
    if (!user) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    await dbConnect();

    const answers = await Answer.find({ user: user._id, date });
    const isSubbed = answers.length > 0;

    let previousAnswers: Record<string, number> = {};
    let globalPrediction: number | '' = '';

    if (isSubbed) {
      answers.forEach((ans: any) => {
        previousAnswers[ans.question.toString()] = ans.chosen_option_id;
        globalPrediction = ans.predicted_correct_count;
      });
    }

    // Fetch questions for this date, hide correct_option_id
    const questions = await Question.find({ active_date: date }).select('-correct_option_id').sort({ _id: 1 });

    // Map questions to match frontend expectance
    const mappedQuestions = questions.map(q => ({
      id: q._id.toString(),
      question_text: q.question_text,
      options: q.options
    }));

    return NextResponse.json({
      status: 'success',
      data: {
        questions: mappedQuestions,
        isSubbed,
        previousAnswers,
        globalPrediction
      }
    });

  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
