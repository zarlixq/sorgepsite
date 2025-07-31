import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AdminPanel() {
  const [question, setQuestion] = useState('')
  const [rawOptions, setRawOptions] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    let text = rawOptions.trim()
    let lines = []

    // tırnak içeriyor mu kontrol et
    if (text.includes('"')) {
      lines = text
        .split('"')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('\n'))
    } else {
      lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l)
    }

    // başındaki a) b) c) d) gibi işaretleri temizle
    lines = lines.map((l) => l.replace(/^[a-dA-D]\)\s*/, '').trim())

    // ilk 4'ü al
    const [a, b, c, d] = lines

    if (!a || !b || !c || !d) {
      setLoading(false)
      setMessage('⚠️ Lütfen 4 şıkkı da girdiğinden emin ol!')
      return
    }

    const { error } = await supabase.from('questions').insert([
      {
        question,
        option_a: a,
        option_b: b,
        option_c: c,
        option_d: d,
      },
    ])

    setLoading(false)
    if (error) {
      setMessage('❌ Hata: ' + error.message)
    } else {
      setMessage('✅ Soru başarıyla kaydedildi!')
      setQuestion('')
      setRawOptions('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">🛠️ Soru Ekleme Paneli</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            placeholder="Soruyu buraya yaz/kopyala"
            className="p-3 border rounded-md h-20"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          <textarea
            placeholder={`Şıkları alt alta yapıştır (tırnaklı ya da düz):\n"a) ..."\n"b) ..."\n...\nveya\n a) ...\n b) ...\n c) ...`}
            className="p-3 border rounded-md h-40"
            value={rawOptions}
            onChange={(e) => setRawOptions(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-md font-semibold text-lg hover:opacity-90 active:scale-95 transition-all"
          >
            {loading ? 'Ekleniyor...' : '➕ Kaydet'}
          </button>
        </form>
        {message && <p className="mt-4 text-center font-medium">{message}</p>}
      </div>
    </div>
  )
}
