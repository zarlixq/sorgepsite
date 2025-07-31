import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    birthdate: '',
    role: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.role) {
      alert('Lütfen öğrenci mi yıldız mı olduğunu seç.')
      return
    }

    setLoading(true)

    // Kayıt varsa güncelle, yoksa oluştur
    const { data, error } = await supabase
      .from('users') // 👈 yeni tablo adı
      .upsert([form], { onConflict: ['fullName'] }) // fullName benzersiz olmalı
      .select()

    setLoading(false)

    if (error) {
      alert('Hata: ' + error.message)
      return
    }

    if (data && data.length > 0) {
      const userId = data[0].id
      const fullName = form.fullName
      router.push(`/test?userId=${userId}&fullName=${encodeURIComponent(fullName)}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md animate-fadeIn">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-8 text-center text-gray-800">
          Kayıt Formu
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Ad Soyad */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">
              Ad Soyad
            </label>
            <input
              className="p-3 border rounded-xl text-base sm:text-lg text-gray-700 placeholder-gray-400 focus:ring-4 focus:ring-blue-300 focus:outline-none transition"
              name="fullName"
              placeholder="Ad Soyad"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Doğum Tarihi */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">
              Doğum Tarihi
            </label>
            <input
              className="p-3 border rounded-xl text-base sm:text-lg text-gray-700 placeholder-gray-400 focus:ring-4 focus:ring-blue-300 focus:outline-none transition"
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={handleChange}
              required
            />
          </div>

          {/* Rol Seçimi */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">
              Rol
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="p-3 border rounded-xl text-base sm:text-lg text-gray-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition"
              required
            >
              <option value="">Seçiniz</option>
              <option value="student">Öğrenci</option>
              <option value="coach">Yıldız</option>
            </select>
          </div>

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold text-lg sm:text-xl hover:opacity-90 transition-all active:scale-95"
          >
            {loading ? 'Kaydediliyor...' : 'Teste Başla'}
          </button>
        </form>
      </div>
    </div>
  )
}
