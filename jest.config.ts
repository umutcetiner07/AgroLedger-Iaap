/**
 * Jest yapılandırması — TypeScript + Node.js ortamı.
 * ts-jest ile TypeScript dosyaları doğrudan test edilir, build adımı gerekmez.
 * Prisma client otomatik mock'lanır — test sırasında DB bağlantısı açılmaz.
 */
import type { Config } from 'jest'

const config: Config = {
  // TypeScript desteği için ts-jest preset'i
  preset: 'ts-jest',

  // Server-side Next.js kodları Node.js ortamında test edilir
  testEnvironment: 'node',

  // Test dosyalarının konumu
  roots: ['<rootDir>/__tests__'],

  // TypeScript path alias'larını Jest'e tanıt (@/ → proje kökü)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Prisma client için otomatik mock
    '^@prisma/client$': '<rootDir>/__mocks__/@prisma/client.ts',
  },

  // Prisma singleton'ını mock'la — gerçek DB bağlantısı açma
  modulePathIgnorePatterns: ['<rootDir>/generated/'],

  // Test kapsamı raporu — hangi dosyalar ölçülsün
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/api/**/*.ts',
    '!lib/prisma.ts',     // Singleton wrapper, test edilmez
    '!**/*.d.ts',
  ],

  // ts-jest konfigürasyonu
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Test için daha gevşek type checking
          strict: false,
          esModuleInterop: true,
        },
      },
    ],
  },

  // Test sonucu biçimi ve izolasyon
  verbose: true,
  clearMocks: true,  // Her test sonrası mock.calls ve mock.instances temizlenir
}

export default config
