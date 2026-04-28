'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-surface border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AL</span>
            </div>
            <span className="text-white font-bold text-lg">AgrOracle</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Ana Sayfa
            </Link>
            <Link href="/dashboard" className="text-accent font-medium">
              Dashboard
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Çiftlikler
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white transition-colors">
              Raporlar
            </Link>
            <button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
              Çıkış
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden py-4 border-t border-gray-800"
          >
            <div className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/dashboard" className="text-accent font-medium px-3 py-2 rounded-lg">
                Dashboard
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors">
                Çiftlikler
              </Link>
              <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors">
                Raporlar
              </Link>
              <button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors mt-2">
                Çıkış
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
