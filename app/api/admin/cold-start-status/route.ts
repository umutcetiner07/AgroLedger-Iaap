import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Tahmini REAL geçiş tarihi hesaplama fonksiyonu
function tahminiRealGecisTarihiHesapla(waterSaving: any): Date | null {
  // Örnek algoritma: createdAt + 90 gün
  if (!waterSaving.createdAt) return null;
  const createdAt = new Date(waterSaving.createdAt);
  const tahminiTarih = new Date(createdAt);
  tahminiTarih.setDate(createdAt.getDate() + 90); // 90 gün ekle
  return tahminiTarih;
}

export async function GET() {
  try {
    // WaterSaving tablosunda baselineType=PROXY olan çiftlikleri çek
    const proxyFarms = await prisma.waterSaving.findMany({
      where: { baselineType: 'PROXY' },
      include: { farm: true },
    });

    // Her çiftlik için tahmini REAL geçiş tarihini hesapla
    const sonuc = proxyFarms.map((ws: any) => ({
      ciftlikId: ws.farmId,
      ciftlikAdi: ws.farm?.name || '',
      tahminiRealGecisTarihi: tahminiRealGecisTarihiHesapla(ws),
    }));

    return NextResponse.json({ ciftlikler: sonuc });
  } catch (error) {
    return NextResponse.json({ hata: 'Bir hata oluştu', detay: error }, { status: 500 });
  }
}
