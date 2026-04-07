import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Prize from '@/models/Prize';

export async function GET() {
  try {
    await dbConnect();
    const prizes = await Prize.find().sort({ _id: -1 });

    const mapped = prizes.map(p => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      date: p.date,
      prize_type: p.prize_type
    }));

    return NextResponse.json({ status: 'success', data: mapped });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
