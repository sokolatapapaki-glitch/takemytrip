import NextAuth from "next-auth";
import { authOptions } from "../authOptions"; // Εισαγωγή από το νέο αρχείο

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };