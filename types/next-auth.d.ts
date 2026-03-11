/**
 * next-auth.d.ts — NextAuth v4 modül genişletmeleri.
 *
 * Bu dosya üç amaca hizmet eder:
 *  1. Session.user'a `id` ve `role` alanları eklenir (next-auth'un DefaultSession'ı eksiktir)
 *  2. User arayüzüne `role` alanı eklenir (CredentialsProvider geri dönüş tipini karşılar)
 *  3. JWT token'a `id` ve `role` alanları eklenir (callback tiplemesi için)
 *
 * BU DOSYA OLMADAN next-auth tip sistemi `session.user.role` ve `token.role`'ü tanımaz.
 */

import type { DefaultSession } from 'next-auth'

/** Prisma schema'daki Role enum ile birebir örtüşen string literal union tipi. */
type Role = 'SUPER_ADMIN' | 'COOP_MANAGER' | 'FARMER' | 'WATER_COMMITTEE'

declare module 'next-auth' {
  /**
   * Session.user genişletmesi: id ve role alanları eklendi.
   * DefaultSession['user'] bileşiminde email, name, image korunur.
   */
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession['user']
  }

  /**
   * User arayüzü genişletmesi: CredentialsProvider.authorize() dönüş tipini karşılar.
   * `role?` opsiyoneldir çünkü OAuthProvider kullanan kullanıcılarda olmayabilir.
   */
  interface User {
    id: string
    email: string
    name?: string | null
    role?: Role
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT token genişletmesi: jwt() callback'inde set edilen alanlara tip güvencesi sağlar.
   */
  interface JWT {
    id?: string
    role?: Role
  }
}