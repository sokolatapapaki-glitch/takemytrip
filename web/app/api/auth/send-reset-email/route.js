// src/app/api/auth/reset-password/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/framework/lib/prisma'; 
import { sendPasswordResetEmail } from '@/framework/lib/sendResetEmail';

// Handle POST requests (for sending reset email)
export async function POST(req) {
  const { email } = await req.json(); 

  if (!email) {
    return new Response(
      JSON.stringify({ message: 'Email is required' }),
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const resetToken = Math.random().toString(36).substring(2); 

    await prisma.passwordReset.create({
      data: { userId: user.id, token: resetToken },
    });

    await sendPasswordResetEmail({
      email,
      name: user.name, // or undefined if you don't have it
      resetToken,
    });

    return new Response(
      JSON.stringify({ message: 'Password reset email sent' }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }
}
