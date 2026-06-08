export interface Categoria {
  id: string
  nome: string
  slug: string
  criado_em?: string
}

export interface Tag {
  id: string
  nome: string
  slug: string
}

export interface Post {
  id: string
  titulo: string
  slug: string
  resumo?: string
  conteudo?: string
  imagem_destaque?: string
  autor: string
  categoria_id?: string
  categoria?: Categoria
  tags?: Tag[]
  status: 'rascunho' | 'publicado'
  criado_em: string
  atualizado_em: string
}

export interface PostWithRelations extends Omit<Post, 'categoria'> {
  categoria: Categoria | null
  tags: Tag[]
}

export interface PaginatedPosts {
  posts: PostWithRelations[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
