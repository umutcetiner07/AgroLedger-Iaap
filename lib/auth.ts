/**
 * NextAuth yapılandırması — kimlik doğrulama ve yetkilendirme.
 * FIX (P0): Çözülmemiş Git merge conflict marker'ları kaldırıldı (<<<<<<< HEAD bloğu).
 * FIX (P0): `PrismaAdapter(prisma) as any` cast'i kaldırıldı; doğrudan Adapter tipi kullanıldı.
 * FIX: Role tipi artık Prisma schema enum'u ile hizalı string literal union olarak tanımlandı.
 */
import { type NextAuthOptions } from 'next-auth'
import { type Adapter } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Prisma schema'daki Role enum ile birebir eşleşen tip
type Role = 'SUPER_ADMIN' | 'COOP_MANAGER' | 'FARMER' | 'WATER_COMMITTEE'

export const authOptions: NextAuthOptions = {
  // Adapter tip dönüşümü: @auth/prisma-adapter v2, NextAuth v4 Adapter arayüzünü sağlar
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Eksik kimlik bilgisi kontrolü
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, email: true, name: true, password: true, role: true },
        })

        if (!user?.password) return null

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },

  callbacks: {
    async jwt({ token, user }) {
      // İlk oturum açmada kullanıcı rolleri token'a eklenir
      if (user) {
        token.id = user.id
        token.role = user.role as Role
      }
      return token
    },

    async session({ session, token }) {
      // Token verilerini oturum nesnesine aktar — her request'te kullanılabilir
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as Role
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
  },
}
