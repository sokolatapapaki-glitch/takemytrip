'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // useParams hook for accessing dynamic route params
import { validatePassword } from "@/framework/utils/validatePassword";
import { signIn } from 'next-auth/react';
import { googleButtonClasses } from '../../buttonStyles';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const ResetPassword = () => {
  const { token } = useParams() ?? {};// Access the token directly from the params

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // State variables for showing/hiding passwords
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage('Άκυρο ή ληγμένο token επαναφοράς.');
    }
  }, [token]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες, να περιέχει τουλάχιστον έναν αριθμό και έναν ειδικό χαρακτήρα."
      );
      return;
    } else {
      setError("");
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      });
      setEmailSent(true);

      if (res.ok) {
        setMessage('Ο κωδικός επαναφέρθηκε με επιτυχία. Μπορείτε τώρα να συνδεθείτε.');
        const data = await res.json();
        await signIn("credentials", {
          redirect: true,
          email: data.email,
          password: newPassword,
          callbackUrl: "/",
        });
      } else {
        const data = await res.json();
        setMessage(`Σφάλμα: ${data.message || 'Αποτυχία επαναφοράς κωδικού'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('Παρουσιάστηκε απροσδόκητο σφάλμα.');
    }

    setLoading(false);
  };

  // Show a loading state if the token is not yet available
  if (!token) {
    return <span className="inline-block text-gray-700 w-4 h-4 animate-spin"> <AiOutlineLoading3Quarters size={24} color="currentColor" /></span>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">Επανάληψη Κωδικού</h2>

        {message && (
          <p className="text-center text-green-600 font-medium">{message}</p>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-1">
              Νέος Κωδικός
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="flex-1 px-4 py-2 focus:outline-none"
                placeholder="Νέος Κωδικός"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
              >
                {showNewPassword ? 'Απόκρυψη' : 'Εμφάνιση'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
              Επιβεβαίωση Νέου Κωδικού
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="flex-1 px-4 py-2 focus:outline-none"
                placeholder="Επιβεβαίωση Νέου Κωδικού"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
              >
                {showConfirmPassword ? 'Απόκρυψη' : 'Εμφάνιση'}
              </button>
            </div>
          </div>

          {/* Info message */}
          {!emailSent && !message.includes('Password successfully reset') && (
            <div className="text-sm text-gray-500">
              Αν δεν λάβατε το email επαναφοράς, μπορείτε να πατήσετε ξανά το κουμπί Επαναφορά Κωδικού.
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={googleButtonClasses}
            style={{ width: '100%' }}
          >
            {loading ? 'Γίνεται επαναφορά...' : 'Επαναφορά Κωδικού'}
          </button>

          {/* Error message */}
          {error && <div className="text-red-600 font-medium text-center">{error}</div>}
        </form>
      </div>
    </div>

  );
};

export default ResetPassword;
