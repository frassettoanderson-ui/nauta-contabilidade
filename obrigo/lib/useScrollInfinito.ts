import { useEffect, useRef, useState, type DependencyList } from 'react';

// Scroll infinito reutilizavel: substitui a paginacao por "carregar mais ao rolar".
// fetchPagina(page) deve devolver { items, total } (mesmo formato paginado do backend).
// deps: quando mudam (filtros/ordem), a lista reseta e busca a 1a pagina.
// Uso: const { items, total, loading, carregandoMais, sentinelRef } = useScrollInfinito(fn, [deps]);
// e no fim da lista: <div ref={sentinelRef} /> (+ um "Carregando..." opcional).
export function useScrollInfinito<T>(
  fetchPagina: (page: number) => Promise<{ items: T[]; total: number }>,
  deps: DependencyList,
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);          // 1a pagina
  const [carregandoMais, setCarregandoMais] = useState(false);

  const pageRef = useRef(1);
  const fetchRef = useRef(fetchPagina);
  useEffect(() => { fetchRef.current = fetchPagina; });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const carregandoRef = useRef(false);
  const hasMoreRef = useRef(false);

  // reset + 1a pagina quando as deps mudam
  useEffect(() => {
    let cancelado = false;
    pageRef.current = 1;
    setLoading(true);
    fetchRef.current(1)
      .then((r) => { if (!cancelado) { setItems(r.items); setTotal(r.total); } })
      .catch(() => { if (!cancelado) { setItems([]); setTotal(0); } })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const hasMore = items.length < total;
  hasMoreRef.current = hasMore;

  async function carregarMais() {
    if (carregandoRef.current || !hasMoreRef.current) return;
    carregandoRef.current = true;
    setCarregandoMais(true);
    const prox = pageRef.current + 1;
    try {
      const r = await fetchRef.current(prox);
      setItems((cur) => [...cur, ...r.items]);
      setTotal(r.total);
      pageRef.current = prox;
    } catch { /* ignora; tenta de novo ao rolar */ }
    finally { carregandoRef.current = false; setCarregandoMais(false); }
  }

  // observa o "sentinela" no fim da lista: quando ele aparece, carrega mais
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entradas) => { if (entradas[0]?.isIntersecting) void carregarMais(); },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, total, loading, carregandoMais, hasMore, sentinelRef, setItems };
}
