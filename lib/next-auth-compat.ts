/**
 * next-auth-compat.ts — Type-Safe Next-Auth v4 + Next.js 14 App Router köprüsü.
 *
 * SORUN:
 *   TypeScript `moduleResolution: bundler` (Next.js 14 varsayılanı), next-auth v4'ün
 *   `NextAuth()` callable imzasını package.json `exports` alanından bulamaz.
 *   Bu nedenle `NextAuth(authOptions)` "This expression is not callable" hatası verir.
 *
 * ÇÖZÜM (Type-Safe):
 *   `NextAuthFactory` arayüzünü açıkça tanımlıyoruz. Bu arayüz, next-auth v4'ün gerçek
 *   çalışma zamanı davranışıyla birebir örtüşür (next-auth/index.d.ts'teki imzayı yansıtır).
 *   Sonra `require()` üzerinden CJS export'u bu açıkça-tipleştirilmiş arayüze dönüştürürüz.
 *
 *   Bu yaklaşımın `any` kullanımından farkı:
 *   - `NextAuthFactory` tamamen kısıtlı bir arayüzdür — yanlış parametre geçilemez
 *   - Handler dönüş tipi de açıkça tanımlanmıştır
 *   - `any` yerine `unknown` + structural cast kullanılır (TypeScript best practice)
 */

import type { NextAuthOptions } from 'next-auth'

/**
 * next-auth v4'ün NextAuth() factory fonksiyonunun tip imzası.
 * next-auth/index.d.ts kaynak kodundan türetilmiştir.
 * @see https://github.com/nextauthjs/next-auth/blob/v4/packages/next-auth/src/next/index.ts
 */
export interface NextAuthFactory {
  (options: NextAuthOptions): NextAuthAppRouterHandler
}

/**
 * Next.js 14 App Router'ın GET/POST export'larıyla uyumlu handler tipi.
 * next-auth v4 bu imzayı runtime'da fulfill eder.
 */
export type NextAuthAppRouterHandler = (
  req: Request,
  context?: unknown
) => Response | Promise<Response>

/**
 * Type-safe NextAuth factory — `moduleResolution: bundler` uyumsuzluğunu çözer.
 *
 * `require()` ile CJS export'u alıp `NextAuthFactory` arayüzüne dönüştürürüz.
 * Bu `as unknown as NextAuthFactory` cast'i güvenlidir çünkü:
 *   1. `NextAuthFactory` yapısal olarak next-auth'un gerçek imzasını yansıtır
 *   2. Çalışma zamanında `NextAuth(options)` bu şekilde davranır
 *   3. `any`'nin aksine, yanlış kullanım derleme hatası verir
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawNextAuth = require('next-auth') as { default: unknown }
export const createAuthHandler: NextAuthFactory =
  rawNextAuth.default as unknown as NextAuthFactory
