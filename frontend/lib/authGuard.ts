import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function verifyAdmin() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'secret';

  try {
    const decoded: any = jwt.verify(token, secret);
    await dbConnect();
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
}

export async function verifyUser() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'secret';

  try {
    const decoded: any = jwt.verify(token, secret);
    await dbConnect();
    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) return null;
    return user;
  } catch (e) {
    return null;
  }
}
