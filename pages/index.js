import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Sayfa yüklendiğinde direkt register sayfasına yönlendir
    router.replace('/register')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <h1 className="text-white text-2xl">Yönlendiriliyor...</h1>
    </div>
  )
}
