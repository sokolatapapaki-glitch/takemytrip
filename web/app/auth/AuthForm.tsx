import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/authOptions"; 
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div>
        <h1>Καλώς ήρθατε στη Σελίδα Σύνδεσης</h1>
        <p>Πρέπει να συνδεθείτε για να έχετε πρόσβαση στο περιεχόμενο.</p>

        <div>
          {/* Link στη σελίδα σύνδεσης */}
          <Link href="/auth/signin">
            <button>Σύνδεση</button>
          </Link>
        </div>

        <div>
          {/* Link στη σελίδα εγγραφής */}
          <Link href="/auth/signup">
            <button>Εγγραφή</button>
          </Link>
        </div>

        <div>
          {/* Link στη σελίδα σφάλματος */}
          <Link href="/auth/error">
            <button>Σελίδα Σφάλματος</button>
          </Link>
        </div>
      </div>
    );
  }

  // Αν υπάρχει session, εμφανίζεται μήνυμα καλωσορίσματος
  return (
    <div>
      <h1>Καλώς ήρθατε, {session.user?.email}</h1>
      <div>
        <p>Η σύνδεση ολοκληρώθηκε με επιτυχία!</p>
        {/* Link στη σελίδα αποσύνδεσης */}
        <Link href="/api/auth/signout">
          <button>Αποσύνδεση</button>
        </Link>
      </div>
    </div>
  );
}
