import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Answer from '@/models/Answer';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    const pipeline = [
      {
        $group: {
          _id: "$user",
          total_score: { $sum: "$score" }
        }
      },
      { $sort: { total_score: -1 as const } },
      { $limit: 100 }
    ];

    const results = await Answer.aggregate(pipeline);

    // Populate user info
    const populated = await User.populate(results, { path: "_id", select: "name" });

    // Map to old frontend interface
    const formatted = populated.map((r: any) => ({
      user_id: r._id._id,
      name: r._id.name,
      total_score: r.total_score
    }));

    return NextResponse.json({ status: 'success', data: formatted });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
