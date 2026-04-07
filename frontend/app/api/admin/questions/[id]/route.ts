import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Question from '@/models/Question';
import { verifyAdmin } from '@/lib/authGuard';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const resolvedParams = await params;
    const body = await req.json();
    await dbConnect();

    // Fetch current question
    const currentQuestion = await Question.findById(resolvedParams.id);
    if (!currentQuestion) return NextResponse.json({ status: 'error', message: 'Question not found' }, { status: 404 });

    const todayStr = new Date().toISOString().split('T')[0];
    if (currentQuestion.active_date <= todayStr) {
      return NextResponse.json({ status: 'error', message: 'Không thể sửa câu hỏi đã hoặc đang chạy' }, { status: 403 });
    }

    if (body.active_date && body.active_date <= todayStr) {
      return NextResponse.json({ status: 'error', message: 'Ngày mới phải nằm trong tương lai' }, { status: 403 });
    }

    // Check unique
    const existing = await Question.findOne({ active_date: body.active_date });
    if (existing && existing._id.toString() !== resolvedParams.id) {
      return NextResponse.json({ status: 'error', message: 'Date already has a question' }, { status: 400 });
    }

    const q = await Question.findByIdAndUpdate(resolvedParams.id, {
      active_date: body.active_date,
      question_text: body.question_text,
      options: body.options,
      correct_option_id: body.correct_option_id,
    }, { new: true });

    if (!q) return NextResponse.json({ status: 'error', message: 'Question not found' }, { status: 404 });

    return NextResponse.json({ status: 'success', message: 'Question updated' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 403 });

    const resolvedParams = await params;
    await dbConnect();
    const todayStr = new Date().toISOString().split('T')[0];
    const currentQuestion = await Question.findById(resolvedParams.id);

    if (!currentQuestion) return NextResponse.json({ status: 'error', message: 'Question not found' }, { status: 404 });

    if (currentQuestion.active_date <= todayStr) {
      return NextResponse.json({ status: 'error', message: 'Không thể xóa câu hỏi đã hoặc đang chạy' }, { status: 403 });
    }

    await Question.findByIdAndDelete(resolvedParams.id);

    return NextResponse.json({ status: 'success', message: 'Question deleted' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Failed to delete question' }, { status: 500 });
  }
}
