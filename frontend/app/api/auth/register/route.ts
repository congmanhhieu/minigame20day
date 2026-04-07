import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ status: 'error', message: 'Vui lòng nhập đủ thông tin.' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ status: 'error', message: 'Email đã được sử dụng.' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password_hash,
      role: 'user',
    });

    await newUser.save();

    return NextResponse.json({ status: 'success', message: 'Đăng ký thành công.' }, { status: 201 });
  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json({ status: 'error', message: 'Lỗi máy chủ nội bộ.' }, { status: 500 });
  }
}
