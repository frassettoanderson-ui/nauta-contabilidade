import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight } from 'lucide-react'
import type { PostWithRelations } from '@/types/blog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  fiscal:                    { bg: 'rgba(11,188,212,0.10)',  text: '#0BBCD4',  border: 'rgba(11,188,212,0.25)' },
  trabalhista:               { bg: 'rgba(124,111,255,0.10)', text: '#7c6fff',  border: 'rgba(124,111,255,0.25)' },
  empresarial:               { bg: 'rgba(61,59,142,0.12)',   text: '#9d9bff',  border: 'rgba(61,59,142,0.30)' },
  'contabilidade-eleitoral': { bg: 'rgba(11,188,212,0.10)',  text: '#0BBCD4',  border: 'rgba(11,188,212,0.25)' },
  mei:                       { bg: 'rgba(34,197,94,0.10)',   text: '#22c55e',  border: 'rgba(34,197,94,0.25)' },
  'planejamento-tributario':  { bg: 'rgba(251,191,36,0.10)', text: '#d97706',  border: 'rgba(251,191,36,0.25)' },
}

const DEFAULT_COLOR = { bg: 'rgba(255,255,255,0.08)', text: '#9ca3af', border: 'rgba(255,255,255,0.15)' }

function getCatColor(slug?: string) {
  return slug ? (CATEGORY_COLORS[slug] ?? DEFAULT_COLOR) : DEFAULT_COLOR
}

export default function PostCard({ post }: { post: PostWithRelations }) {
  const color = getCatColor(post.categoria?.slug)
  const date  = format(new Date(post.criado_em), "d 'de' MMMM, yyyy", { locale: ptBR })

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.border = `1px solid ${color.border}`
        e.currentTarget.style.boxShadow = `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px ${color.border}`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Imagem destaque */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1a1830] to-[#0f0e1a]">
        {post.imagem_destaque ? (
          <Image
            src={post.imagem_destaque}
            alt={post.titulo}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color.bg.replace('0.10', '0.15')}, rgba(15,14,26,0.8))` }}
          >
            <span className="text-5xl font-black opacity-20" style={{ color: color.text }}>
              {post.titulo.charAt(0)}
            </span>
          </div>
        )}
        {/* Overlay gradiente */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,14,26,0.6) 0%, transparent 60%)' }} />

        {/* Categoria badge */}
        {post.categoria && (
          <span
            className="absolute top-4 left-4 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider"
            style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}`, backdropFilter: 'blur(8px)' }}
          >
            {post.categoria.nome}
          </span>
        )}
      </div>

      {/* Corpo */}
      <div className="flex flex-col flex-1 p-5">
        <h3
          className="font-bold text-white text-sm leading-snug mb-2.5 transition-colors duration-200 group-hover:text-[#0BBCD4] line-clamp-2"
          style={{ letterSpacing: '-0.01em' }}
        >
          {post.titulo}
        </h3>

        {post.resumo && (
          <p className="text-gray-400 text-xs leading-relaxed flex-1 mb-4 line-clamp-3">
            {post.resumo}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <span className="flex items-center gap-1">
              <User size={11} />
              {post.autor}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {date}
            </span>
          </div>
          <span
            className="flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
            style={{ color: color.text }}
          >
            Ler <ArrowRight size={11} />
          </span>
        </div>
      </div>

      {/* Bottom line */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
        style={{ background: `linear-gradient(to right, ${color.text}, transparent)` }}
      />
    </Link>
  )
}
