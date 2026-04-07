import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
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

    return NextResponse.json({
      status: 'success',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });

  } catch (error) {
    console.error('Me API Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
