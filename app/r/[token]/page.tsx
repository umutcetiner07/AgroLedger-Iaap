'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function FeedbackPage() {
  const { token } = useParams()
  const [valid, setValid] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Mock validity
    setValid(true)
  }, [token])

  const submitResponse = async (response: string) => {
    const res = await fetch(`/api/anomaly/respond/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response })
    })
    if (res.ok) {
      setMessage('Yanıtınız kaydedildi.')
    } else {
      setMessage('Hata.')
    }
  }

  if (valid === null) return <div>Loading...</div>
  if (!valid) return <div>Token geçersiz veya süresi dolmuş.</div>

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-4">Anomali Geri Bildirimi</h1>
      <button onClick={() => submitResponse('MANUAL_IRRIGATION')} className="bg-green-500 text-white p-4 rounded mb-2 w-full max-w-sm">
        ✅ Ben suluyorum
      </button>
      <button onClick={() => submitResponse('CONFIRMED')} className="bg-red-500 text-white p-4 rounded w-full max-w-sm">
        🚨 Sorun var!
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}