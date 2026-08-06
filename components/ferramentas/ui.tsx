'use client'

import type { ReactNode } from 'react'

const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5 font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full h-11 rounded-xl px-3 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0BBCD4]/30"
      style={inputStyle} />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className="w-full h-11 rounded-xl px-3 text-sm text-white outline-none focus:ring-2 focus:ring-[#0BBCD4]/30"
      style={inputStyle} />
  )
}

export function Button({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...p} className="px-6 py-3 font-bold text-white text-sm rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
      style={{ background: '#0BBCD4', boxShadow: '0 8px 24px rgba(11,188,212,0.25)' }}>
      {children}
    </button>
  )
}

export function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-white/8 last:border-0 ${strong ? 'text-base' : 'text-sm'}`}>
      <span className={strong ? 'text-white font-bold' : 'text-gray-400'}>{label}</span>
      <span className={strong ? 'text-[#0BBCD4] font-black' : 'text-gray-200 font-semibold'}>{value}</span>
    </div>
  )
}
