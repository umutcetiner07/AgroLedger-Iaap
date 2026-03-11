/**
 * NextAuth API route handler — Next.js 14 App Router + next-auth v4.
 *
 * ÇÖZÜM (Type-Safe, ignoreBuildErrors olmadan):
 *   Doğrudan `import NextAuth from "next-auth"` kullanmak yerine `createAuthHandler`
 *   wrapper'ı kullanıyoruz. Bu wrapper, `NextAuthFactory` arayüzüyle açıkça tiplenmiştir.
 *   `any` kullanımı yoktur; yanlış parametre geçilirse TypeScript derleme hatası verir.
 *
 * @see lib/next-auth-compat.ts — tip güvenli köprü implementasyonu
 */
import { createAuthHandler } from '@/lib/next-auth-compat'
import { authOptions } from '@/lib/auth'

/**
 * Type-safe NextAuth handler — authOptions tam olarak `NextAuthOptions` arayüzüyle doğrulanır.
 * Handler, Next.js 14 App Router'ın beklediği `(req: Request) => Response` imzasını karşılar.
 */
const handler = createAuthHandler(authOptions)

export { handler as GET, handler as POST }
