'use client';
import React, { useState, useEffect } from 'react';
import { ComposedChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ water: 300.5, efficiency: 94.2 });
  const [isInvestorMode, setIsInvestorMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        water: prev.water + (Math.random() > 0.5 ? 0.1 : -0.1),
        efficiency: Math.min(100, prev.efficiency + (Math.random() > 0.5 ? 0.05 : -0.05))
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#0b1437', minHeight: '100vh', color: 'white', padding: isInvestorMode ? '0' : '20px', fontFamily: 'Georgia, serif' }}>
      {!isInvestorMode && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <h2 style={{ color: '#10b981', margin: 0 }}>AGROLEDGER | Kazakhstan Smart Farming Network</h2>
          <button 
            onClick={() => setIsInvestorMode(!isInvestorMode)}
            style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isInvestorMode ? 'Normal Mod' : 'Yatırımcı Modu'}
          </button>
        </div>
      )}

      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#111c44', padding: '20px', borderRadius: '15px' }}>
            <p style={{ color: '#9ca3af', fontSize: '10px', margin: 0 }}>SU TASARRUFU</p>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>{stats.water.toFixed(1)} m³</h3>
          </div>
          <div style={{ backgroundColor: '#111c44', padding: '20px', borderRadius: '15px' }}>
            <p style={{ color: '#9ca3af', fontSize: '10px', margin: 0 }}>VERİMLİLİK</p>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>{stats.efficiency.toFixed(1)}%</h3>
          </div>
          <div style={{ backgroundColor: '#111c44', padding: '20px', borderRadius: '15px', border: '1px solid #10b981' }}>
            <p style={{ color: '#9ca3af', fontSize: '10px', margin: 0 }}>AKTİF ÇİFTLİK</p>
            <h3 style={{ fontSize: '24px', margin: '10px 0' }}>1/3</h3>
          </div>
          <div style={{ backgroundColor: '#111c44', padding: '20px', borderRadius: '15px' }}>
            <p style={{ color: '#9ca3af', fontSize: '10px', margin: 0 }}>FİNANSAL TASARRUF</p>
            <h3 style={{ fontSize: '24px', margin: '10px 0', color: '#f59e0b' }}>{(stats.water * 50).toLocaleString()} ₸</h3>
          </div>
        </div>

        <div style={{ backgroundColor: '#111c44', padding: '25px', borderRadius: '20px', height: '400px', marginBottom: '30px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[{d:'01.03',s:40},{d:'03.03',s:30},{d:'05.03',s:65},{d:'07.03',s:45},{d:'09.03',s:90},{d:'12.03',s:85}]}>
              <XAxis dataKey="d" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip contentStyle={{backgroundColor: '#111c44', border: 'none'}} />
              <Area type="monotone" dataKey="s" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!isInvestorMode && (
        <footer style={{ textAlign: 'center', color: '#4b5563', fontSize: '12px', marginTop: '20px' }}>
          Powered by AI-Powered Irrigation Solutions | 2026
        </footer>
      )}
    </div>
  );
}