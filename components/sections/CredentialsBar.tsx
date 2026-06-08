import Image from 'next/image'
import { TrendingUp, Award, MapPin, Shield } from 'lucide-react'

const credentials = [
  { icon: TrendingUp, value: '+10 anos',     label: 'de experiência no mercado' },
  { icon: Award,      value: '+400',          label: 'prestações eleitorais aprovadas' },
  { icon: MapPin,     value: 'Todo o Brasil', label: 'atendimento 100% digital' },
  { icon: Shield,     value: 'BPO 100%',      label: 'interno, sem terceirização' },
]

export default function CredentialsBar() {
  return (
    <section className="bg-[#0BBCD4] py-0" aria-label="Credenciais">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
          {credentials.map(({ icon: Icon, value, label }) => (
            <div key={value} className="flex flex-col items-center text-center px-6 py-8 hover:bg-white/10 transition-colors">
              <Icon className="text-white/80 mb-2" size={22} aria-hidden="true" />
              <span className="text-3xl font-black text-white">{value}</span>
              <span className="text-white/80 text-xs mt-1 leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
