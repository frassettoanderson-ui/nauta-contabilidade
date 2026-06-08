/**
 * ArticleBody — renderiza o HTML do TipTap com tipografia editorial.
 * Estilos aplicados via className (não Tailwind prose) para controle total no dark mode.
 */
export default function ArticleBody({ content }: { content: string }) {
  if (!content) return null
  return (
    <>
      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <style jsx global>{`
        .article-body {
          color: #d1d5db;
          font-size: 1.0625rem;
          line-height: 1.8;
          letter-spacing: -0.01em;
        }
        .article-body h2 {
          color: #f9fafb;
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.025em;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.25;
        }
        .article-body h3 {
          color: #f3f4f6;
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .article-body p {
          margin-bottom: 1.25rem;
        }
        .article-body strong {
          color: #f9fafb;
          font-weight: 700;
        }
        .article-body em {
          color: #e5e7eb;
        }
        .article-body ul, .article-body ol {
          margin: 1.25rem 0;
          padding-left: 1.5rem;
        }
        .article-body ul { list-style-type: disc; }
        .article-body ol { list-style-type: decimal; }
        .article-body li {
          margin-bottom: 0.5rem;
          padding-left: 0.25rem;
        }
        .article-body a {
          color: #0BBCD4;
          text-decoration: underline;
          text-decoration-color: rgba(11,188,212,0.4);
          text-underline-offset: 3px;
          transition: color 0.15s;
        }
        .article-body a:hover {
          color: #38d9f0;
          text-decoration-color: rgba(11,188,212,0.8);
        }
        .article-body blockquote {
          border-left: 3px solid #0BBCD4;
          padding: 0.75rem 1.25rem;
          margin: 1.5rem 0;
          background: rgba(11,188,212,0.05);
          border-radius: 0 12px 12px 0;
          color: #9ca3af;
          font-style: italic;
        }
        .article-body code {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 6px;
          padding: 0.15em 0.45em;
          font-size: 0.875em;
          color: #0BBCD4;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .article-body pre {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .article-body pre code {
          background: none;
          border: none;
          padding: 0;
          color: #e5e7eb;
        }
        .article-body img {
          width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5rem 0;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .article-body hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 2rem 0;
        }
        .article-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.9em;
        }
        .article-body th {
          background: rgba(11,188,212,0.08);
          color: #0BBCD4;
          font-weight: 700;
          padding: 0.75rem 1rem;
          text-align: left;
          border: 1px solid rgba(11,188,212,0.15);
        }
        .article-body td {
          padding: 0.75rem 1rem;
          border: 1px solid rgba(255,255,255,0.07);
          color: #d1d5db;
        }
        .article-body tr:nth-child(even) td {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </>
  )
}
