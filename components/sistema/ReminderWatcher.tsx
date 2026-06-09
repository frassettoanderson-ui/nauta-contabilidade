'use client'

import { useEffect, useRef } from 'react'
import { getPendingLembretes } from '@/lib/api'
import { playAlert } from '@/lib/click-sound'

const NOTIFIED_KEY = 'nauta_lembretes_notificados'

function loadNotified(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')) } catch { return new Set() }
}
function saveNotified(s: Set<string>) {
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s])) } catch {}
}

/** Verifica lembretes pendentes e dispara notificação push + som no horário. */
export default function ReminderWatcher() {
  const notified = useRef<Set<string>>(new Set())

  useEffect(() => {
    notified.current = loadNotified()
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    let timer: ReturnType<typeof setInterval>

    async function check() {
      try {
        const list = await getPendingLembretes()
        const now = Date.now()
        for (const l of list) {
          if (notified.current.has(l.id)) continue
          const hora = (l.hora ? String(l.hora).slice(0, 5) : '00:00')
          const due = new Date(`${String(l.data).slice(0, 10)}T${hora}:00`).getTime()
          if (now >= due) {
            // dispara notificação + som
            try {
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('🔔 Lembrete — ' + l.lead_nome, { body: l.descricao })
              }
            } catch {}
            playAlert()
            notified.current.add(l.id)
            saveNotified(notified.current)
          }
        }
      } catch { /* silencioso */ }
    }

    check()
    timer = setInterval(check, 60_000) // a cada 1 min
    return () => clearInterval(timer)
  }, [])

  return null
}
