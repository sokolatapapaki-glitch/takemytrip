'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

export default function ErrorPage() {
  const router = useRouter();
  const { error } = useParams() ?? {};

  let message = "Υπήρξε πρόβλημα με την αυθεντικοποίηση. Παρακαλώ δοκιμάστε ξανά.";

  if (error === "ExistingUser") {
    message = "Υπάρχει ήδη λογαριασμός με αυτό το email. Παρακαλώ χρησιμοποιήστε τη μέθοδο σύνδεσης που χρησιμοποιήσατε αρχικά.";
  } else if (error === "OAuthCreateAccount") {
    message = "Δεν μπορέσαμε να δημιουργήσουμε λογαριασμό για εσάς. Παρακαλώ δοκιμάστε ξανά.";
  } else if (error === "OAuthCallback") {
    message = "Η αυθεντικοποίηση απέτυχε κατά τη διαδικασία OAuth. Παρακαλώ δοκιμάστε ξανά.";
  }

  const [hover, setHover] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-5 text-center">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">
          Κάτι πήγε στραβά!
        </h1>

        <p className="text-gray-600 text-base mb-8 leading-relaxed">
          {message}
        </p>

        <button
          onClick={() => router.replace('/auth/signin')}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`
            w-full max-w-xs mx-auto block
            py-3 px-6
            rounded-lg
            text-white
            font-medium
            transition-all duration-200 ease-in-out
            ${hover ? 'bg-red-700' : 'bg-red-600'}
          `}
        >
          Μετάβαση στη Σύνδεση
        </button>
      </div>
    </div>
  );
}
