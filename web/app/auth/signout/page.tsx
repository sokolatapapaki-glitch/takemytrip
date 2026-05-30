'use client';

import { signOut } from "next-auth/react";
import { googleButtonClasses } from "../buttonStyles";

export default function SignOutPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Αποσύνδεση
        </h1>

        <p className="text-gray-600 mb-6">
          Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={`${googleButtonClasses} flex-1`}
          >
            Ναι
          </button>

          <button
            onClick={() => window.history.back()}
            className={`${googleButtonClasses} flex-1 bg-gray-200 hover:bg-gray-300`}
            style={{color: 'black'}}
          >
            Ακύρωση
          </button>
        </div>
      </div>
    </div>
  );
}
