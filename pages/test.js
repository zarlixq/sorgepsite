// pages/test.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function TestPage() {
  const router = useRouter()
  const { userId, fullName } = router.query

  const [loading, setLoading] = useState(true)
  const [testStep, setTestStep] = useState(null)        // 'classic' | 'transition' | 'trait'
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  // 1) Başlangıçta test durumunu yükle
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data: status, error: statusErr } = await supabase
        .from('test_status')
        .select('classic_done, trait_done')
        .eq('user_id', userId)
        .single()
      console.log('status fetch:', { status, statusErr })

      if (!status || !status.classic_done) {
        setTestStep('classic')
        await loadQuestions('questions')
      } else if (!status.trait_done) {
        setTestStep('transition')
      } else {
        router.replace(
          `/done?userId=${userId}&fullName=${encodeURIComponent(fullName)}`
        )
      }
      setLoading(false)
    })()
  }, [userId])

  // 2) Soruları yükleyen yardımcı
  const loadQuestions = async (tableName) => {
    const { data, error } = await supabase.from(tableName).select('*')
    if (error || !data) {
      alert('Sorular yüklenemedi: ' + (error?.message || ''))
      return
    }
    const sorted = data
      .filter((q) => q.created_at)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    setQuestions(sorted)
    setCurrentIndex(0)
    setAnswers({})
  }

  // 3) Şık seçildiğinde
  const handleOption = async (choice) => {
    const qId = questions[currentIndex].id
    const updated = { ...answers, [qId]: choice }
    setAnswers(updated)

    // Eğer bitirmediyse sıradaki soruya geç
    if (currentIndex < questions.length - 1) {
      return setCurrentIndex((i) => i + 1)
    }

    // SON SORU: sonuçları kaydetme zamanı
    setLoading(true)

    // ————— Classic sonuçlarını kaydet —————
    if (testStep === 'classic') {
      const total = Object.keys(updated).length
      const counts = { a: 0, b: 0, c: 0, d: 0 }
      Object.values(updated).forEach((v) => counts[v]++)

      const payloadClassic = {
        full_name: fullName,
        a_pct: Math.round((counts.a / total) * 100),
        b_pct: Math.round((counts.b / total) * 100),
        c_pct: Math.round((counts.c / total) * 100),
        d_pct: Math.round((counts.d / total) * 100),
      }

      const { data: classicData, error: classicErr } = await supabase
        .from('test_results_classic')
        .insert([payloadClassic])
      console.log('classic insert:', { classicData, classicErr })

      await supabase
        .from('test_status')
        .upsert(
          [{ user_id: userId, classic_done: true }],
          { onConflict: ['user_id'] }
        )

      setTestStep('transition')
      setLoading(false)
      return
    }

    // ————— Trait sonuçlarını kaydet —————
    if (testStep === 'trait') {
      // Güçlü ve zayıf metni array olarak hazırla
      const strongArr = questions
        .slice(0, 20)
        .map((q) => {
          const letter = updated[q.id]            // 'a'|'b'|'c'|'d'
          return q[`option_${letter}`]            // örn. 'Cesur'
        })
      const weakArr = questions
        .slice(20)
        .map((q) => {
          const letter = updated[q.id]
          return q[`option_${letter}`]
        })

      const payloadTrait = {
        full_name: fullName,
        strong: strongArr,   // text[] sütununa yazılacak
        weak:   weakArr      // text[] sütununa yazılacak
      }

      const { data: traitData, error: traitErr } = await supabase
        .from('test_results_trait')
        .insert([payloadTrait])
      console.log('trait insert:', { traitData, traitErr })

      await supabase
        .from('test_status')
        .upsert(
          [{ user_id: userId, trait_done: true }],
          { onConflict: ['user_id'] }
        )

      setLoading(false)
      router.replace(
        `/done?userId=${userId}&fullName=${encodeURIComponent(fullName)}`
      )
    }
  }

  // 4) Geri butonu
  const goBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  // 5) Trait testine geç
  const startTrait = async () => {
    setLoading(true)
    setTestStep('trait')
    await loadQuestions('questions_test2')
    setLoading(false)
  }

  // ————— Yükleniyor ekranı —————
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center
                      bg-gradient-to-br from-purple-500 to-blue-500 text-white">
        Yükleniyor...
      </div>
    )
  }

  // ————— Ara ekran (transition) —————
  if (testStep === 'transition') {
    return (
      <div className="min-h-screen bg-cyan-300 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-xl text-center text-gray-800">
          <h2 className="text-2xl font-bold mb-4">KİŞİLİK PROFİLİNİZ</h2>
          <p className="text-sm leading-relaxed">
            Aşağıdaki yanyana dört sözcükten oluşan sıraların her birinde,
            size en çok uyan bir sözcüğü işaretleyiniz. 20 güçlü ve 20 zayıf yön.
          </p>
          <button
            onClick={startTrait}
            className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700"
          >
            Teste Başla
          </button>
        </div>
      </div>
    )
  }

  // ————— Asıl test ekranı —————
  const current = questions[currentIndex]
  const selected = answers[current?.id]
  const isClassic = testStep === 'classic'
  const title = isClassic
    ? '🎯 Karakter Testi'
    : currentIndex < 20
    ? '💪 Güçlü Yönler'
    : '⚠️ Zayıf Yönler'

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-purple-500 to-indigo-500 p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">{title}</h2>
        <p className="mb-6 text-gray-800">{current.question}</p>

        <div className="flex flex-col gap-4">
          {['a', 'b', 'c', 'd'].map((key) => (
            <button
              key={key}
              onClick={() => handleOption(key)}
              className={`p-4 rounded-xl border text-left font-medium transition ${
                selected === key
                  ? 'bg-purple-100 border-purple-400 text-purple-900'
                  : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="font-bold mr-2">{key.toUpperCase()})</span>
              {current[`option_${key}`]}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 text-gray-700 text-sm">
          <button
            onClick={goBack}
            disabled={currentIndex === 0}
            className="underline disabled:opacity-50"
          >
            ← Geri
          </button>
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>
    </div>
  )
}
