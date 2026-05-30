"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { validatePassword } from "@/framework/utils/validatePassword";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { googleButtonClasses } from "../buttonStyles";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long, contain at least one number and one special character.");
      return;
    } else {
      setError("");
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      const signInResponse = await signIn("credentials", { redirect: false, email, password });
      if (signInResponse?.error) {
        setError("Failed to sign in. Please try signing in manually.");
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Εγγραφή</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm text-gray-600">Κωδικός</label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Εισάγετε τον κωδικό σας"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-indigo-500 cursor-pointer"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-sm text-gray-600">Επιβεβαίωση Κωδικού</label>
            <div className="relative w-full">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Επιβεβαίωση Κωδικού"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-indigo-500 cursor-pointer"
              >
                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm text-gray-600">Όνομα</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Όνομα"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className={googleButtonClasses}>
            Εγγραφή
          </button>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className={googleButtonClasses}
          >
            <FcGoogle size={20} />
            Σύνδεση με Google
          </button>
        </form>

        <div className="flex flex-col items-center mt-6">
          <p className="text-sm text-gray-600 mt-4">
            Έχετε ήδη λογαριασμό?{" "}
            <Link href="/auth/signin" className="text-indigo-500 font-medium no-underline">
              Συνδεθείτε
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
