// Preferências do sistema (tema e sons) — persistidas em localStorage.
// Dispara o evento 'sys-prefs-change' para que componentes reajam na hora.

export type Tema = 'dark' | 'light'

const EVT = 'sys-prefs-change'

export function getTema(): Tema {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('sys-theme') as Tema) || 'dark'
}

export function setTema(t: Tema) {
  localStorage.setItem('sys-theme', t)
  window.dispatchEvent(new Event(EVT))
}

export function getSomAtivo(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem('sys-sounds') !== 'off'
}

export function setSomAtivo(on: boolean) {
  localStorage.setItem('sys-sounds', on ? 'on' : 'off')
  window.dispatchEvent(new Event(EVT))
}

export function onPrefsChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVT, cb)
  return () => window.removeEventListener(EVT, cb)
}
