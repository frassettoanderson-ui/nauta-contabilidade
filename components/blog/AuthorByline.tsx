import { autorPorCategoria, iniciais } from '@/lib/autores'

/**
 * Assinatura do artigo: foto do colaborador (ou avatar de iniciais) + nome + setor.
 * O autor é derivado da categoria do post.
 */
export default function AuthorByline({
  categoriaSlug,
  size = 30,
}: {
  categoriaSlug?: string | null
  size?: number
}) {
  const a = autorPorCategoria(categoriaSlug)
  return (
    <span className="flex items-center gap-2.5 text-sm">
      {a.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.foto}
          alt={a.nome}
          width={size}
          height={size}
          className="rounded-full object-cover shrink-0"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
          style={{ width: size, height: size, background: '#0BBCD4', fontSize: Math.round(size * 0.4) }}
          aria-hidden="true"
        >
          {iniciais(a.nome)}
        </span>
      )}
      <span className="leading-tight">
        <span className="text-gray-200 font-semibold">{a.nome}</span>
        <span className="text-gray-500"> · {a.setor}</span>
      </span>
    </span>
  )
}
