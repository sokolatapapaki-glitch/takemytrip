import { prisma } from '@/framework/lib/prisma';
import bcrypt from 'bcryptjs';

const MAIN_EMAIL = "kopotitore@gmail.com";

export async function POST(req) {
  const { email, password, name, address, distanceToDestination } = await req.json();
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return new Response(JSON.stringify({ error: "User already exists" }), {
      status: 400,
    });
  }

  let isAdmin = false;
  if (email === MAIN_EMAIL) {
    isAdmin = true;
  }

  const [user, emailEntry] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isAdmin,
      },
    }),
    prisma.email.create({
      data: {
        email,
      },
    }),
  ]);

  return new Response(
    JSON.stringify({ user, email: emailEntry }),
    { status: 200 }
  );
}