# AgroLedger-Iaap

## Proje Açıklaması

AgroLedger-Iaap, Kazakistan için geliştirilen akıllı sulama sistemi olan IaaP (Irrigation as a Partner) projesidir. Bu sistem, sulama süreçlerini optimize etmek, su tasarrufunu artırmak ve tarım verimliliğini iyileştirmek amacıyla tasarlanmıştır.

## Özellikler

- **Rol Tabanlı Yetkilendirme**: SUPER_ADMIN, COOP_MANAGER, FARMER ve WATER_COMMITTEE olmak üzere 4 farklı kullanıcı rolü.
- **Sensör Entegrasyonu**: Gerçek zamanlı sensör verileri ve anomali tespiti.
- **Yönetici Paneli**: Sensör yönetimi, gölge mod analitiği ve sistem izleme.
- **Çiftçi Arayüzü**: Kişisel sulama verileri ve raporlar.
- **API Uç Noktaları**: Anomali kontrolü, alan sağlığı, tasarruf hesaplaması ve daha fazlası.
- **Cron İşleri**: Ağ geçidi kalp atışı ve SLA kontrolleri.

## Teknoloji Yığını

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Veritabanı**: PostgreSQL + TimescaleDB
- **Yetkilendirme**: NextAuth.js
- **Stil**: Özel tema (Arka plan: #0a0f14, Yüzey: #111922, Vurgu: #2dd4bf, Yazı Tipi: Manrope)

## Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/umutcetiner07/AgroLedger-Iaap.git
   cd AgroLedger-Iaap
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Prisma şemasını oluşturun:
   ```bash
   npx prisma generate
   ```

4. Veritabanını başlatın (PostgreSQL + TimescaleDB kurulu olmalı):
   ```bash
   npx prisma db push
   ```

5. Çevre değişkenlerini ayarlayın (`.env` dosyası):
   - NEXTAUTH_SECRET
   - DATABASE_URL
   - Diğer gerekli değişkenler

## Kullanım

Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Yapılandırma

- **Tailwind CSS**: `tailwind.config.js` dosyasında tema ayarları.
- **Next.js**: `next.config.js` için yapılandırma.
- **Prisma**: `prisma/schema.prisma` için veritabanı şeması.

## Katkıda Bulunma

1. Bu depoyu forklayın.
2. Yeni bir dal oluşturun (`git checkout -b feature/yeni-ozellik`).
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`).
4. Dalınızı push edin (`git push origin feature/yeni-ozellik`).
5. Bir Pull Request oluşturun.

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

## İletişim

Sorularınız için [umutcetiner07](https://github.com/umutcetiner07) ile iletişime geçin.