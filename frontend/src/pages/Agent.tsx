import React, { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { AgentPendingAction } from '../types';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

interface AgentProps {
  embedded?: boolean;
}

function Agent({ embedded = false }: AgentProps) {
  const api = useApi();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Sou seu assistente financeiro. Me diga um comando como "gastei 45 no mercado hoje" ou "resumo do mês".',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentPendingAction | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: content }]);
    setInput('');

    try {
      const response = await api.agent.chat(content, pendingAction);
      setPendingAction(response.pendingAction ?? null);

      let assistantText = response.message;
      if (response.pendencias.length > 0) {
        assistantText += `\n\nPendências:\n- ${response.pendencias.join('\n- ')}`;
      }
      if (response.options && response.options.length > 0) {
        assistantText += `\n\nOpções encontradas:\n- ${response.options.map((opt) => `${opt.id}: ${opt.label}`).join('\n- ')}`;
      }

      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: assistantText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `a-err-${Date.now()}`, role: 'assistant', text: 'Não consegui processar sua solicitação agora. Tente novamente.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {!embedded && (
        <header className="page-header">
          <h1 className="page-title">Agente IA</h1>
          <p className="page-subtitle">Converse para lançar ganhos, gastos, editar ou remover movimentações.</p>
        </header>
      )}

      <div className={`card agent-chat-container ${embedded ? 'agent-chat-container-modal' : ''}`}>
        <div className="agent-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`agent-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              <pre>{msg.text}</pre>
            </div>
          ))}
        </div>

        <div className="agent-chat-input">
          <input
            className="form-input"
            placeholder="Ex.: gastei 79,90 em alimentação hoje"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
          />
          <button className="btn btn-primary" disabled={!canSend} onClick={handleSend}>
            {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Agent;
