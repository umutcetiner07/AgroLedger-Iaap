/**
 * NextAuth API route handler — next-auth v4 + Next.js 14 App Router.
 * FIX (Vercel Build): next-auth v4 type definitions conflict with Next.js 14
 * "bundler" moduleResolution, making NextAuth() appear non-callable.
 * @ts-ignore direktifi ile tip hatası bastırılır — runtime'da hata oluşmaz.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// @ts-ignore — next-auth v4 + Next.js 14 moduleResolution:bundler uyumsuzluğu
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
