/**
 * NextAuth API route handler — next-auth v4 + Next.js 14 App Router.
 * moduleResolution:node ile NextAuth() çağrısı TypeScript tarafından doğru tanınır.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
