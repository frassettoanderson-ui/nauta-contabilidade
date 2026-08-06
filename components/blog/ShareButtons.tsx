'use client'

import { Facebook, Linkedin, Twitter } from 'lucide-react'

const BASE = 'https://nautacontabilidade.com.br'

export default function ShareButtons({ slug, titulo }: { slug: string; titulo: string }) {
  const url = `${BASE}/blog/${slug}`
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(titulo)

  const links = [
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: Facebook },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: Linkedin },
    { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, Icon: null },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, Icon: Twitter },
  ]

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-gray-500 mr-1 hidden sm:inline">Compartilhar:</span>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Compartilhar no ${label}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(11,188,212,0.12)', border: '1px solid rgba(11,188,212,0.25)' }}
        >
          {Icon ? (
            <Icon size={16} className="text-[#0BBCD4]" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#0BBCD4]" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
            </svg>
          )}
        </a>
      ))}
    </div>
  )
}
