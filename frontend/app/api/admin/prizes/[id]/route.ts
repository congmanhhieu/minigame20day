import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Prize from '@/models/Prize';
import { verifyAdmin } from '@/lib/authGuard';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const resolvedParams = await params;
    const body = await req.json();
    await dbConnect();

    if (body.prize_type === 'daily' && body.date) {
      const existing = await Prize.findOne({ date: body.date, prize_type: 'daily' });
      if (existing && existing._id.toString() !== resolvedParams.id) {
        return NextResponse.json({ status: 'error', message: 'Đã có giải thưởng ngày cho ngày này. Mỗi ngày chỉ được một giải.' }, { status: 409 });
      }
    } else if (body.prize_type === 'grand') {
      const existing = await Prize.findOne({ prize_type: 'grand' });
      if (existing && existing._id.toString() !== resolvedParams.id) {
        return NextResponse.json({ status: 'error', message: 'Đã có giải thưởng chung cuộc. Chỉ được một giải chung cuộc duy nhất.' }, { status: 409 });
      }
    }

    const p = await Prize.findByIdAndUpdate(resolvedParams.id, {
      date: body.date || null,
      name: body.name,
      description: body.description,
      prize_type: body.prize_type,
    }, { new: true });

    if (!p) return NextResponse.json({ status: 'error', message: 'Prize not found' }, { status: 404 });

    return NextResponse.json({ status: 'success', message: 'Prize updated' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Failed to update prize' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const resolvedParams = await params;
    await dbConnect();
    const p = await Prize.findByIdAndDelete(resolvedParams.id);

    if (!p) return NextResponse.json({ status: 'error', message: 'Prize not found' }, { status: 404 });

    return NextResponse.json({ status: 'success', message: 'Prize deleted' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Failed to delete prize' }, { status: 500 });
  }
}
