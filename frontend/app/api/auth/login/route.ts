import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ status: 'error', message: 'Vui lòng nhập email và mật khẩu.' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ status: 'error', message: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' });

    return NextResponse.json({
      status: 'success',
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ status: 'error', message: 'Lỗi máy chủ nội bộ.' }, { status: 500 });
  }
}
