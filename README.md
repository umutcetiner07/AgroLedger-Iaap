# BerekeAI — AgroLedger Modülü 🚀
### Irrigation as a Service (IaaS) | Powered by BerekeAI

---

## 📋 Proje Özeti

**BerekeAI**, Orta Asya tarım ekosistemini dönüştüren bir AgriFinTech platformudur. 
**AgroLedger Modülü**, BerekeAI'nin tarım ve sulama yönetimi için geliştirilmiş çekirdek altyapısıdır.

Su tasarrufunu ölçülebilir bir varlığa dönüştürerek, çiftçilerin kaynaklarını optimize etmesini 
ve finansal geleceklerini güvence altına almasını sağlıyoruz.

---

## ✨ Temel Özellikler

### Water Needs Baseline (WNB)
Gerçek zamanlı toprak verisi ile tarihsel iklim modellerini birleştiren hibrit motor. 
Çiftçiye kesin sulama zamanlaması önerisi sunar.

### Field Health Score (FHS)
NDVI (Normalized Difference Vegetation Index) ve Radar verisi ile ürün sağlığını izler. 
Bankalar için teminat değeri oluşturur.

### Shadow Mode AI
Otonom kararlar almadan önce %75 doğruluk barajını geçen güvenli AI yapısı. 
Risk minimize edilir, güven maksimize edilir.

### AgroLedger Finansal Defter
Su tasarrufunu doğrulanmış finansal veriye çevirir. 
Bankalar için kredi skorlama girdisi oluşturur.

---

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Dil** | TypeScript |
| **Veritabanı** | PostgreSQL (Neon → Production'da MCS Cloud) |
| **ORM** | Prisma |
| **Auth** | NextAuth v4 + JWT + Session Guard |
| **Test** | Jest (36+ Unit Test) |
| **Deployment** | Vercel (Geliştirme) → MCS Cloud (Production) |
| **Harita** | Leaflet + React-Leaflet |
| **Grafik** | Recharts |

---

## ⚙️ Kurulum

```bash
git clone https://github.com/umutcetiner07/AgroLedger-Iaap.git
cd AgroLedger-Iaap
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
