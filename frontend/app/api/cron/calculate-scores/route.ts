import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import Answer from '@/models/Answer';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    // Use ICT (GMT+7) for date calculation
    const nowICT = new Date(Date.now() + 7 * 3600000);
    const date = url.searchParams.get('date') || nowICT.toISOString().split('T')[0];

    // In production, add a secret cron key to prevent public execution
    // e.g. if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

    await dbConnect();

    // 1. Fetch today's questions
    const questions = await Question.find({ active_date: date, correct_option_id: { $ne: null } });
    if (questions.length === 0) {
      return NextResponse.json({ status: 'error', message: 'No calculatable questions for this date' }, { status: 400 });
    }

    const qMap = new Map();
    questions.forEach(q => qMap.set(q._id.toString(), q.correct_option_id));
    const numQuestions = questions.length;

    // 2. Count ACTUAL people who answered ALL questions correctly
    // First group answers by user to see who got 100% correct
    const allAnswers = await Answer.find({ date });

    const userAnsMap = new Map();
    for (const ans of allAnswers) {
      const uStr = ans.user.toString();
      if (!userAnsMap.has(uStr)) userAnsMap.set(uStr, { correct: 0, answers: [] });

      const qStr = ans.question.toString();
      if (qMap.has(qStr) && qMap.get(qStr) === ans.chosen_option_id) {
        userAnsMap.get(uStr).correct += 1;
      }
      userAnsMap.get(uStr).answers.push(ans);
    }

    let actualCorrectCount = 0;
    for (const [_, data] of userAnsMap.entries()) {
      if (data.correct === numQuestions) {
        actualCorrectCount++;
      }
    }
    const totalParticipants = userAnsMap.size;

    // 3. Process each answer
    const bulkOps = [];
    for (const ans of allAnswers) {
      let score = 0;
      const qStr = ans.question.toString();

      if (qMap.has(qStr) && qMap.get(qStr) === ans.chosen_option_id) {
        const diff = Math.abs(ans.predicted_correct_count - actualCorrectCount);
        // Accuracy factor capped at 0 to avoid negative scores
        const accuracy = Math.max(0, 1 - (diff / totalParticipants));
        const multiplier = 1 + accuracy;
        const baseScore = 100;
        score = Math.round(baseScore * multiplier);
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: ans._id },
          update: { $set: { score } }
        }
      });
    }

    // Upsert database answers
    if (bulkOps.length > 0) {
      await Answer.bulkWrite(bulkOps);
    }

    return NextResponse.json({ status: 'success', message: 'Daily scores calculated successfully', calculatedAnswers: bulkOps.length });

  } catch (err) {
    console.error('Calculate scores error:', err);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
