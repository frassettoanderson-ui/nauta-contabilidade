import Link from 'next/link'
import Image from 'next/image'
import { autorPorCategoria, iniciais } from '@/lib/autores'
import type { PostWithRelations } from '@/types/blog'

const MES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
function fmtData(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${MES[d.getMonth()]} ${d.getFullYear()}`
}

/** Card de matéria no formato editorial: categoria+data / imagem / título / resumo / autor. */
export default function BlogCard({ post }: { post: PostWithRelations }) {
  const a = autorPorCategoria(post.categoria?.slug)
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* categoria + data */}
      <div className="flex items-center justify-between px-5 pt-5">
        {post.categoria && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
            style={{ color: '#0BBCD4', background: 'rgba(11,188,212,0.10)', border: '1px solid rgba(11,188,212,0.22)' }}>
            {post.categoria.nome}
          </span>
        )}
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{fmtData(post.criado_em)}</span>
      </div>

      {/* imagem */}
      <div className="relative aspect-[16/9] mt-4 overflow-hidden bg-[#0d1b2e]">
        {post.imagem_destaque && (
          <Image src={post.imagem_destaque} alt={post.titulo} fill sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        )}
      </div>

      {/* corpo */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-white font-black text-lg leading-snug mb-2 group-hover:text-[#0BBCD4] transition-colors" style={{ letterSpacing: '-0.02em' }}>
          {post.titulo}
        </h3>
        {post.resumo && (
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-5">{post.resumo}</p>
        )}

        {/* autor */}
        <div className="mt-auto pt-4 flex items-center gap-2.5 border-t border-white/8">
          {a.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.foto} alt={a.nome} width={34} height={34}
              className="rounded-full object-cover shrink-0" style={{ width: 34, height: 34, border: '1.5px solid rgba(11,188,212,0.5)' }} />
          ) : (
            <span className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
              style={{ width: 34, height: 34, background: '#0BBCD4', fontSize: 13 }} aria-hidden="true">{iniciais(a.nome)}</span>
          )}
          <div className="leading-tight">
            <div className="text-gray-200 text-sm font-semibold">{a.nome}</div>
            <div className="text-gray-500 text-xs">{a.setor} · Nauta</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
