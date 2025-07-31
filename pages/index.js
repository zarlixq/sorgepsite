import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Sayfa yüklendiğinde register sayfasına yönlendir
    router.replace('/register')
  }, [router])

  return null
}
