import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Prize from '@/models/Prize';
import { verifyAdmin } from '@/lib/authGuard';

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const prizes = await Prize.find().sort({ date: -1, _id: -1 });

    // Map _id to id for frontend
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

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    await dbConnect();

    // Validations (max 1 daily per day, max 1 grand overall)
    if (body.prize_type === 'daily' && body.date) {
      const count = await Prize.countDocuments({ date: body.date, prize_type: 'daily' });
      if (count > 0) {
        return NextResponse.json({ status: 'error', message: 'Đã có giải thưởng ngày cho ngày này. Mỗi ngày chỉ được một giải.' }, { status: 409 });
      }
    } else if (body.prize_type === 'grand') {
      const count = await Prize.countDocuments({ prize_type: 'grand' });
      if (count > 0) {
        return NextResponse.json({ status: 'error', message: 'Đã có giải thưởng chung cuộc. Chỉ được một giải chung cuộc duy nhất.' }, { status: 409 });
      }
    }

    const newPrize = new Prize({
      date: body.date || null,
      name: body.name,
      description: body.description,
      prize_type: body.prize_type,
    });

    await newPrize.save();

    return NextResponse.json({ status: 'success', message: 'Prize created', data: { id: newPrize._id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Failed to create prize' }, { status: 500 });
  }
}
