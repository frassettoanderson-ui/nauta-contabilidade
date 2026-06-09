/**
 * Som de clique curto e sutil, sintetizado via Web Audio API.
 * Não precisa de arquivo de áudio. Só toca após interação do usuário.
 */
let ctx: AudioContext | null = null

export function playClick() {
  try {
    if (typeof window === 'undefined') return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    if (!ctx) ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(720, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.05)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.09)
  } catch {
    /* silencioso — som é um detalhe, nunca deve quebrar o fluxo */
  }
}

/** Alerta de lembrete: dois "bipes" ascendentes. */
export function playAlert() {
  try {
    if (typeof window === 'undefined') return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    if (!ctx) ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const base = ctx.currentTime
    ;[0, 0.18].forEach((offset, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const t = base + offset
      osc.type = 'sine'
      osc.frequency.setValueAtTime(i === 0 ? 660 : 880, t)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
      osc.connect(gain); gain.connect(ctx!.destination)
      osc.start(t); osc.stop(t + 0.16)
    })
  } catch {
    /* silencioso */
  }
}
