"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { googleButtonClasses } from "../buttonStyles";

export default function SignIn() {
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;

    const res = await signIn("credentials", { redirect: false, email, password });

    if (res?.error) {
      console.log("Login failed:", res.error);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Σύνδεση</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="px-3 py-2 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm text-gray-600">Κωδικός</label>
            <input
              type="password"
              id="password"
              name="password"
              className="px-3 py-2 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Κωδικός"
              required
            />
          </div>

          <button type="submit" className={googleButtonClasses}>
            Σύνδεση
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 mt-6">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className={`${googleButtonClasses} w-full`}
          >
            <FcGoogle size={20} />
            Σύνδεση με Google
          </button>

          <Link href="/auth/signup" className="text-gray-600 text-sm flex gap-1 hover:text-gray-800 transition-colors">
            Δεν έχετε λογαριασμό; <span className="text-indigo-500 font-medium">Εγγραφή</span>
          </Link>

          <Link href="/auth/email-reset-input" className="text-gray-600 text-sm hover:text-gray-800 transition-colors">
            Ξεχάσατε τον κωδικό;
          </Link>
        </div>
      </div>
    </div>
  );
}
