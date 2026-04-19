/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOT: typescript.ignoreBuildErrors kaldırıldı.
  // next-auth v4 tip uyumsuzluğu artık lib/next-auth-compat.ts wrapper'ı ile
  // type-safe olarak çözüldü — ignoreBuildErrors artık gerekli değil.
}

module.exports = nextConfig