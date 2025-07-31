// pages/done.js
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function DonePage() {
  const router = useRouter()
  const { fullName } = router.query

  const [pct, setPct] = useState({ A: 0, B: 0, C: 0, D: 0 })
  const [resultText, setResultText] = useState('')
  const [strongArr, setStrongArr] = useState([])
  const [weakArr, setWeakArr] = useState([])
  const [activeTab, setActiveTab] = useState('strong')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fullName) return
    ;(async () => {
      // Klasik sonuçları çek
      const { data: classicData, error: classicErr } = await supabase
        .from('test_results_classic')
        .select('a_pct,b_pct,c_pct,d_pct')
        .eq('full_name', fullName)
        .single()

      if (!classicErr && classicData) {
        const c = {
          A: classicData.a_pct,
          B: classicData.b_pct,
          C: classicData.c_pct,
          D: classicData.d_pct
        }
        setPct(c)

        const [maxKey] =
          Object.entries(c).sort(([, a], [, b]) => b - a)[0] || ['A']
        const lookup = {
          A: '🔴 KIRMIZI: Güçlü ve kararlı yapın öne çıkıyor.',
          B: '🟡 SARI: Popüler, neşeli ve sosyal birisin.',
          C: '🟢 YEŞİL: Barışçıl, uyumlu ve sakin birisin.',
          D: '🔵 MAVİ: Planlı, düzenli ve disiplinli birisin.'
        }
        setResultText(lookup[maxKey])
      }

      // Trait sonuçlarını çek
      const { data: traitData, error: traitErr } = await supabase
        .from('test_results_trait')
        .select('strong,weak')
        .eq('full_name', fullName)
        .single()

      if (!traitErr && traitData) {
        const { strong: rawStrong, weak: rawWeak } = traitData

        // String olarak geliyorsa JSON.parse et, obje geliyorsa Object.values, dizi ise direkt al
        const parseArray = (v) => {
          if (Array.isArray(v)) return v
          if (typeof v === 'string') {
            try { return JSON.parse(v) }
            catch { return [] }
          }
          if (v && typeof v === 'object') {
            return Object.values(v)
          }
          return []
        }

        setStrongArr(parseArray(rawStrong))
        setWeakArr(parseArray(rawWeak))
      }

      setLoading(false)
    })()
  }, [fullName])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        Yükleniyor...
      </div>
    )
  }

  // PieChart verisi
  const pieData = [
    { name: 'A', value: pct.A },
    { name: 'B', value: pct.B },
    { name: 'C', value: pct.C },
    { name: 'D', value: pct.D }
  ]
  const COLORS = ['#f87171', '#facc15', '#4ade80', '#60a5fa']

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-8 text-gray-200">

        <h1 className="text-center text-3xl sm:text-4xl font-extrabold">
          Test Sonuçlarınız
        </h1>
        {fullName && (
          <p className="text-center text-lg font-semibold">
            Merhaba, {fullName}
          </p>
        )}

        {/* Klasik PieChart */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-gray-900">
          <h2 className="text-xl font-bold mb-2">Klasik Test (Renk Dağılımı)</h2>
          <p className="font-semibold mb-4">{resultText}</p>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trait Sekmeleri */}
        <div className="bg-white rounded-t-lg shadow-lg">
          <div className="flex">
            <button
              onClick={() => setActiveTab('strong')}
              className={`flex-1 py-3 text-center font-semibold ${
                activeTab === 'strong'
                  ? 'border-b-2 border-purple-600 text-purple-800'
                  : 'text-gray-600'
              }`}
            >
              Güçlü Yönler
            </button>
            <button
              onClick={() => setActiveTab('weak')}
              className={`flex-1 py-3 text-center font-semibold ${
                activeTab === 'weak'
                  ? 'border-b-2 border-purple-600 text-purple-800'
                  : 'text-gray-600'
              }`}
            >
              Zayıf Yönler
            </button>
          </div>
          <div className="p-6 bg-white rounded-b-lg mb-4 text-gray-800">
            {activeTab === 'strong' ? (
              strongArr.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {strongArr.map((txt, i) => (
                    <li key={i} className="font-medium">
                      {txt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-medium">Henüz güçlü yön seçilmedi.</p>
              )
            ) : weakArr.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {weakArr.map((txt, i) => (
                  <li key={i} className="font-medium">
                    {txt}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-medium">Henüz zayıf yön seçilmedi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
