import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Answer from '@/models/Answer';
import { verifyUser } from '@/lib/authGuard';

export async function GET() {
  try {
    const user = await verifyUser();
    if (!user) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

    const yest = new Date(Date.now() - 86400000);
    const yesterdayDateStr = yest.toISOString().split('T')[0];

    await dbConnect();

    // 1. Calculate everyone's score for yesterday
    const pipeline = [
      { $match: { date: yesterdayDateStr } },
      {
        $group: {
          _id: "$user",
          daily_score: { $sum: "$score" }
        }
      }
    ];

    const results = await Answer.aggregate(pipeline);

    if (results.length === 0) {
      return NextResponse.json({ status: 'success', data: { correct_count: 0, rank: 0 } });
    }

    // 2. Extract my score
    const myResult = results.find((r: any) => r._id.toString() === user._id.toString());
    const myScore = myResult ? myResult.daily_score : 0;

    if (myScore === 0) {
      return NextResponse.json({ status: 'success', data: { correct_count: 0, rank: 0 } });
    }

    // 3. Finding people with strictly greater score
    const higherCount = results.filter((r: any) => r.daily_score > myScore).length;

    const rank = higherCount + 1;
    const correct_count = myScore; // Matching Golang's quirk where correct_count actually holds the daily_score value

    return NextResponse.json({
      status: 'success',
      data: {
        correct_count,
        rank
      }
    });

  } catch (err) {
    console.error('Summary Yesterday Error:', err);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
