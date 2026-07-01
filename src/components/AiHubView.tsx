import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal as TerminalIcon, 
  Cpu, 
  Check, 
  Play 
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  model: string;
  prompt: string;
  tokens: string;
}

export const AiHubView: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    { 
      id: 'fit', 
      name: 'Classificador de Leads ORKA', 
      model: 'Claude 3.5 Sonnet (Temp: 0.1)', 
      prompt: `Você é um Analista Comercial Inteligente da ORKA. Analise as mensagens recebidas de potenciais clientes e classifique-as.
Extraia:
1. Nome da empresa & Setor
2. Dores/Problemas
3. Orçamento estimado ou Fit Comercial (Score de 0 a 100)

Responda em formato JSON estruturado.`,
      tokens: '124 tokens'
    },
    { 
      id: 'autoresponder', 
      name: 'Autoresponder WhatsApp', 
      model: 'GPT-4o mini (Temp: 0.4)', 
      prompt: `Você é o assistente virtual da ORKA no WhatsApp. Seu objetivo é engajar leads qualificados de forma ágil.
Instruções:
- Seja extremamente cordial, assertivo e objetivo.
- Proponha agendar uma chamada demonstrativa usando o link calendly.com/orka/demonstracao.
- Nunca alucine datas ou valores sem autorização prévia.`,
      tokens: '88 tokens'
    }
  ]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>('fit');
  const [activePrompt, setActivePrompt] = useState<string>(agents[0].prompt);
  const [activeModel, setActiveModel] = useState<string>(agents[0].model);

  // Sandbox inputs
  const [sandboxInput, setSandboxInput] = useState('Olá! Somos uma fintech de crédito com 80 funcionários. Atualmente, perdemos muitos leads por demora de resposta no WhatsApp. Queremos integrar nosso Typeform ao CRM HubSpot e acionar uma IA para responder instantaneamente e qualificar os contatos. Faturamento anual de R$ 12M.');
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAgentChange = (id: string) => {
    setSelectedAgentId(id);
    const agent = agents.find(a => a.id === id);
    if (agent) {
      setActivePrompt(agent.prompt);
      setActiveModel(agent.model);
    }
  };

  const savePrompt = () => {
    setAgents(agents.map(a => 
      a.id === selectedAgentId ? { ...a, prompt: activePrompt, model: activeModel } : a
    ));
    alert('Prompt salvo e publicado com sucesso na API da ORKA!');
  };

  const runTestSandbox = () => {
    setIsLoading(true);
    setSandboxOutput('');
    
    // Simulate AI response delay
    setTimeout(() => {
      setIsLoading(false);
      if (selectedAgentId === 'fit') {
        setSandboxOutput(`{
  "lead_analysis": {
    "empresa": "Fintech de Crédito",
    "funcionarios": 80,
    "fit_comercial": 96,
    "dores_identificadas": [
      "Perda de leads devido a alta latência na resposta inicial do WhatsApp",
      "Necessidade de automação de fluxo de funil (Typeform -> CRM HubSpot)"
    ],
    "urgencia": "Alta",
    "proximo_passo_sugerido": "Disparar fluxo de agendamento automático para demonstração técnica do ORKA Brain."
  },
  "metadata": {
    "tokens_processados": 348,
    "custo_estimado_usd": 0.0012,
    "latencia_api_ms": 780
  }
}`);
      } else {
        setSandboxOutput(`"Olá! Entendo perfeitamente a urgência. Perder leads por demora de resposta é um gargalo comum que resolvemos com nossas automações de IA-First. 

Para ajudar você a integrar o Typeform ao HubSpot e implantar o autoresponder do WhatsApp com score de leads, sugiro fazermos uma conversa técnica rápida de 15 minutos. 

Escolha o melhor horário para você aqui: calendly.com/orka/demonstracao. Grande abraço!"`);
      }
    }, 1200);
  };

  return (
    <div className="content-wrapper animate-slide-up">
      <div className="ai-hub-grid">
        
        {/* Prompt Configurator Card */}
        <div className="card agent-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
              Configuração do Agente
            </h3>
            <span className="sidebar-tag" style={{ fontSize: '0.6rem' }}>Produção</span>
          </div>

          <div className="input-group">
            <span className="input-label">Selecione o Agente de Operação</span>
            <select 
              value={selectedAgentId} 
              onChange={(e) => handleAgentChange(e.target.value)}
              className="form-select"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">Modelo Fundacional & Parâmetros</span>
            <input 
              type="text"
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <span className="input-label">Prompt de Sistema (System Instructions)</span>
            <textarea
              className="prompt-editor"
              value={activePrompt}
              onChange={(e) => setActivePrompt(e.target.value)}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              Estimativa de tamanho: {activePrompt.length} caracteres ({Math.round(activePrompt.length / 4)} tokens)
            </span>
          </div>

          <div className="action-bar">
            <button className="outline-btn" onClick={() => handleAgentChange(selectedAgentId)}>
              Descartar
            </button>
            <button className="primary-btn" onClick={savePrompt}>
              <Check size={16} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Test Sandbox Card */}
        <div className="card agent-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TerminalIcon size={18} style={{ color: '#C084FC' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sandbox de Testes (Tempo Real)</h3>
          </div>

          <div className="input-group">
            <span className="input-label">Simular Mensagem de Entrada (User input)</span>
            <textarea
              className="form-input"
              style={{ minHeight: '100px', resize: 'none', fontFamily: 'inherit', fontSize: '0.8rem' }}
              value={sandboxInput}
              onChange={(e) => setSandboxInput(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="primary-btn" 
              style={{ backgroundColor: 'var(--color-purple)', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}
              onClick={runTestSandbox}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="status-dot" style={{ backgroundColor: '#fff', marginRight: '6px' }}></span>
                  <span>Executando Chamada...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Testar Agente</span>
                </>
              )}
            </button>
          </div>

          <div className="input-group" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <span className="input-label">Output da IA (JSON / Texto)</span>
            <div 
              style={{ 
                flexGrow: 1, 
                backgroundColor: '#05070a', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--border-radius-md)', 
                padding: '16px',
                fontFamily: 'ui-monospace, Consolas, monospace',
                fontSize: '0.75rem',
                color: '#C084FC',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                minHeight: '200px'
              }}
            >
              {sandboxOutput ? sandboxOutput : (
                <span style={{ color: 'var(--text-muted)' }}>
                  Aguardando execução... Clique em "Testar Agente" para rodar o input atual nas instruções do prompt.
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Optimization recommendations */}
      <div className="card ai-recommendation-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={20} style={{ color: '#C084FC' }} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem' }}>Feedback de Otimização Cognitiva</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
              Baseado nas últimas 500 execuções do WhatsApp Autoresponder: Leads qualificados com score &gt; 90 fecharam reuniões em 94% das vezes quando a resposta da IA continha links diretos. Recomenda-se manter o link do Calendly visível no topo das instruções.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
