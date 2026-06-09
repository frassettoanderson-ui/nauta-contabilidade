import { EventEmitter } from 'events'

// Singleton no processo (sobrevive a re-imports / hot reload)
const g = globalThis as unknown as { __crmBus?: EventEmitter }
export const crmBus = g.__crmBus ?? (g.__crmBus = new EventEmitter())
crmBus.setMaxListeners(0)

/** Notifica todos os clientes conectados que houve mudança no CRM. */
export function emitCrmChange() {
  crmBus.emit('change')
}
