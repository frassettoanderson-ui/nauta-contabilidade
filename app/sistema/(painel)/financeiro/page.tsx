'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function FinanceiroIndex() {
  const router = useRouter()
  useEffect(() => { router.replace('/sistema/financeiro/faturamento') }, [router])
  return <div className="flex justify-center py-24"><Loader2 size={24} className="animate-spin text-[#0BBCD4]" /></div>
}
