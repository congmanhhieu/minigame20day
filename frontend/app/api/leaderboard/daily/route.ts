import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Answer from '@/models/Answer';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');

    if (!date) return NextResponse.json({ status: 'error', message: 'Missing date parameter' }, { status: 400 });

    await dbConnect();

    const pipeline = [
      { $match: { date } },
      {
        $group: {
          _id: "$user",
          daily_score: { $sum: "$score" }
        }
      },
      { $sort: { daily_score: -1 as const } },
      { $limit: 100 }
    ];

    const results = await Answer.aggregate(pipeline);

    // Populate user info
    const populated = await User.populate(results, { path: "_id", select: "name" });

    const formatted = populated.map((r: any) => ({
      user_id: r._id._id, // Just to map to old frontend contract
      name: r._id.name,
      daily_score: r.daily_score
    }));

    return NextResponse.json({ status: 'success', data: formatted });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
