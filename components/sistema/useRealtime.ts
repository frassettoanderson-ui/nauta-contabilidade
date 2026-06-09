'use client'

import { useEffect, useRef } from 'react'

/** Conecta no SSE e chama onChange quando há mudança no CRM (com auto-reconexão). */
export function useRealtime(onChange: () => void) {
  const ref = useRef(onChange)
  ref.current = onChange

  useEffect(() => {
    let es: EventSource | null = null
    let stopped = false

    function connect() {
      es = new EventSource('/api/sistema/stream')
      es.onmessage = () => ref.current()
      es.onerror = () => {
        es?.close()
        if (!stopped) setTimeout(connect, 3000) // reconecta
      }
    }
    connect()

    return () => { stopped = true; es?.close() }
  }, [])
}
