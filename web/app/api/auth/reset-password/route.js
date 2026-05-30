import { NextResponse } from 'next/server';
import { prisma } from '@/framework/lib/prisma'; // Adjust based on your database setup
import bcrypt from "bcryptjs";

export const POST = async (req) => {
  try {
    const { token, password } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the reset token exists in the database
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true }, // Include user details
    });

    if (!resetRequest) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
    }
    // Update the user's password in the database (without hashing)
    const user = await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { password: hashedPassword }, // Store plain text password (not recommended in production)
    });

    // Delete the password reset record (optional)
    await prisma.passwordReset.delete({
      where: { id: resetRequest.id },
    });

    return NextResponse.json({ message: 'Password successfully reset.', email: user.email });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while resetting your password.' }, { status: 500 });
  }
};
