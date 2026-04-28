'use client';
import React from 'react';

export default function Dashboard() {
  const stats = [
    { label: "Toplam Tasarruf", value: "300 m³", color: "text-emerald-500", icon: "💧" },
    { label: "Aktif Çiftlik", value: "1", color: "text-blue-500", icon: "🚜" },
    { label: "Toplam Ödeme", value: "₺45", color: "text-amber-500", icon: "💰" },
    { label: "Verimlilik", value: "94.2%", color: "text-purple-500", icon: "📈" }
  ];

  return (
    <div className="min-h-screen bg-[#0b1120] p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AgrOracle Analytics</h1>
            <p className="text-slate-400 mt-1">Kazakistan Akıllı Sulama Sistemleri Veri Paneli</p>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-emerald-400 text-sm font-mono">● Live Data</span>
          </div>
        </div>

        {/* 4'lü Grid Kartlar */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="bg-[#111c44] border border-slate-800 p-6 rounded-2xl shadow-2xl hover:border-slate-600 transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-bold">MONTHLY</span>
              </div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
              <h2 className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Alt Bölüm: Grafik ve Detay */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#111c44] border border-slate-800 p-8 rounded-2xl min-h-[400px]">
            <h3 className="text-xl font-bold mb-6">Su Tasarruf Trendi</h3>
            <div className="h-64 w-full flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-500 italic text-center px-10">
                Grafik Kütüphanesi Yükleniyor... <br/>
                <span className="text-xs text-slate-600">(Burada Tremor/Recharts AreaChart görüntülenecek)</span>
              </p>
            </div>
          </div>
          
          <div className="bg-[#111c44] border border-slate-800 p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-6">Operasyon Özeti</h3>
            <ul className="space-y-6">
              <li className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <p className="text-sm text-slate-300">Sulama Planı Optimize Edildi</p>
              </li>
              <li className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-slate-300">Almaty Farm Bağlantısı Sağlıklı</p>
              </li>
              <li className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm text-slate-300">Yeni Anomali Tespit Edilmedi</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
