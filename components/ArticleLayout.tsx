import React from 'react'

interface Article {
  title: string
  date: string
  description: string
  author: string
  tags?: string[]
}

export function ArticleLayout({ article, children }: { article: Article; children: React.ReactNode }) {
  const formatted = new Date(article.date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <article
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '80px 24px 120px',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: '#e4e4e7',
        background: '#000',
        minHeight: '100vh',
      }}
    >
      <header style={{ marginBottom: '48px' }}>
        <p style={{
          color: 'rgba(134,239,172,0.8)',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          Insights · {formatted}
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          color: '#fff',
          marginBottom: '24px',
        }}>
          {article.title}
        </h1>
        <p style={{
          fontSize: '1.125rem',
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.55)',
          marginBottom: '24px',
        }}>
          {article.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
            {article.author}
          </span>
          {article.tags?.map(tag => (
            <span key={tag} style={{
              fontSize: '0.75rem',
              color: 'rgba(134,239,172,0.7)',
              border: '1px solid rgba(134,239,172,0.2)',
              borderRadius: '4px',
              padding: '2px 8px',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div style={{
        fontSize: '1rem',
        lineHeight: 1.85,
        color: 'rgba(255,255,255,0.72)',
      }}
        className="article-body"
      >
        {children}
      </div>

      <style>{`
        .article-body h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #fff;
          margin-top: 48px;
          margin-bottom: 16px;
        }
        .article-body h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          margin-top: 32px;
          margin-bottom: 12px;
        }
        .article-body p {
          margin-top: 16px;
        }
        .article-body p:first-child {
          margin-top: 0;
        }
        .article-body ul, .article-body ol {
          margin-top: 16px;
          margin-bottom: 16px;
          padding-left: 1.5rem;
        }
        .article-body li {
          margin-bottom: 8px;
        }
        .article-body strong {
          color: rgba(255,255,255,0.9);
          font-weight: 600;
        }
        .article-body a {
          color: rgba(134,239,172,0.9);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .article-body blockquote {
          border-left: 3px solid rgba(134,239,172,0.4);
          padding-left: 1rem;
          margin: 24px 0;
          color: rgba(255,255,255,0.5);
          font-style: italic;
        }
        .article-body table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24px;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }
        .article-body th {
          text-align: left;
          color: rgba(134,239,172,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 8px 12px;
          font-weight: 600;
        }
        .article-body td {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 8px 12px;
          color: rgba(255,255,255,0.65);
        }
      `}</style>
    </article>
  )
}
