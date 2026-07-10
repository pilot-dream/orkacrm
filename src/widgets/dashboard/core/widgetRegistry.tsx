import React from 'react';
import { 
  DollarSign, TrendingUp, Users, FolderKanban, Target, HeartPulse, 
  Bell, Lightbulb, PieChart, LineChart, BarChart, Calendar, 
  CheckSquare, Activity, Wallet, FileText, ArrowUpRight, ArrowDownRight, 
  Briefcase, Plus, TrendingDown, Clock, ShieldAlert, Sparkles, Filter,
  CheckCircle, Receipt, AlertTriangle, LayoutDashboard
} from 'lucide-react';

// Import existing components
import CashFlowChartWidget from '../components/CashFlowChartWidget';
import { MrrEvolutionChartWidget } from '../components/MrrEvolutionChartWidget';
import { RevenueForecastChartWidget } from '../components/RevenueForecastChartWidget';
import { FunnelWidget } from '../components/FunnelWidget';
import { FinanceSummaryWidget } from '../components/FinanceSummaryWidget';
import RevenueProductChartWidget from '../components/RevenueProductChartWidget';
import FunnelConversionChartWidget from '../components/FunnelConversionChartWidget';
import SectionHeaderWidget from '../components/SectionHeaderWidget';
import FinancialOverviewWidget, {
  MrrContratadoWidget,
  ReceitaRecebidaWidget,
  ReceitaPrevistaWidget,
  ReceitaAtrasadaWidget,
  DespesasPagasWidget,
  DespesasAPagarWidget,
  DespesasAtrasadasWidget,
  FluxoCaixaWidget
} from '../components/FinancialOverviewWidget';
import { TaskListWidget } from '../components/TaskListWidget';
import AgendaWidget from '../components/AgendaWidget';
import ActivityTimelineWidget from '../components/ActivityTimelineWidget';
import ContasReceberWidget from '../components/ContasReceberWidget';
import ContasPagarWidget from '../components/ContasPagarWidget';
import { 
  RevenueKpiWidget, 
  MrrKpiWidget, 
  ClientsKpiWidget, 
  ProjectsKpiWidget, 
  LeadsKpiWidget 
} from '../components/PremiumKpiWidgets';

// Import placeholder
import { PlaceholderWidget } from '../components/PlaceholderWidget';

export type WidgetCategory = 'KPIs' | 'Financeiro' | 'Clientes' | 'Comercial' | 'Projetos' | 'Produtividade' | 'Relatórios' | 'IA';

export type WidgetManifest = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: WidgetCategory;
  permissions?: string[];
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  component: React.ComponentType<any>;
  settingsSchema?: any;
  refreshInterval?: number;
  supportsFiltering?: boolean;
  supportsExport?: boolean;
  supportsFullscreen?: boolean;
  supportsDuplicate?: boolean;
  premiumOnly?: boolean;
  beta?: boolean;
};

// Helper to create placeholders easily
const createPlaceholder = (title: string) => (props: any) => <PlaceholderWidget title={title} {...props} />;

export const WIDGET_REGISTRY: Record<string, WidgetManifest> = {
  // --- Utilitários / Layout ---
  'SectionHeaderWidget': {
    id: 'SectionHeaderWidget', title: 'Título de Seção', description: 'Divisor visual com título.', category: 'KPIs',
    icon: <LayoutDashboard size={20} />, component: SectionHeaderWidget, defaultWidth: 12, defaultHeight: 1, minWidth: 2, minHeight: 1, supportsDuplicate: true
  },

  // --- KPIs ---
  'PremiumKpiRow_Revenue': {
    id: 'PremiumKpiRow_Revenue', title: 'Receita Líquida', description: 'KPI de Receita Líquida atual com tendência.', category: 'KPIs',
    icon: <DollarSign size={20} />, component: RevenueKpiWidget, defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2, supportsDuplicate: true
  },
  'PremiumKpiRow_MRR': {
    id: 'PremiumKpiRow_MRR', title: 'MRR', description: 'Receita Recorrente Mensal atual.', category: 'KPIs',
    icon: <TrendingUp size={20} />, component: MrrKpiWidget, defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_ARR': {
    id: 'Kpi_ARR', title: 'ARR', description: 'Receita Recorrente Anual.', category: 'KPIs',
    icon: <TrendingUp size={20} />, component: createPlaceholder('ARR'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_Lucro': {
    id: 'Kpi_Lucro', title: 'Lucro Líquido', description: 'Margem de lucro atual.', category: 'KPIs',
    icon: <Wallet size={20} />, component: createPlaceholder('Lucro Líquido'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'PremiumKpiRow_Health': {
    id: 'PremiumKpiRow_Health', title: 'Health Score', description: 'Saúde geral da base de clientes.', category: 'KPIs',
    icon: <HeartPulse size={20} />, component: createPlaceholder('Health Score'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_TicketMedio': {
    id: 'Kpi_TicketMedio', title: 'Ticket Médio', description: 'Valor médio por cliente.', category: 'KPIs',
    icon: <DollarSign size={20} />, component: createPlaceholder('Ticket Médio'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_Conversao': {
    id: 'Kpi_Conversao', title: 'Taxa de Conversão', description: 'Conversão média de vendas.', category: 'KPIs',
    icon: <Filter size={20} />, component: createPlaceholder('Taxa de Conversão'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_Churn': {
    id: 'Kpi_Churn', title: 'Churn Rate', description: 'Taxa de cancelamento.', category: 'KPIs',
    icon: <TrendingDown size={20} />, component: createPlaceholder('Churn Rate'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_CAC': {
    id: 'Kpi_CAC', title: 'CAC', description: 'Custo de Aquisição de Cliente.', category: 'KPIs',
    icon: <Users size={20} />, component: createPlaceholder('CAC'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'Kpi_LTV': {
    id: 'Kpi_LTV', title: 'LTV', description: 'Lifetime Value médio.', category: 'KPIs',
    icon: <LineChart size={20} />, component: createPlaceholder('LTV'), defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },

  // --- Financeiro ---
  'CashFlowChartWidget': {
    id: 'CashFlowChartWidget', title: 'Fluxo de Caixa', description: 'Gráfico de receitas e despesas.', category: 'Financeiro',
    icon: <LineChart size={20} />, component: CashFlowChartWidget, defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6, supportsFullscreen: true, supportsExport: true
  },
  'ContasReceberWidget': {
    id: 'ContasReceberWidget', title: 'Contas a Receber', description: 'Próximos recebimentos pendentes.', category: 'Financeiro',
    icon: <ArrowDownRight size={20} color="var(--color-success)" />, component: ContasReceberWidget, defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4, supportsFiltering: true
  },
  'ContasPagarWidget': {
    id: 'ContasPagarWidget', title: 'Contas a Pagar', description: 'Próximas despesas pendentes.', category: 'Financeiro',
    icon: <ArrowUpRight size={20} color="var(--color-danger)" />, component: ContasPagarWidget, defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4, supportsFiltering: true
  },
  'ReceitasWidget': {
    id: 'ReceitasWidget', title: 'Receitas Consolidadas', description: 'Receitas recebidas no período.', category: 'Financeiro',
    icon: <DollarSign size={20} />, component: createPlaceholder('Receitas Consolidadas'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'DespesasWidget': {
    id: 'DespesasWidget', title: 'Despesas Consolidadas', description: 'Despesas pagas no período.', category: 'Financeiro',
    icon: <Wallet size={20} />, component: createPlaceholder('Despesas Consolidadas'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'ReceitasAtrasoWidget': {
    id: 'ReceitasAtrasoWidget', title: 'Receitas em Atraso', description: 'Pagamentos vencidos de clientes.', category: 'Financeiro',
    icon: <ShieldAlert size={20} />, component: createPlaceholder('Receitas em Atraso'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'DespesasAtrasoWidget': {
    id: 'DespesasAtrasoWidget', title: 'Despesas em Atraso', description: 'Obrigações financeiras vencidas.', category: 'Financeiro',
    icon: <ShieldAlert size={20} />, component: createPlaceholder('Despesas em Atraso'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'UltimosPagamentosWidget': {
    id: 'UltimosPagamentosWidget', title: 'Últimos Pagamentos', description: 'Histórico recente de saídas.', category: 'Financeiro',
    icon: <Clock size={20} />, component: createPlaceholder('Últimos Pagamentos'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'UltimosRecebimentosWidget': {
    id: 'UltimosRecebimentosWidget', title: 'Últimos Recebimentos', description: 'Histórico recente de entradas.', category: 'Financeiro',
    icon: <Clock size={20} />, component: createPlaceholder('Últimos Recebimentos'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'ProjecaoFinanceiraWidget': {
    id: 'ProjecaoFinanceiraWidget', title: 'Projeção Financeira', description: 'Previsão de caixa futuro.', category: 'Financeiro',
    icon: <LineChart size={20} />, component: createPlaceholder('Projeção Financeira'), defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6, premiumOnly: true
  },
  'FinKpi_MrrContratado': {
    id: 'FinKpi_MrrContratado', title: 'KPI: MRR Contratado', description: 'Base de clientes ativos (MRR).', category: 'Financeiro',
    icon: <TrendingUp size={20} color="#C084FC" />, component: MrrContratadoWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_ReceitaRecebida': {
    id: 'FinKpi_ReceitaRecebida', title: 'KPI: Receita Recebida', description: 'Entradas liquidadas.', category: 'Financeiro',
    icon: <CheckCircle size={20} color="#10B981" />, component: ReceitaRecebidaWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_ReceitaPrevista': {
    id: 'FinKpi_ReceitaPrevista', title: 'KPI: A Receber (Pendente)', description: 'Setup e faturas em aberto.', category: 'Financeiro',
    icon: <Clock size={20} color="#60A5FA" />, component: ReceitaPrevistaWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_ReceitaAtrasada': {
    id: 'FinKpi_ReceitaAtrasada', title: 'KPI: Receita em Atraso', description: 'Vencidas e não recebidas.', category: 'Financeiro',
    icon: <ShieldAlert size={20} color="#F59E0B" />, component: ReceitaAtrasadaWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_DespesasPagas': {
    id: 'FinKpi_DespesasPagas', title: 'KPI: Despesas Pagas', description: 'Custos realizados liquidados.', category: 'Financeiro',
    icon: <Receipt size={20} color="#9CA3AF" />, component: DespesasPagasWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_DespesasAPagar': {
    id: 'FinKpi_DespesasAPagar', title: 'KPI: Despesas a Pagar', description: 'Contas pendentes.', category: 'Financeiro',
    icon: <FileText size={20} color="#FBBF24" />, component: DespesasAPagarWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_DespesasAtrasadas': {
    id: 'FinKpi_DespesasAtrasadas', title: 'KPI: Despesas Atrasadas', description: 'Contas vencidas.', category: 'Financeiro',
    icon: <AlertTriangle size={20} color="#EF4444" />, component: DespesasAtrasadasWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinKpi_FluxoCaixa': {
    id: 'FinKpi_FluxoCaixa', title: 'KPI: Saldo Realizado (NET)', description: 'Recebido menos Pago realizado.', category: 'Financeiro',
    icon: <DollarSign size={20} color="#34D399" />, component: FluxoCaixaWidget, defaultWidth: 3, defaultHeight: 2, minWidth: 2, minHeight: 2
  },
  'FinancialOverviewWidget': {
    id: 'FinancialOverviewWidget', title: 'Visão Financeira', description: 'Resumo detalhado de receitas e despesas.', category: 'Financeiro',
    icon: <PieChart size={20} />, component: FinancialOverviewWidget, defaultWidth: 12, defaultHeight: 5, minWidth: 6, minHeight: 4
  },
  'FinanceSummaryWidget': {
    id: 'FinanceSummaryWidget', title: 'Resumo Financeiro', description: 'Resumo de receitas, despesas e contas a pagar.', category: 'Financeiro',
    icon: <Wallet size={20} />, component: FinanceSummaryWidget, defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'RevenueForecastChartWidget': {
    id: 'RevenueForecastChartWidget', title: 'Previsão de Receita', description: 'Comparativo de receita prevista vs realizada.', category: 'Financeiro',
    icon: <TrendingUp size={20} />, component: RevenueForecastChartWidget, defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },

  // --- Clientes ---
  'PremiumKpiRow_Clients': {
    id: 'PremiumKpiRow_Clients', title: 'Clientes Ativos', description: 'Quantidade de clientes ativos na base.', category: 'Clientes',
    icon: <Users size={20} />, component: ClientsKpiWidget, defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'NovosClientesWidget': {
    id: 'NovosClientesWidget', title: 'Novos Clientes', description: 'Clientes adquiridos recentemente.', category: 'Clientes',
    icon: <Plus size={20} />, component: createPlaceholder('Novos Clientes'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'ClientesOnboardingWidget': {
    id: 'ClientesOnboardingWidget', title: 'Clientes em Onboarding', description: 'Clientes em fase de implantação.', category: 'Clientes',
    icon: <Briefcase size={20} />, component: createPlaceholder('Clientes em Onboarding'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'ClientesRiscoWidget': {
    id: 'ClientesRiscoWidget', title: 'Clientes em Risco', description: 'Clientes com Health Score baixo.', category: 'Clientes',
    icon: <ShieldAlert size={20} />, component: createPlaceholder('Clientes em Risco'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'ClientesSemInteracaoWidget': {
    id: 'ClientesSemInteracaoWidget', title: 'Clientes sem Interação', description: 'Clientes inativos há muito tempo.', category: 'Clientes',
    icon: <Clock size={20} />, component: createPlaceholder('Clientes sem Interação'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'ClientesSegmentoWidget': {
    id: 'ClientesSegmentoWidget', title: 'Clientes por Segmento', description: 'Distribuição da base por setor.', category: 'Clientes',
    icon: <PieChart size={20} />, component: createPlaceholder('Clientes por Segmento'), defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },

  // --- Comercial ---
  'PipelineWidget': {
    id: 'PipelineWidget', title: 'Pipeline de Vendas', description: 'Visão geral do funil de vendas.', category: 'Comercial',
    icon: <Target size={20} />, component: createPlaceholder('Pipeline de Vendas'), defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },
  'PremiumKpiRow_Leads': {
    id: 'PremiumKpiRow_Leads', title: 'Leads no Funil', description: 'Quantidade de leads sendo trabalhados.', category: 'Comercial',
    icon: <Target size={20} />, component: LeadsKpiWidget, defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'LeadsSemContatoWidget': {
    id: 'LeadsSemContatoWidget', title: 'Leads sem Contato', description: 'Oportunidades esfriando.', category: 'Comercial',
    icon: <Clock size={20} />, component: createPlaceholder('Leads sem Contato'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'FunnelConversionChartWidget': {
    id: 'FunnelConversionChartWidget', title: 'Conversão de Funil', description: 'Análise de conversão do funil de vendas.', category: 'Comercial',
    icon: <BarChart size={20} />, component: FunnelConversionChartWidget, defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },
  'FunnelWidget': {
    id: 'FunnelWidget', title: 'Funil de Vendas V3', description: 'Funil de vendas simplificado.', category: 'Comercial',
    icon: <Filter size={20} />, component: FunnelWidget, defaultWidth: 4, defaultHeight: 8, minWidth: 3, minHeight: 6
  },
  'OportunidadesWidget': {
    id: 'OportunidadesWidget', title: 'Oportunidades', description: 'Negócios quentes no pipeline.', category: 'Comercial',
    icon: <Briefcase size={20} />, component: createPlaceholder('Oportunidades'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'NegociosGanhosWidget': {
    id: 'NegociosGanhosWidget', title: 'Negócios Ganhos', description: 'Vendas fechadas recentemente.', category: 'Comercial',
    icon: <TrendingUp size={20} />, component: createPlaceholder('Negócios Ganhos'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'NegociosPerdidosWidget': {
    id: 'NegociosPerdidosWidget', title: 'Negócios Perdidos', description: 'Oportunidades perdidas (Loss).', category: 'Comercial',
    icon: <TrendingDown size={20} />, component: createPlaceholder('Negócios Perdidos'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'GoalProgressWidget': {
    id: 'GoalProgressWidget', title: 'Metas e Progresso', description: 'Acompanhamento de metas do mês.', category: 'Comercial',
    icon: <Target size={20} />, component: createPlaceholder('Metas e Progresso'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },

  // --- Projetos ---
  'PremiumKpiRow_Projects': {
    id: 'PremiumKpiRow_Projects', title: 'Projetos Ativos', description: 'Total de projetos em andamento.', category: 'Projetos',
    icon: <FolderKanban size={20} />, component: ProjectsKpiWidget, defaultWidth: 3, defaultHeight: 3, minWidth: 2, minHeight: 2
  },
  'ProjetosAtrasadosWidget': {
    id: 'ProjetosAtrasadosWidget', title: 'Projetos Atrasados', description: 'Projetos com prazos estourados.', category: 'Projetos',
    icon: <ShieldAlert size={20} />, component: createPlaceholder('Projetos Atrasados'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'CronogramaProjetosWidget': {
    id: 'CronogramaProjetosWidget', title: 'Cronograma', description: 'Gantt ou linha do tempo de projetos.', category: 'Projetos',
    icon: <Calendar size={20} />, component: createPlaceholder('Cronograma'), defaultWidth: 8, defaultHeight: 8, minWidth: 6, minHeight: 6
  },
  'ProximasEntregasWidget': {
    id: 'ProximasEntregasWidget', title: 'Próximas Entregas', description: 'Marcos e entregáveis próximos.', category: 'Projetos',
    icon: <Clock size={20} />, component: createPlaceholder('Próximas Entregas'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'HorasUtilizadasWidget': {
    id: 'HorasUtilizadasWidget', title: 'Horas Utilizadas', description: 'Apontamento de horas em projetos.', category: 'Projetos',
    icon: <Clock size={20} />, component: createPlaceholder('Horas Utilizadas'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'HorasRestantesWidget': {
    id: 'HorasRestantesWidget', title: 'Horas Restantes', description: 'Saldo de horas contratadas.', category: 'Projetos',
    icon: <PieChart size={20} />, component: createPlaceholder('Horas Restantes'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },

  // --- Produtividade ---
  'TaskListWidget': {
    id: 'TaskListWidget', title: 'Minhas Tarefas', description: 'Sua lista de tarefas pendentes.', category: 'Produtividade',
    icon: <CheckSquare size={20} />, component: TaskListWidget, defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4, supportsFiltering: true
  },
  'AgendaWidget': {
    id: 'AgendaWidget', title: 'Agenda', description: 'Seus próximos compromissos e prazos.', category: 'Produtividade',
    icon: <Calendar size={20} />, component: AgendaWidget, defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'CalendarioWidget': {
    id: 'CalendarioWidget', title: 'Calendário Mensal', description: 'Visão completa do mês.', category: 'Produtividade',
    icon: <Calendar size={20} />, component: createPlaceholder('Calendário'), defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },
  'ActivityTimelineWidget': {
    id: 'ActivityTimelineWidget', title: 'Atividades Recentes', description: 'Log de atividades do time.', category: 'Produtividade',
    icon: <Activity size={20} />, component: ActivityTimelineWidget, defaultWidth: 4, defaultHeight: 8, minWidth: 3, minHeight: 6
  },
  'ChecklistWidget': {
    id: 'ChecklistWidget', title: 'Checklist Rápido', description: 'Notas e itens rápidos.', category: 'Produtividade',
    icon: <CheckSquare size={20} />, component: createPlaceholder('Checklist Rápido'), defaultWidth: 3, defaultHeight: 5, minWidth: 2, minHeight: 3
  },
  'ProximasReunioesWidget': {
    id: 'ProximasReunioesWidget', title: 'Próximas Reuniões', description: 'Integração com Google Calendar/Teams.', category: 'Produtividade',
    icon: <Users size={20} />, component: createPlaceholder('Próximas Reuniões'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },

  // --- Relatórios ---
  'RevenueProductChartWidget': {
    id: 'RevenueProductChartWidget', title: 'Receita por Produto', description: 'Distribuição de receita por produto.', category: 'Relatórios',
    icon: <PieChart size={20} />, component: RevenueProductChartWidget, defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },
  'MrrEvolutionChartWidget': {
    id: 'MrrEvolutionChartWidget', title: 'Evolução de MRR', description: 'Gráfico de evolução da receita recorrente.', category: 'Relatórios',
    icon: <LineChart size={20} />, component: MrrEvolutionChartWidget, defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },
  'ReceitaPeridoWidget': {
    id: 'ReceitaPeridoWidget', title: 'Receita por Período', description: 'Comparativo de receitas no tempo.', category: 'Relatórios',
    icon: <BarChart size={20} />, component: createPlaceholder('Receita por Período'), defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },
  'EvolucaoClientesWidget': {
    id: 'EvolucaoClientesWidget', title: 'Evolução de Clientes', description: 'Crescimento da base de clientes.', category: 'Relatórios',
    icon: <LineChart size={20} />, component: createPlaceholder('Evolução de Clientes'), defaultWidth: 6, defaultHeight: 8, minWidth: 4, minHeight: 6
  },

  // --- IA ---
  'InsightsWidget': {
    id: 'InsightsWidget', title: 'IA Insights', description: 'Recomendações inteligentes da IA.', category: 'IA',
    icon: <Lightbulb size={20} />, component: createPlaceholder('IA Insights'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 3
  },
  'AlertsCenterWidget': {
    id: 'AlertsCenterWidget', title: 'Alertas Inteligentes', description: 'Últimas notificações críticas e anomalias.', category: 'IA',
    icon: <Bell size={20} />, component: createPlaceholder('Alertas Inteligentes'), defaultWidth: 4, defaultHeight: 6, minWidth: 3, minHeight: 4
  },
  'IaRecomendacoesWidget': {
    id: 'IaRecomendacoesWidget', title: 'Recomendações', description: 'Próximos passos sugeridos pela IA.', category: 'IA',
    icon: <Sparkles size={20} />, component: createPlaceholder('Recomendações IA'), defaultWidth: 4, defaultHeight: 4, minWidth: 3, minHeight: 3
  },
  'IaPrevisaoFinanceiraWidget': {
    id: 'IaPrevisaoFinanceiraWidget', title: 'Previsão Financeira IA', description: 'Algoritmo preditivo de caixa.', category: 'IA',
    icon: <TrendingUp size={20} />, component: createPlaceholder('Previsão Financeira IA'), defaultWidth: 4, defaultHeight: 4, minWidth: 3, minHeight: 3
  }
};
