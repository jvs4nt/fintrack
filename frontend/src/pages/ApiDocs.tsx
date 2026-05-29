import { API_SECTIONS, type ApiEndpoint, type HttpMethod } from '../data/apiReference';
import { resolveApiBase } from '../lib/apiBase';
import '../App.css';

const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: 'api-docs-method-get',
  POST: 'api-docs-method-post',
  PUT: 'api-docs-method-put',
  PATCH: 'api-docs-method-patch',
  DELETE: 'api-docs-method-delete',
};

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <article className="api-docs-endpoint card">
      <div className="api-docs-endpoint-head">
        <span className={`api-docs-method ${METHOD_CLASS[endpoint.method]}`}>{endpoint.method}</span>
        <code className="api-docs-path">{endpoint.path}</code>
        {!endpoint.auth && <span className="api-docs-badge">sem auth</span>}
      </div>
      <p className="api-docs-summary">{endpoint.summary}</p>
      {endpoint.query ? (
        <div className="api-docs-block">
          <span className="api-docs-label">Query</span>
          <pre className="api-docs-pre">{endpoint.query}</pre>
        </div>
      ) : null}
      {endpoint.requestBody ? (
        <div className="api-docs-block">
          <span className="api-docs-label">Corpo (request)</span>
          <pre className="api-docs-pre">{endpoint.requestBody}</pre>
        </div>
      ) : null}
      {endpoint.response ? (
        <div className="api-docs-block">
          <span className="api-docs-label">Resposta</span>
          <pre className="api-docs-pre">{endpoint.response}</pre>
        </div>
      ) : null}
      {endpoint.notes ? <p className="api-docs-notes">{endpoint.notes}</p> : null}
    </article>
  );
}

export default function ApiDocs() {
  const apiBase = resolveApiBase();

  return (
    <div className="api-docs-page">
      <header className="api-docs-header">
        <div className="api-docs-header-top">
          <h1 className="api-docs-title">Referência da API REST</h1>
          <a className="api-docs-back" href="/">
            Voltar ao app
          </a>
        </div>
        <p className="api-docs-subtitle">
          FinTrack — documentação para desenvolvimento (web). Rota oculta; não listada na navegação.
        </p>
        <p className="api-docs-base">
          Base URL: <code>{apiBase}</code>
        </p>
      </header>

      <section className="api-docs-auth card" id="auth">
        <h2 className="api-docs-section-title">Autenticação</h2>
        <p>
          Todas as rotas <code>/api/*</code> exceto <code>GET /api/health</code> exigem:
        </p>
        <pre className="api-docs-pre">Authorization: Bearer &lt;access_token&gt;</pre>
        <p>
          Token da sessão Supabase (<code>session.access_token</code>), enviado pelo{' '}
          <code>useApi</code>. Dados filtrados por <code>userId</code> do JWT.
        </p>
        <table className="api-docs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Significado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>401</code>
              </td>
              <td>Token ausente, inválido ou expirado</td>
            </tr>
          </tbody>
        </table>
      </section>

      <nav className="api-docs-index card" aria-label="Índice de seções">
        <h2 className="api-docs-section-title">Índice</h2>
        <ul className="api-docs-index-list">
          <li>
            <a href="#auth">Autenticação</a>
          </li>
          {API_SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      {API_SECTIONS.map((section) => (
        <section key={section.id} className="api-docs-section" id={section.id}>
          <h2 className="api-docs-section-title">{section.title}</h2>
          <p className="api-docs-prefix">
            Prefixo: <code>{section.prefix}</code>
          </p>
          <div className="api-docs-endpoints">
            {section.endpoints.map((endpoint) => (
              <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
            ))}
          </div>
        </section>
      ))}

      <footer className="api-docs-footer">
        <p>
          Fonte canônica: <code>spec/backend/API.md</code> — atualize também{' '}
          <code>frontend/src/data/apiReference.ts</code> ao mudar o contrato.
        </p>
      </footer>
    </div>
  );
}
