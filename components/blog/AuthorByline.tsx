import { autorPorCategoria, iniciais, type Autor } from '@/lib/autores'

function Avatar({ a, size }: { a: Autor; size: number }) {
  if (a.foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={a.foto}
        alt={a.nome}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size, border: '2px solid rgba(11,188,212,0.5)' }}
      />
    )
  }
  return (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: '#0BBCD4', fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {iniciais(a.nome)}
    </span>
  )
}

/** Assinatura no topo do artigo: foto + nome + setor (derivado da categoria). */
export default function AuthorByline({
  categoriaSlug,
  size = 40,
}: {
  categoriaSlug?: string | null
  size?: number
}) {
  const a = autorPorCategoria(categoriaSlug)
  return (
    <span className="flex items-center gap-3 text-sm">
      <Avatar a={a} size={size} />
      <span className="leading-tight">
        <span className="text-gray-100 font-semibold block">{a.nome}</span>
        <span className="text-gray-500 text-xs">{a.setor}</span>
      </span>
    </span>
  )
}

/** Box do autor no fim do artigo: foto grande + "Escrito por" + nome + setor. */
export function AuthorBox({ categoriaSlug }: { categoriaSlug?: string | null }) {
  const a = autorPorCategoria(categoriaSlug)
  return (
    <div
      className="mt-14 rounded-2xl p-6 flex items-center gap-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Avatar a={a} size={76} />
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Escrito por</div>
        <div className="text-white font-black text-lg leading-tight">{a.nome}</div>
        <div className="text-[#0BBCD4] text-sm font-semibold mt-0.5">{a.cargo} · Nauta Contabilidade</div>
      </div>
    </div>
  )
}
