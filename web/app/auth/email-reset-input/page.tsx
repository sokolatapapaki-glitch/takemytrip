"use client";

import { useState } from "react";
import { googleButtonClasses } from "../buttonStyles";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/send-reset-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Το email επαναφοράς κωδικού στάλθηκε. Ελέγξτε τα εισερχόμενά σας.");
      } else {
        const data = await res.json();
        setMessage(`Σφάλμα: ${data.message || "Αποτυχία αποστολής email επαναφοράς"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("Παρουσιάστηκε απροσδόκητο σφάλμα.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-5">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Επαναφορά Κωδικού</h1>

        {message && (
          <div className="p-3 rounded-lg mb-5 text-center text-sm bg-green-50 text-green-700 border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-xl text-gray-600">Διεύθυνση Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-base w-full focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Εισάγετε το email σας"
              required
            />
          </div>

          <button type="submit" className={googleButtonClasses}>
            Αποστολή Συνδέσμου Επαναφοράς
          </button>
        </form>
      </div>
    </div>
  );
}
