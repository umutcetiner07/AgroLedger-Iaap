'use client'

import { motion } from 'framer-motion'
import LiveWaterSavingsCounter from '../components/LiveWaterSavingsCounter'
import ConfidenceScoreChart from '../components/ConfidenceScoreChart'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              AgroLedger
              <span className="text-accent"> IaaP</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Kazakistan için geliştirilen Yapay Zeka Destekli Akıllı Sulama ve Tedarik Zinciri Finansmanı Ekosistemi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
              >
                Demo Başlat
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-accent text-accent px-8 py-3 rounded-lg font-semibold hover:bg-accent/10 transition-colors"
              >
                Whitepaper
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Destekli Şeffaf Tarım Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Destekli
              <span className="text-accent"> Şeffaf Tarım</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Gerçek zamanlı verilerle sulama optimizasyonu, su tasarrufu takibi ve anomali tespiti
            </p>
          </motion.div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <LiveWaterSavingsCounter />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <ConfidenceScoreChart />
            </motion.div>
          </div>

          {/* Özellik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Water Needs Baseline",
                description: "Bölgesel normlar ve gerçek alan verileriyle hassas su ihtiyacı hesaplaması",
                icon: "💧",
                color: "from-blue-500 to-cyan-400"
              },
              {
                title: "Field Health Score",
                description: "Fenoloji-aware NDVI ve Radar verileriyle alan sağlığı takibi",
                icon: "🌱",
                color: "from-green-500 to-emerald-400"
              },
              {
                title: "Shadow Mode",
                description: "AI kararlarını arka planda test ederek tam otonomiye geçiş",
                icon: "🤖",
                color: "from-purple-500 to-pink-400"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-surface rounded-xl p-6 border border-gray-800 hover:border-accent transition-all duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* İstatistikler Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Etki ve Sonuçlar</h2>
            <p className="text-xl text-gray-300">Kazakistan tarımında yarattığımız fark</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "40%", label: "Su Tasarrufu", desc: "Ortalama" },
              { number: "250+", label: "Çiftlik", desc: "Aktif" },
              { number: "3", label: "Bölge", desc: "Kapsam" },
              { number: "99.2%", label: "Doğruluk", desc: "AI Tahmini" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                  {stat.number}
                </div>
                <div className="text-xl font-semibold text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-gray-400">
                  {stat.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">AgroLedger IaaP</h3>
            <p className="text-gray-400 mb-6">
              © 2024 Agro-Tech Strategist - Umut Cetiner
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                GitHub
              </a>
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-accent hover:text-accent/80 transition-colors">
                Whitepaper
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}