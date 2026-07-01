import React, { useState, useEffect, useRef } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { supabaseAutomations } from '../lib/supabaseService';
import { 
  Play, 
  Trash2, 
  Plus, 
  Search, 
  Activity, 
  Terminal, 
  Settings, 
  Code, 
  Sparkles,
  Link,
  MessageSquare,
  Workflow
} from 'lucide-react';

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'Trigger' | 'AI' | 'Action' | 'Utility';
  label: string;
  x: number;
  y: number;
  config: { [key: string]: string };
}

export interface AutomationFlow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  runs: number;
  errorRate: number;
  active: boolean;
  nodes: WorkflowNode[];
}

export interface WebhookRegistry {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET';
  associatedFlow: string;
  status: 'Ativo' | 'Pausado';
  latency: string;
}

interface AppIntegration {
  id: string;
  name: string;
  category: string;
  status: 'Conectado' | 'Desconectado';
  description: string;
}

interface ExecutionLog {
  id: string;
  flowName: string;
  status: 'Sucesso' | 'Falha';
  time: string;
  duration: string;
  inputPayload: string;
  outputPayload: string;
}

// Initial Mock Datasets
export const initialFlows: AutomationFlow[] = [
  { 
    id: 'flow-1', 
    name: 'Qualificação Automática Typeform', 
    trigger: 'Novo lead no Typeform', 
    action: 'ORKA Brain -> WhatsApp Business', 
    runs: 1240, 
    errorRate: 0.1, 
    active: true,
    nodes: [
      { id: 'node-1', name: 'Webhook Typeform', type: 'Trigger', label: 'Gatilho Typeform', x: 50, y: 130, config: { endpoint: 'https://api.orka.ai/v1/webhooks/typeform', secret: 'tf_sec_489' } },
      { id: 'node-2', name: 'ORKA Brain AI', type: 'AI', label: 'Análise de Fit', x: 210, y: 130, config: { model: 'Claude 3.5 Sonnet', temperature: '0.1', prompt: 'Avalie se a empresa do lead possui faturamento > 1M...' } },
      { id: 'node-3', name: 'WhatsApp Business', type: 'Action', label: 'Resposta WhatsApp', x: 370, y: 130, config: { channel: 'WhatsApp Oficial Orka', template: 'Boas vindas Leads Qualificados' } }
    ]
  },
  { 
    id: 'flow-2', 
    name: 'Sincronizador HubSpot -> Slack', 
    trigger: 'Negócio fechado no HubSpot', 
    action: 'Notificar Slack com PDF do Contrato', 
    runs: 452, 
    errorRate: 0.0, 
    active: true,
    nodes: [
      { id: 'node-1', name: 'HubSpot Trigger', type: 'Trigger', label: 'Deal Closed CRM', x: 50, y: 130, config: { filter: 'Stage: Won', properties: 'dealname, amount, client' } },
      { id: 'node-2', name: 'PDF Contract Creator', type: 'Utility', label: 'Auto PDF Builder', x: 210, y: 130, config: { template: 'Orka Standard NDA', layout: 'Printable Letter' } },
      { id: 'node-3', name: 'Slack Channel', type: 'Action', label: 'Slack #vendas-feed', x: 370, y: 130, config: { channel: '#vendas-notif', messageType: 'Rich Attachment' } }
    ]
  },
  { 
    id: 'flow-3', 
    name: 'Stripe Billing Sync', 
    trigger: 'Pagamento efetuado Stripe', 
    action: 'Database Accounting Register', 
    runs: 890, 
    errorRate: 1.2, 
    active: true,
    nodes: [
      { id: 'node-1', name: 'Stripe Webhook', type: 'Trigger', label: 'charge.succeeded', x: 50, y: 130, config: { endpoint: 'https://api.orka.ai/v1/webhooks/stripe', event: 'payment_succeeded' } },
      { id: 'node-2', name: 'Accounting Categorizer', type: 'AI', label: 'Orka Revenue AI', x: 210, y: 130, config: { categoryMap: 'MRR / Implantação / Setup', autoTag: 'true' } },
      { id: 'node-3', name: 'SQL DB Register', type: 'Action', label: 'Add to Cash Flow', x: 370, y: 130, config: { table: 'receitas_financeiro', checkDuplicate: 'true' } }
    ]
  },
  { 
    id: 'flow-4', 
    name: 'Cron de Relatórios Semanais', 
    trigger: 'Toda segunda-feira 8:00', 
    action: 'E-mail com KPIs consolidados', 
    runs: 28, 
    errorRate: 3.5, 
    active: false,
    nodes: [
      { id: 'node-1', name: 'Cron Schedule', type: 'Trigger', label: 'Toda segunda 08:00', x: 50, y: 130, config: { pattern: '0 8 * * 1', timezone: 'America/Sao_Paulo' } },
      { id: 'node-2', name: 'Metrics Collector', type: 'Utility', label: 'Aggregate CRM & Finance', x: 210, y: 130, config: { period: 'Last 7 Days', format: 'JSON Dataset' } },
      { id: 'node-3', name: 'Email Dispatcher', type: 'Action', label: 'Mail Sócio Fundador', x: 370, y: 130, config: { recipient: 'socios@orka.ai', subject: 'Relatório Executivo Orka CRM' } }
    ]
  }
];

export const initialWebhooks: WebhookRegistry[] = [
  { id: 'wh-1', name: 'Webhook Entrada Typeform', url: 'https://api.orka.ai/v1/webhooks/typeform', method: 'POST', associatedFlow: 'Qualificação Automática Typeform', status: 'Ativo', latency: '124ms' },
  { id: 'wh-2', name: 'Webhook Faturamento Stripe', url: 'https://api.orka.ai/v1/webhooks/stripe', method: 'POST', associatedFlow: 'Stripe Billing Sync', status: 'Ativo', latency: '98ms' },
  { id: 'wh-3', name: 'Webhook Sincronização HubSpot', url: 'https://api.orka.ai/v1/webhooks/hubspot', method: 'POST', associatedFlow: 'Sincronizador HubSpot -> Slack', status: 'Ativo', latency: '145ms' },
  { id: 'wh-4', name: 'Custom Sandbox endpoint', url: 'https://api.orka.ai/v1/webhooks/sandbox', method: 'POST', associatedFlow: 'Nenhum', status: 'Pausado', latency: '-' },
];

const initialIntegrations: AppIntegration[] = [
  { id: 'app-1', name: 'HubSpot', category: 'Vendas / CRM', status: 'Conectado', description: 'Sincronize contatos, deals e anotações geradas por inteligência artificial.' },
  { id: 'app-2', name: 'Slack', category: 'Comunicação', status: 'Conectado', description: 'Notificações ricas em canais de equipe com logs e relatórios automáticos.' },
  { id: 'app-3', name: 'WhatsApp Business', category: 'Comunicação', status: 'Conectado', description: 'Responda e qualifique leads instantaneamente usando a API oficial.' },
  { id: 'app-4', name: 'Stripe', category: 'Financeiro', status: 'Conectado', description: 'Faturamento de assinaturas recorrentes e conciliação de chargebacks.' },
  { id: 'app-5', name: 'Typeform', category: 'Marketing', status: 'Conectado', description: 'Dispare rotinas de classificação de formulários preenchidos.' },
  { id: 'app-6', name: 'OpenAI API', category: 'Inteligência Artificial', status: 'Conectado', description: 'Orquestre modelos de linguagem GPT para automação operacional.' },
  { id: 'app-7', name: 'Google Cloud Platform', category: 'Infraestrutura', status: 'Desconectado', description: 'Armazene backups e logs em bancos de dados corporativos.' },
];

export const initialLogs: ExecutionLog[] = [
  { 
    id: 'exec-89512', 
    flowName: 'Qualificação Automática Typeform', 
    status: 'Sucesso', 
    time: '26/06 18:25:12', 
    duration: '1.42s',
    inputPayload: `{
  "lead": {
    "company": "Vercel Inc",
    "poc": "Guilherme Ramos",
    "budget": "R$ 60.000",
    "needs": "QA auto tests post-deploy"
  }
}`,
    outputPayload: `{
  "fit_analysis": {
    "fit_score": 96,
    "urgency": "High",
    "cognitive_tag": "Enterprise QA Scale"
  },
  "whatsapp_dispatch": {
    "status": "delivered",
    "message_id": "wa_msg_9812480"
  }
}`
  },
  { 
    id: 'exec-89490', 
    flowName: 'Stripe Billing Sync', 
    status: 'Sucesso', 
    time: '26/06 17:40:05', 
    duration: '0.85s',
    inputPayload: `{
  "stripe_event": "charge.succeeded",
  "amount": 1000000,
  "client": "Stripe Brasil",
  "receipt": "receipt_stripe_891"
}`,
    outputPayload: `{
  "accounting_action": "revenue_inserted",
  "cash_flow_row_id": "inc-2819",
  "sync_status": "synced"
}`
  },
  { 
    id: 'exec-89350', 
    flowName: 'Linear Bug Triager', 
    status: 'Falha', 
    time: '26/06 15:30:19', 
    duration: '2.10s',
    inputPayload: `{
  "error_log": {
    "severity": "CRITICAL",
    "stack_trace": "NullPointerException at AuthController.java:128"
  }
}`,
    outputPayload: `{
  "error": "LLM Inference Timeout after 2000ms",
  "action": "retry_queued"
}`
  }
];

export const AutomationsView: React.FC<{ isNewUser?: boolean; userEmail?: string }> = ({ userEmail }) => {
  const [activeTab, setActiveTab] = useState<'flows' | 'webhooks' | 'integrations' | 'logs'>('flows');
  
  // Data States
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRegistry[]>([]);
  const [integrations, setIntegrations] = useState<AppIntegration[]>(initialIntegrations);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const isLoadedRef = useRef(false);

  useEffect(() => {
    const loadAutomations = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const [dbFlows, dbWebhooks] = await Promise.all([
            supabaseAutomations.fetchFlows(),
            supabaseAutomations.fetchWebhooks()
          ]);

          setFlows(dbFlows);
          setWebhooks(dbWebhooks);
          const savedLogs = localStorage.getItem('orka_auto_logs');
          setLogs(savedLogs ? JSON.parse(savedLogs) : []);
        } else {
          const savedFlows = localStorage.getItem('orka_auto_flows');
          const savedWebhooks = localStorage.getItem('orka_auto_webhooks');
          const savedLogs = localStorage.getItem('orka_auto_logs');

          setFlows(savedFlows ? JSON.parse(savedFlows) : []);
          setWebhooks(savedWebhooks ? JSON.parse(savedWebhooks) : []);
          setLogs(savedLogs ? JSON.parse(savedLogs) : []);
        }
        isLoadedRef.current = true;
      }
    };
    loadAutomations();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && isLoadedRef.current && !isSupabaseActive()) {
      localStorage.setItem('orka_auto_flows', JSON.stringify(flows));
      localStorage.setItem('orka_auto_webhooks', JSON.stringify(webhooks));
      localStorage.setItem('orka_auto_logs', JSON.stringify(logs));
    }
  }, [flows, webhooks, logs, userEmail]);

  // Flow Edit Canvas State
  const [selectedFlowId, setSelectedFlowId] = useState<string>('flow-1');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-2');
  
  // Run manually animation state
  const [runningNodeIndex, setRunningNodeIndex] = useState<number | null>(null);
  const [activeFlowLine, setActiveFlowLine] = useState<number | null>(null);
  const [manualLogs, setManualLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Search queries
  const [flowSearch, setFlowSearch] = useState('');
  const [webhookSearch, setWebhookSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Modals States
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create Flow Form
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowTrigger, setNewFlowTrigger] = useState('Novo lead no Typeform');
  const [newFlowAction, setNewFlowAction] = useState('ORKA Brain -> Slack Channel');

  // Create Webhook Form
  const [newWhName, setNewWhName] = useState('');
  const [newWhUrl, setNewWhUrl] = useState('');
  const [newWhMethod, setNewWhMethod] = useState<'POST' | 'GET'>('POST');
  const [newWhFlow, setNewWhFlow] = useState('Nenhum');

  // Selected flow for visual canvas
  const currentFlow = flows.find(f => f.id === selectedFlowId) || flows[0];
  const selectedNode = currentFlow?.nodes.find(n => n.id === selectedNodeId);

  // Auto scroll manual execution console logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [manualLogs]);

  // Execute manual workflow step-by-step
  const handleRunManualFlow = () => {
    if (runningNodeIndex !== null) return;
    setManualLogs([]);
    
    // Step 1: Webhook Trigger Node Active
    setRunningNodeIndex(0);
    setManualLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] 🔌 DISPARADOR: Iniciando execução manual do fluxo "${currentFlow.name}"...`]);
    setTimeout(() => {
      setManualLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] 📥 RECEBIDO: Gatilho "${currentFlow.nodes[0].name}" interceptado com sucesso.`]);
      
      // Step 2: Connection 1 active
      setRunningNodeIndex(null);
      setActiveFlowLine(1);
    }, 1000);

    // Step 3: Node 2 (AI Node) Active
    setTimeout(() => {
      setActiveFlowLine(null);
      setRunningNodeIndex(1);
      setManualLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] 🤖 COGNITIVO: Enviando payload para modelo ${currentFlow.nodes[1].config.model || 'LLM Default'}...`]);
      setManualLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] 🤖 COGNITIVO: Prompt System Instructions aplicado. Analisando fit operacional.`]);
    }, 2000);

    // Step 4: Connection 2 active
    setTimeout(() => {
      setRunningNodeIndex(null);
      setActiveFlowLine(2);
    }, 3200);

    // Step 5: Node 3 (Action Node) Active
    setTimeout(() => {
      setActiveFlowLine(null);
      setRunningNodeIndex(2);
      setManualLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ⚡ DISPARO: Acionando ação externa em "${currentFlow.nodes[2].name}"...`]);
    }, 4200);

    // Step 6: Complete
    setTimeout(() => {
      setRunningNodeIndex(null);
      setManualLogs(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ✅ SUCESSO: Execução concluída. Tempo total de execução: 4.8s. Logs consolidados.`]);
      
      // Update execution counters on the flows
      let updated: AutomationFlow | null = null;
      setFlows(prevFlows => {
        const next = prevFlows.map(f => {
          if (f.id === currentFlow.id) {
            updated = {
              ...f,
              runs: f.runs + 1
            };
            return updated;
          }
          return f;
        });

        if (updated && isSupabaseActive()) {
          supabaseAutomations.updateFlow(updated);
        }
        return next;
      });

      // Add a record in log history
      const newExecutionLog: ExecutionLog = {
        id: `exec-${Math.random().toString().substring(2, 7)}`,
        flowName: currentFlow.name,
        status: 'Sucesso',
        time: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        duration: '1.24s',
        inputPayload: JSON.stringify({ event: "manual_trigger", flow: currentFlow.name, user: "Orka Admin" }, null, 2),
        outputPayload: JSON.stringify({ status: "success", nodes_executed: currentFlow.nodes.map(n => n.name) }, null, 2)
      };

      setLogs([newExecutionLog, ...logs]);
    }, 5500);
  };

  const handleCreateFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName) return;

    const newFlow: AutomationFlow = {
      id: `flow-${Math.random().toString().substring(2, 7)}`,
      name: newFlowName,
      trigger: newFlowTrigger,
      action: newFlowAction,
      runs: 0,
      errorRate: 0.0,
      active: true,
      nodes: [
        { id: 'node-1', name: newFlowTrigger, type: 'Trigger', label: 'Gatilho Entrada', x: 50, y: 130, config: { info: 'Gatilho Inicial' } },
        { id: 'node-2', name: 'ORKA Brain AI Node', type: 'AI', label: 'Cognitive Engine', x: 210, y: 130, config: { model: 'Claude 3.5 Sonnet', temperature: '0.3' } },
        { id: 'node-3', name: newFlowAction.split(' -> ')[1] || newFlowAction, type: 'Action', label: 'Destino Ação', x: 370, y: 130, config: { target: 'API Endpoint' } }
      ]
    };

    setFlows([newFlow, ...flows]);
    if (isSupabaseActive()) {
      supabaseAutomations.insertFlow(newFlow);
    }
    setSelectedFlowId(newFlow.id);
    setIsFlowModalOpen(false);
    setNewFlowName('');
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName || !newWhUrl) return;

    const newWh: WebhookRegistry = {
      id: `wh-${Math.random().toString().substring(2, 7)}`,
      name: newWhName,
      url: newWhUrl,
      method: newWhMethod,
      associatedFlow: newWhFlow,
      status: 'Ativo',
      latency: '110ms'
    };

    setWebhooks([newWh, ...webhooks]);
    if (isSupabaseActive()) {
      supabaseAutomations.insertWebhook(newWh);
    }
    setIsWebhookModalOpen(false);
    setNewWhName('');
    setNewWhUrl('');
    setNewWhMethod('POST');
    setNewWhFlow('Nenhum');
  };

  const toggleFlowActive = (id: string) => {
    let updated: AutomationFlow | null = null;
    const nextFlows = flows.map(f => {
      if (f.id === id) {
        updated = { ...f, active: !f.active };
        return updated;
      }
      return f;
    });
    setFlows(nextFlows);
    if (updated && isSupabaseActive()) {
      supabaseAutomations.updateFlow(updated);
    }
  };

  const handleUpdateNodeConfig = (key: string, value: string) => {
    if (!selectedNodeId) return;
    let updated: AutomationFlow | null = null;
    const nextFlows = flows.map(f => {
      if (f.id === selectedFlowId) {
        updated = {
          ...f,
          nodes: f.nodes.map(n => {
            if (n.id === selectedNodeId) {
              return {
                ...n,
                config: {
                  ...n.config,
                  [key]: value
                }
              };
            }
            return n;
          })
        };
        return updated;
      }
      return f;
    });
    setFlows(nextFlows);
    if (updated && isSupabaseActive()) {
      supabaseAutomations.updateFlow(updated);
    }
  };

  // Render Sub Views
  const renderSubView = () => {
    switch (activeTab) {
      case 'flows':
        const filteredFlows = flows.filter(f => f.name.toLowerCase().includes(flowSearch.toLowerCase()));
        return (
          <div className="automations-layout-grid" style={{ marginTop: '16px' }}>
            
            {/* Flows Left Panel List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="search-box" style={{ flexGrow: 1 }}>
                  <Search size={16} className="text-secondary" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar fluxos..." 
                    className="search-input"
                    value={flowSearch}
                    onChange={(e) => setFlowSearch(e.target.value)}
                  />
                </div>
                <button className="primary-btn" style={{ padding: '8px 12px' }} onClick={() => setIsFlowModalOpen(true)}>
                  <Plus size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
                {filteredFlows.map(f => (
                  <div 
                    key={f.id} 
                    className={`card automation-card ${selectedFlowId === f.id ? 'active-row' : ''}`}
                    style={{ cursor: 'pointer', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderColor: selectedFlowId === f.id ? 'var(--color-primary)' : 'var(--border-color)' }}
                    onClick={() => {
                      setSelectedFlowId(f.id);
                      setSelectedNodeId('node-2'); // default edit node
                      setManualLogs([]);
                      setRunningNodeIndex(null);
                      setActiveFlowLine(null);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.85rem' }}>{f.name}</h4>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{f.trigger}</span>
                      </div>
                      
                      <div 
                        className={`automation-switch ${f.active ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlowActive(f.id);
                        }}
                      ></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                      <span>Execuções: <b>{f.runs}</b></span>
                      <span>Erros: <b style={{ color: f.errorRate > 2 ? 'var(--color-danger)' : 'inherit' }}>{f.errorRate}%</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flows Right Panel - Visual Canvas n8n-style */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!currentFlow ? (
                <div className="card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', minHeight: '400px', textAlign: 'center' }}>
                  <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: 'var(--color-primary)' }}>
                    <Workflow size={48} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nenhum fluxo de automação ativo</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: '8px auto 0' }}>
                      Crie o seu primeiro fluxo cognitivo para disparar alertas no Slack, enviar mensagens ativas no WhatsApp e integrar logs operacionais.
                    </p>
                  </div>
                  <button className="primary-btn" onClick={() => setIsFlowModalOpen(true)}>
                    <Plus size={16} />
                    <span>Criar Primeiro Fluxo</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="card" style={{ padding: '20px', position: 'relative' }}>
                
                {/* Canvas toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Editor Visual n8n: {currentFlow.name}</h3>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Clique em um nó para configurar seus parâmetros de chamada.</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="primary-btn" 
                      style={{ padding: '8px 14px', fontSize: '0.75rem', display: 'flex', gap: '6px', backgroundColor: 'var(--color-success)', color: '#fff' }}
                      disabled={runningNodeIndex !== null}
                      onClick={handleRunManualFlow}
                    >
                      <Play size={12} fill="currentColor" />
                      <span>Executar Manualmente</span>
                    </button>
                    
                    <button 
                      className="outline-btn"
                      style={{ padding: '8px 10px' }}
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Settings size={14} />
                    </button>
                    
                    <button 
                      className="icon-btn" 
                      style={{ color: 'var(--color-danger)', border: 'none', background: 'none' }}
                      onClick={() => {
                        if (flows.length > 1) {
                          setFlows(flows.filter(f => f.id !== selectedFlowId));
                          setSelectedFlowId(flows[0].id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* n8n canvas dot grid workboard */}
                <div className="n8n-canvas">
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
                    {/* SVG Connections between Node 1 (Trigger) -> Node 2 (AI) -> Node 3 (Action) */}
                    <path 
                      d="M 170 162 C 190 162, 190 162, 210 162" 
                      className={`n8n-connection-line ${activeFlowLine === 1 ? 'active' : ''}`}
                    />
                    <path 
                      d="M 330 162 C 350 162, 350 162, 370 162" 
                      className={`n8n-connection-line ${activeFlowLine === 2 ? 'active' : ''}`}
                    />
                  </svg>

                  {/* Render Visual Nodes */}
                  {currentFlow.nodes.map((node, idx) => {
                    const isProcessing = runningNodeIndex === idx;
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <div 
                        key={node.id} 
                        className={`n8n-node ${isProcessing ? 'active-processing' : ''} ${isSelected ? 'active-row' : ''}`}
                        style={{ left: `${node.x}px`, top: `${node.y}px` }}
                        onClick={() => setSelectedNodeId(node.id)}
                      >
                        <div className="n8n-node-icon" style={{ 
                          backgroundColor: node.type === 'Trigger' ? 'rgba(45, 140, 255, 0.12)' : 
                                          node.type === 'AI' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: node.type === 'Trigger' ? 'var(--color-primary)' : 
                                 node.type === 'AI' ? 'var(--color-purple)' : 'var(--color-success)'
                        }}>
                          {node.type === 'Trigger' ? <Link size={16} /> : 
                           node.type === 'AI' ? <Sparkles size={16} /> : <MessageSquare size={16} />}
                        </div>
                        <span className="n8n-node-title">{node.name}</span>
                        <span className="n8n-node-label">{node.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Node Config / Terminal execution log drawer Row */}
              <div className="automations-split-grid">
                {/* Node parameters */}
                <div className="card" style={{ padding: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <Settings size={14} className="text-secondary" />
                    <span>Configuração: {selectedNode?.name || 'Selecione um nó'}</span>
                  </h4>
                  
                  {selectedNode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      {Object.keys(selectedNode.config).map(key => (
                        <div className="input-group" key={key}>
                          <span className="input-label" style={{ textTransform: 'capitalize' }}>{key}</span>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={selectedNode.config[key]} 
                            onChange={(e) => handleUpdateNodeConfig(key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Selecione um nó no canvas para configurar seus parâmetros.</span>
                  )}
                </div>

                {/* Console Log output */}
                <div className="card console-card" style={{ minHeight: '220px', margin: 0 }}>
                  <div className="console-header" style={{ padding: '8px 12px' }}>
                    <div className="console-title" style={{ fontSize: '0.78rem' }}>
                      <Terminal size={14} />
                      <span>Console de Execução</span>
                    </div>
                  </div>
                  <div className="console-body" style={{ minHeight: '170px', padding: '12px', fontSize: '0.7rem' }}>
                    {manualLogs.map((ml, idx) => (
                      <div key={idx} className="console-line" style={{ marginBottom: '6px' }}>
                        <span className="console-text info" style={{ color: ml.includes('✅') ? 'var(--color-success)' : ml.includes('🔌') ? 'var(--color-primary)' : ml.includes('🤖') ? '#C084FC' : 'var(--text-main)' }}>
                          {ml}
                        </span>
                      </div>
                    ))}
                    {manualLogs.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
                        Aguardando disparo manual... Clique em "Executar" para iniciar o rastreador de fluxo.
                      </div>
                    )}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
          </div>
        );

      case 'webhooks':
        const filteredWh = webhooks.filter(wh => wh.name.toLowerCase().includes(webhookSearch.toLowerCase()) || wh.url.toLowerCase().includes(webhookSearch.toLowerCase()));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Endpoints Webhooks Recebidos</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>URLs de chamada externa seguras geradas automaticamente pela inteligência da ORKA.</p>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="search-box" style={{ width: '250px' }}>
                  <Search size={16} className="text-secondary" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar webhooks..." 
                    className="search-input"
                    value={webhookSearch}
                    onChange={(e) => setWebhookSearch(e.target.value)}
                  />
                </div>
                <button className="primary-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => setIsWebhookModalOpen(true)}>
                  <Plus size={14} />
                  <span>Cadastrar Webhook</span>
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Nome do Endpoint</th>
                    <th>URL Recetora</th>
                    <th>Método</th>
                    <th>Automação Associada</th>
                    <th>Latência Média</th>
                    <th>Status</th>
                    <th style={{ width: '100px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWh.map(wh => (
                    <tr key={wh.id}>
                      <td style={{ fontWeight: 600 }}>{wh.name}</td>
                      <td>
                        <code style={{ fontSize: '0.75rem', backgroundColor: '#05070a', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--color-primary)' }}>
                          {wh.url}
                        </code>
                      </td>
                      <td style={{ fontWeight: 700 }}>{wh.method}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{wh.associatedFlow}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{wh.latency}</td>
                      <td>
                        <span className={`badge ${wh.status === 'Ativo' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          {wh.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {wh.status === 'Ativo' ? (
                            <button 
                              className="outline-btn" 
                              style={{ padding: '4px 6px', fontSize: '0.65rem' }}
                              onClick={() => setWebhooks(webhooks.map(w => w.id === wh.id ? { ...w, status: 'Pausado' } : w))}
                            >
                              Pausar
                            </button>
                          ) : (
                            <button 
                              className="outline-btn" 
                              style={{ padding: '4px 6px', fontSize: '0.65rem', color: 'var(--color-success)' }}
                              onClick={() => setWebhooks(webhooks.map(w => w.id === wh.id ? { ...w, status: 'Ativo' } : w))}
                            >
                              Ativar
                            </button>
                          )}
                          <button 
                            className="icon-btn" 
                            style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                            onClick={() => setWebhooks(webhooks.filter(w => w.id !== wh.id))}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Central de Conexões & Integrações</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Conecte sua infraestrutura de software e CRM diretamente ao Orquestrador ORKA Brain.</p>
            </div>

            <div className="automations-grid">
              {integrations.map(app => (
                <div key={app.id} className="card automation-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="customer-logo-abbr" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', fontWeight: 800 }}>
                        {app.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.88rem' }}>{app.name}</h4>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{app.category}</span>
                      </div>
                    </div>

                    <span className={`badge ${app.status === 'Conectado' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                      {app.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.4', minHeight: '38px' }}>
                    {app.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', marginTop: '4px' }}>
                    <button 
                      className={`outline-btn ${app.status === 'Conectado' ? '' : 'active'}`}
                      style={{ fontSize: '0.72rem', padding: '6px 12px', borderColor: app.status === 'Conectado' ? 'var(--border-color)' : 'var(--color-primary)', color: app.status === 'Conectado' ? 'var(--text-secondary)' : 'var(--color-primary)' }}
                      onClick={() => {
                        setIntegrations(integrations.map(i => i.id === app.id ? { ...i, status: i.status === 'Conectado' ? 'Desconectado' : 'Conectado' } : i));
                      }}
                    >
                      {app.status === 'Conectado' ? 'Desconectar App' : 'Autenticar Conexão'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'logs':
        const filteredLogs = logs.filter(l => l.flowName.toLowerCase().includes(logSearch.toLowerCase()) || l.id.toLowerCase().includes(logSearch.toLowerCase()));
        return (
          <div className="automations-exec-grid" style={{ marginTop: '16px' }}>
            
            {/* Logs List Left Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="search-box">
                <Search size={16} className="text-secondary" />
                <input 
                  type="text" 
                  placeholder="Pesquisar logs por fluxo ou ID..." 
                  className="search-input"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
                {filteredLogs.map(l => (
                  <div 
                    key={l.id} 
                    className="card"
                    style={{ padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-color)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{l.id}</span>
                      <span className={`badge ${l.status === 'Sucesso' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                        {l.status}
                      </span>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}>{l.flowName}</h4>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                        <span>⏱️ {l.duration}</span>
                        <span>📅 {l.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log Details Right Panel Console View */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card console-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '480px' }}>
                <div className="console-header" style={{ padding: '12px 16px' }}>
                  <div className="console-title">
                    <Code size={16} className="text-secondary" />
                    <span>Payload Inspector (Telemetria Detalhada)</span>
                  </div>
                </div>

                <div className="console-body" style={{ flexGrow: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minHeight: '400px' }}>
                  
                  {logs.length > 0 ? (
                    <>
                      <div>
                        <span className="input-label" style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Trigger Input Payload (JSON)</span>
                        <pre style={{ backgroundColor: '#05070a', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', color: '#10B981', fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                          {logs[0].inputPayload}
                        </pre>
                      </div>

                      <div>
                        <span className="input-label" style={{ color: 'var(--color-purple)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>Action Response Output Payload (JSON)</span>
                        <pre style={{ backgroundColor: '#05070a', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '12px', color: '#C084FC', fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                          {logs[0].outputPayload}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                      Selecione um log para inspecionar os payloads de telemetria.
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        );
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top tab headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['flows', 'webhooks', 'integrations', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              className={`outline-btn ${activeTab === tab ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '8px 16px', borderRadius: '20px' }}
              onClick={() => {
                setActiveTab(tab);
                setFlowSearch('');
                setWebhookSearch('');
                setLogSearch('');
              }}
            >
              {tab === 'flows' ? 'Visual n8n Workflows' : 
               tab === 'webhooks' ? 'Configuração Webhooks' :
               tab === 'integrations' ? 'Aplicativos Conectados' : 'Logs de Telemetria'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <Activity size={12} className="text-secondary" style={{ color: 'var(--color-success)' }} />
          <span>Status: Orquestrador Ativo</span>
        </div>
      </div>

      {/* Render selected view */}
      {renderSubView()}

      {/* CREATE FLOW MODAL */}
      {isFlowModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Criar Novo Fluxo Automático</h3>
            <form onSubmit={handleCreateFlow} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome da Automação</span>
                <input 
                  type="text" 
                  placeholder="Ex: Sync Stripe to Slack" 
                  className="form-input"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Gatilho Principal (Trigger Node)</span>
                <select 
                  className="form-select"
                  value={newFlowTrigger}
                  onChange={(e) => setNewFlowTrigger(e.target.value)}
                >
                  <option value="Novo lead no Typeform">Typeform Webhook (Novo Lead)</option>
                  <option value="Negócio fechado no HubSpot">HubSpot CRM (Negócio Fechado)</option>
                  <option value="Pagamento efetuado Stripe">Stripe Webhook (Pagamento Aprovado)</option>
                  <option value="Toda segunda-feira 8:00">Cron Schedule (Relatórios Semanais)</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Destino Ação (Action Node)</span>
                <select 
                  className="form-select"
                  value={newFlowAction}
                  onChange={(e) => setNewFlowAction(e.target.value)}
                >
                  <option value="ORKA Brain -> WhatsApp Business">WhatsApp (Envio de Mensagem IA)</option>
                  <option value="ORKA Brain -> Slack Channel">Slack Channel (Notificação de Alerta)</option>
                  <option value="Database Accounting Register">SQL Database (Salvar Registro)</option>
                  <option value="Email Dispatcher">Email Send (SMTP Dispatch)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsFlowModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Criar Automação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLOW DETAILS MODAL */}
      {isEditModalOpen && currentFlow && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Configurar Fluxo: {currentFlow.name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Fluxo</span>
                <input 
                  type="text" 
                  className="form-input"
                  value={currentFlow.name}
                  onChange={(e) => {
                    setFlows(flows.map(f => f.id === currentFlow.id ? { ...f, name: e.target.value } : f));
                  }}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Gatilho (Trigger)</span>
                <input 
                  type="text" 
                  className="form-input"
                  value={currentFlow.trigger}
                  onChange={(e) => {
                    setFlows(flows.map(f => f.id === currentFlow.id ? { ...f, trigger: e.target.value } : f));
                  }}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Integração Ação</span>
                <input 
                  type="text" 
                  className="form-input"
                  value={currentFlow.action}
                  onChange={(e) => {
                    setFlows(flows.map(f => f.id === currentFlow.id ? { ...f, action: e.target.value } : f));
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button className="primary-btn" onClick={() => setIsEditModalOpen(false)}>Concluir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WEBHOOK MODAL */}
      {isWebhookModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cadastrar Novo Webhook Endpoint</h3>
            <form onSubmit={handleCreateWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Identificador</span>
                <input 
                  type="text" 
                  placeholder="Ex: Webhook Stripe Produção" 
                  className="form-input"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Webhook URL</span>
                <input 
                  type="text" 
                  placeholder="https://api.orka.ai/v1/webhooks/..." 
                  className="form-input"
                  value={newWhUrl}
                  onChange={(e) => setNewWhUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Método HTTP</span>
                  <select 
                    className="form-select"
                    value={newWhMethod}
                    onChange={(e) => setNewWhMethod(e.target.value as WebhookRegistry['method'])}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-label">Automação Associada</span>
                  <select 
                    className="form-select"
                    value={newWhFlow}
                    onChange={(e) => setNewWhFlow(e.target.value)}
                  >
                    <option value="Nenhum">Nenhum (Sandbox)</option>
                    {flows.map(f => (
                      <option key={f.id} value={f.name}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsWebhookModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Cadastrar Webhook</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
