import React, { useState, useEffect, useRef } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { 
  supabaseTransactions,
  supabaseProposals,
  supabaseContracts,
  supabasePayments
} from '../lib/supabaseService';
import { 
  Plus, 
  FileText, 
  Download, 
  Check, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Clock, 
  CreditCard, 
  Search, 
  Trash2,
  FileCheck,
  CheckCircle,
  User,
  Building,
  Activity,
  Layers
} from 'lucide-react';

export interface Receita {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  receivedDate: string | null;
  category: 'Assinatura' | 'Consultoria' | 'Setup' | 'Outros';
  status: 'Recebido' | 'Pendente';
  client: string;
}

export interface Despesa {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  paymentDate: string | null;
  category: 'Infraestrutura' | 'Marketing' | 'Salários' | 'Impostos' | 'Serviços' | 'Outros';
  status: 'Pago' | 'Pendente';
  supplier: string;
}

export interface Proposal {
  id: string;
  title: string;
  client: string;
  value: number;
  date: string;
  validUntil: string;
  status: 'Enviada' | 'Aceita' | 'Recusada' | 'Rascunho';
}

export interface Contract {
  id: string;
  title: string;
  client: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'Ativo' | 'Suspenso' | 'Finalizado';
}

export interface Payment {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  paymentDate: string | null;
  method: 'Pix' | 'Boleto' | 'Cartão' | 'Transferência';
  status: 'Pago' | 'Pendente' | 'Atrasado';
  client: string;
}

// Initial Mock Data
export const initialIncomes: Receita[] = [
  { id: 'inc-1', description: 'Setup Orquestração Comercial IA', value: 45000, dueDate: '15/06/2026', receivedDate: '15/06/2026', category: 'Setup', status: 'Recebido', client: 'Stripe Brasil' },
  { id: 'inc-2', description: 'Faturamento MRR Junho', value: 10000, dueDate: '20/06/2026', receivedDate: '20/06/2026', category: 'Assinatura', status: 'Recebido', client: 'Stripe Brasil' },
  { id: 'inc-3', description: 'Faturamento MRR Junho', value: 12000, dueDate: '10/06/2026', receivedDate: '10/06/2026', category: 'Assinatura', status: 'Recebido', client: 'Vercel Inc' },
  { id: 'inc-4', description: 'Faturamento MRR Junho', value: 7500, dueDate: '10/06/2026', receivedDate: '10/06/2026', category: 'Assinatura', status: 'Recebido', client: 'Linear Co' },
  { id: 'inc-5', description: 'Consultoria de Escopo IA', value: 15000, dueDate: '22/06/2026', receivedDate: null, category: 'Consultoria', status: 'Pendente', client: 'Notion Space' },
  { id: 'inc-6', description: 'Contrato Setup Inicial', value: 80000, dueDate: '03/07/2026', receivedDate: null, category: 'Setup', status: 'Pendente', client: 'HypeTech Corp' },
];

export const initialExpenses: Despesa[] = [
  { id: 'exp-1', description: 'Hospedagem & DB Cluster AWS', value: 14500, dueDate: '05/06/2026', paymentDate: '05/06/2026', category: 'Infraestrutura', status: 'Pago', supplier: 'Amazon Web Services' },
  { id: 'exp-2', description: 'Créditos API Modelos LLM', value: 8900, dueDate: '10/06/2026', paymentDate: '10/06/2026', category: 'Infraestrutura', status: 'Pago', supplier: 'OpenAI Inc' },
  { id: 'exp-3', description: 'Assinatura Google Workspace', value: 1200, dueDate: '12/06/2026', paymentDate: '12/06/2026', category: 'Serviços', status: 'Pago', supplier: 'Google Cloud Brasil' },
  { id: 'exp-4', description: 'Plano Vercel Enterprise Team', value: 800, dueDate: '15/06/2026', paymentDate: '15/06/2026', category: 'Infraestrutura', status: 'Pago', supplier: 'Vercel Inc' },
  { id: 'exp-5', description: 'Tráfego Campanha Lead Gen Q2', value: 5000, dueDate: '20/06/2026', paymentDate: '20/06/2026', category: 'Marketing', status: 'Pago', supplier: 'Meta Platforms' },
  { id: 'exp-6', description: 'Impostos Simples Nacional 05/26', value: 6800, dueDate: '20/06/2026', paymentDate: '20/06/2026', category: 'Impostos', status: 'Pago', supplier: 'Receita Federal' },
  { id: 'exp-7', description: 'Pró-labore Sócios Fundadores', value: 30000, dueDate: '28/06/2026', paymentDate: null, category: 'Salários', status: 'Pendente', supplier: 'Orka Sócios' },
  { id: 'exp-8', description: 'Salários Folha Clientes & Devs', value: 25000, dueDate: '30/06/2026', paymentDate: null, category: 'Salários', status: 'Pendente', supplier: 'Orka Colaboradores' },
  { id: 'exp-9', description: 'Assessoria de Contabilidade', value: 1500, dueDate: '30/06/2026', paymentDate: null, category: 'Serviços', status: 'Pendente', supplier: 'PwC Associados' },
];

export const initialProposals: Proposal[] = [
  { id: 'prop-1', title: 'Setup Orquestração Comercial IA', client: 'Stripe Brasil', value: 45000, date: '15/06/2026', validUntil: '15/07/2026', status: 'Aceita' },
  { id: 'prop-2', title: 'Implantação Agentes QA pós-deploy', client: 'Vercel Inc', value: 60000, date: '10/06/2026', validUntil: '10/07/2026', status: 'Aceita' },
  { id: 'prop-3', title: 'Filtro e Triagem Automática de Bugs', client: 'Linear Co', value: 28000, date: '18/06/2026', validUntil: '18/07/2026', status: 'Enviada' },
  { id: 'prop-4', title: 'Geração Sumários de Áudio Reuniões', client: 'Notion Space', value: 15000, date: '22/06/2026', validUntil: '22/07/2026', status: 'Enviada' },
  { id: 'prop-5', title: 'CRM Customizado com Bots Ativos', client: 'HypeTech Corp', value: 80000, date: '03/06/2026', validUntil: '03/07/2026', status: 'Aceita' },
  { id: 'prop-6', title: 'Automação Relatórios Latência Slack', client: 'Vindi', value: 18000, date: '25/06/2026', validUntil: '25/07/2026', status: 'Rascunho' },
];

export const initialContracts: Contract[] = [
  { id: 'cont-1', title: 'Contrato ORKA Enterprise Assinatura', client: 'Stripe Brasil', value: 10000, startDate: '01/06/2026', endDate: '01/06/2027', status: 'Ativo' },
  { id: 'cont-2', title: 'Contrato ORKA Scale QA Integrado', client: 'Vercel Inc', value: 12000, startDate: '10/02/2026', endDate: '10/02/2027', status: 'Ativo' },
  { id: 'cont-3', title: 'Contrato ORKA Pro Bug Triager', client: 'Linear Co', value: 7500, startDate: '03/03/2026', endDate: '03/03/2027', status: 'Ativo' },
  { id: 'cont-4', title: 'Contrato Notion Auto Sumarizador', client: 'Notion Space', value: 5000, startDate: '01/05/2026', endDate: '01/05/2027', status: 'Suspenso' },
];

export const initialPayments: Payment[] = [
  { id: 'pay-1', description: 'Fatura Mensal Stripe Junho', value: 10000, dueDate: '20/06/2026', paymentDate: '20/06/2026', method: 'Pix', status: 'Pago', client: 'Stripe Brasil' },
  { id: 'pay-2', description: 'Fatura Mensal Vercel Junho', value: 12000, dueDate: '10/06/2026', paymentDate: '10/06/2026', method: 'Pix', status: 'Pago', client: 'Vercel Inc' },
  { id: 'pay-3', description: 'Fatura Mensal Linear Junho', value: 7500, dueDate: '10/06/2026', paymentDate: '10/06/2026', method: 'Boleto', status: 'Pago', client: 'Linear Co' },
  { id: 'pay-4', description: 'Fatura Mensal Notion Junho', value: 5000, dueDate: '25/06/2026', paymentDate: null, method: 'Pix', status: 'Pendente', client: 'Notion Space' },
  { id: 'pay-5', description: 'Fatura Mensal HypeTech Junho', value: 15000, dueDate: '28/06/2026', paymentDate: null, method: 'Pix', status: 'Pendente', client: 'HypeTech Corp' },
  { id: 'pay-6', description: 'Fatura Setup Stripe Brasil', value: 45000, dueDate: '15/06/2026', paymentDate: '15/06/2026', method: 'Pix', status: 'Pago', client: 'Stripe Brasil' },
  { id: 'pay-7', description: 'Fatura Setup Vercel Inc', value: 60000, dueDate: '25/06/2026', paymentDate: null, method: 'Pix', status: 'Pendente', client: 'Vercel Inc' },
  { id: 'pay-8', description: 'Fatura Mensal Vercel Julho', value: 12000, dueDate: '10/07/2026', paymentDate: null, method: 'Pix', status: 'Pendente', client: 'Vercel Inc' },
];

export const FinancialView: React.FC<{ isNewUser?: boolean; userEmail?: string }> = ({ isNewUser, userEmail }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'incomes' | 'expenses' | 'cashflow' | 'proposals' | 'payments'>('dashboard');
  
  // Data States
  const [incomes, setIncomes] = useState<Receita[]>([]);
  const [expenses, setExpenses] = useState<Despesa[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    const loadFinancialData = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const [dbIncomes, dbExpenses, dbProposals, dbContracts, dbPayments] = await Promise.all([
            supabaseTransactions.fetchIncomes(),
            supabaseTransactions.fetchExpenses(),
            supabaseProposals.fetch(),
            supabaseContracts.fetch(),
            supabasePayments.fetch()
          ]);

          setIncomes(dbIncomes);
          setExpenses(dbExpenses);
          setProposals(dbProposals);
          setContracts(dbContracts);
          setPayments(dbPayments);
        } else {
          // Local offline mode
          const savedIncomes = localStorage.getItem('orka_fin_incomes');
          const savedExpenses = localStorage.getItem('orka_fin_expenses');
          const savedProposals = localStorage.getItem('orka_fin_proposals');
          const savedContracts = localStorage.getItem('orka_fin_contracts');
          const savedPayments = localStorage.getItem('orka_fin_payments');

          setIncomes(savedIncomes ? JSON.parse(savedIncomes) : []);
          setExpenses(savedExpenses ? JSON.parse(savedExpenses) : []);
          setProposals(savedProposals ? JSON.parse(savedProposals) : []);
          setContracts(savedContracts ? JSON.parse(savedContracts) : []);
          setPayments(savedPayments ? JSON.parse(savedPayments) : []);
        }
        isLoadedRef.current = true;
      }
    };
    loadFinancialData();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && isLoadedRef.current && !isSupabaseActive()) {
      localStorage.setItem('orka_fin_incomes', JSON.stringify(incomes));
      localStorage.setItem('orka_fin_expenses', JSON.stringify(expenses));
      localStorage.setItem('orka_fin_proposals', JSON.stringify(proposals));
      localStorage.setItem('orka_fin_contracts', JSON.stringify(contracts));
      localStorage.setItem('orka_fin_payments', JSON.stringify(payments));
    }
  }, [incomes, expenses, proposals, contracts, payments, userEmail]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals Forms States
  const [isReceitaModalOpen, setIsReceitaModalOpen] = useState(false);
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  // Add Income State
  const [newIncDesc, setNewIncDesc] = useState('');
  const [newIncVal, setNewIncVal] = useState('');
  const [newIncDate, setNewIncDate] = useState('');
  const [newIncCat, setNewIncCat] = useState<Receita['category']>('Assinatura');
  const [newIncStatus, setNewIncStatus] = useState<Receita['status']>('Pendente');
  const [newIncClient, setNewIncClient] = useState('');

  // Add Expense State
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpVal, setNewExpVal] = useState('');
  const [newExpDate, setNewExpDate] = useState('');
  const [newExpCat, setNewExpCat] = useState<Despesa['category']>('Infraestrutura');
  const [newExpStatus, setNewExpStatus] = useState<Despesa['status']>('Pendente');
  const [newExpSupplier, setNewExpSupplier] = useState('');

  // Add Proposal State
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropClient, setNewPropClient] = useState('');
  const [newPropVal, setNewPropVal] = useState('');
  const [newPropValid, setNewPropValid] = useState('');

  // Add Contract State
  const [newContTitle, setNewContTitle] = useState('');
  const [newContClient, setNewContClient] = useState('');
  const [newContVal, setNewContVal] = useState('');
  const [newContStart, setNewContStart] = useState('');
  const [newContEnd, setNewContEnd] = useState('');

  // Helpers
  const parseValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getMonthAbbreviation = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length < 2) {
      // maybe yyyy-mm-dd format from input element
      const isoParts = dateStr.split('-');
      if (isoParts.length >= 2) {
        const monthNum = parseInt(isoParts[1], 10);
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return months[monthNum - 1] || 'Jun';
      }
      return 'Jun';
    }
    const monthNum = parseInt(parts[1], 10);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[monthNum - 1] || 'Jun';
  };

  const formatIsoToPtBr = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Aggregation for dynamic Dashboard & Chart
  const totalRecebido = incomes
    .filter(inc => inc.status === 'Recebido')
    .reduce((sum, inc) => sum + inc.value, 0);

  const totalDespesasPagas = expenses
    .filter(exp => exp.status === 'Pago')
    .reduce((sum, exp) => sum + exp.value, 0);

  const netBalance = totalRecebido - totalDespesasPagas;
  const profitMargin = totalRecebido > 0 ? (netBalance / totalRecebido) * 100 : 0;

  // Monthly aggregates: historical + current active
  const monthlyDataList = () => {
    const baseData: { [key: string]: { incomes: number; expenses: number } } = {
      'Jan': { incomes: isNewUser ? 0 : 95000, expenses: isNewUser ? 0 : 68000 },
      'Fev': { incomes: isNewUser ? 0 : 110000, expenses: isNewUser ? 0 : 72000 },
      'Mar': { incomes: isNewUser ? 0 : 115000, expenses: isNewUser ? 0 : 75000 },
      'Abr': { incomes: isNewUser ? 0 : 120000, expenses: isNewUser ? 0 : 78000 },
      'Mai': { incomes: isNewUser ? 0 : 135000, expenses: isNewUser ? 0 : 82000 },
      'Jun': { incomes: 0, expenses: 0 },
      'Jul': { incomes: 0, expenses: 0 },
    };

    incomes.forEach(inc => {
      const m = getMonthAbbreviation(inc.dueDate);
      if (baseData[m] !== undefined && inc.status === 'Recebido') {
        baseData[m].incomes += inc.value;
      }
    });

    expenses.forEach(exp => {
      const m = getMonthAbbreviation(exp.dueDate);
      if (baseData[m] !== undefined && exp.status === 'Pago') {
        baseData[m].expenses += exp.value;
      }
    });

    return Object.keys(baseData).map(month => ({
      month,
      incomes: baseData[month].incomes,
      expenses: baseData[month].expenses,
    }));
  };

  const currentMonthlyData = monthlyDataList();

  // Export functions
  const handleExportExcel = (type: 'incomes' | 'expenses' | 'cashflow' | 'proposals' | 'payments') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let fileName = `orkacrm_financeiro_${type}.csv`;

    if (type === 'incomes') {
      headers = ['ID', 'Descrição', 'Cliente', 'Valor (R$)', 'Vencimento', 'Data Recebimento', 'Categoria', 'Status'];
      rows = incomes.map(inc => [inc.id, inc.description, inc.client, inc.value, inc.dueDate, inc.receivedDate || '-', inc.category, inc.status]);
    } else if (type === 'expenses') {
      headers = ['ID', 'Descrição', 'Fornecedor', 'Valor (R$)', 'Vencimento', 'Data Pagamento', 'Categoria', 'Status'];
      rows = expenses.map(exp => [exp.id, exp.description, exp.supplier, exp.value, exp.dueDate, exp.paymentDate || '-', exp.category, exp.status]);
    } else if (type === 'cashflow') {
      headers = ['Mês', 'Receitas (R$)', 'Despesas (R$)', 'Saldo Líquido (R$)', 'Acumulado (R$)'];
      let cumulative = 0;
      rows = currentMonthlyData.map(d => {
        const net = d.incomes - d.expenses;
        cumulative += net;
        return [d.month, d.incomes, d.expenses, net, cumulative];
      });
    } else if (type === 'proposals') {
      headers = ['ID', 'Título', 'Cliente', 'Valor (R$)', 'Data Envio', 'Validade', 'Status'];
      rows = proposals.map(p => [p.id, p.title, p.client, p.value, p.date, p.validUntil, p.status]);
    } else if (type === 'payments') {
      headers = ['ID', 'Descrição', 'Cliente', 'Valor (R$)', 'Vencimento', 'Data Pagamento', 'Método', 'Status'];
      rows = payments.map(p => [p.id, p.description, p.client, p.value, p.dueDate, p.paymentDate || '-', p.method, p.status]);
    }

    // Convert to CSV
    const csvRows = [headers.join(';')];
    rows.forEach(row => {
      const formatted = row.map((cell: any) => {
        if (typeof cell === 'number') {
          return cell.toString().replace('.', ',');
        }
        return `"${String(cell).replace(/"/g, '""')}"`;
      });
      csvRows.push(formatted.join(';'));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = (type: 'incomes' | 'expenses' | 'cashflow' | 'proposals' | 'payments') => {
    let title = '';
    let headers: string[] = [];
    let printableRows: string[][] = [];

    if (type === 'incomes') {
      title = 'Demonstrativo de Receitas (Incomes Report)';
      headers = ['Descrição', 'Cliente', 'Valor', 'Vencimento', 'Recebido Em', 'Categoria', 'Status'];
      printableRows = incomes.map(inc => [
        inc.description,
        inc.client,
        parseValue(inc.value),
        inc.dueDate,
        inc.receivedDate || '-',
        inc.category,
        inc.status
      ]);
    } else if (type === 'expenses') {
      title = 'Demonstrativo de Despesas (Expenses Report)';
      headers = ['Descrição', 'Fornecedor', 'Valor', 'Vencimento', 'Pago Em', 'Categoria', 'Status'];
      printableRows = expenses.map(exp => [
        exp.description,
        exp.supplier,
        parseValue(exp.value),
        exp.dueDate,
        exp.paymentDate || '-',
        exp.category,
        exp.status
      ]);
    } else if (type === 'cashflow') {
      title = 'Demonstrativo de Fluxo de Caixa Mensal (Cash Flow)';
      headers = ['Mês', 'Receitas', 'Despesas', 'Saldo Líquido', 'Saldo Acumulado'];
      let cumulative = 0;
      printableRows = currentMonthlyData.map(d => {
        const net = d.incomes - d.expenses;
        cumulative += net;
        return [
          d.month,
          parseValue(d.incomes),
          parseValue(d.expenses),
          parseValue(net),
          parseValue(cumulative)
        ];
      });
    } else if (type === 'proposals') {
      title = 'Relatório de Propostas Comerciais';
      headers = ['Título da Proposta', 'Cliente', 'Valor Estimado', 'Data Emissão', 'Validade', 'Status'];
      printableRows = proposals.map(p => [
        p.title,
        p.client,
        parseValue(p.value),
        p.date,
        p.validUntil,
        p.status
      ]);
    } else if (type === 'payments') {
      title = 'Relatório de Faturamento & Pagamentos';
      headers = ['Descrição do Lançamento', 'Cliente', 'Valor Faturado', 'Vencimento', 'Pagamento', 'Método', 'Status'];
      printableRows = payments.map(p => [
        p.description,
        p.client,
        parseValue(p.value),
        p.dueDate,
        p.paymentDate || '-',
        p.method,
        p.status
      ]);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlRows = printableRows.map(row => 
      `<tr>${row.map(val => `<td>${val}</td>`).join('')}</tr>`
    ).join('');
    
    const htmlHeaders = headers.map(h => `<th>${h}</th>`).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #1F2937;
              background-color: #fff;
              padding: 40px;
              margin: 0;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #E5E7EB;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .meta {
              font-size: 12px;
              color: #6B7280;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              font-size: 13px;
            }
            th {
              background-color: #F9FAFB;
              color: #4B5563;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              padding: 12px 14px;
              border-bottom: 2px solid #E5E7EB;
              text-align: left;
            }
            td {
              padding: 12px 14px;
              border-bottom: 1px solid #F3F4F6;
              color: #374151;
            }
            tr:nth-child(even) td {
              background-color: #FAFAFA;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
              font-size: 11px;
              color: #9CA3AF;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ORKA CRM - GESTÃO FINANCEIRA</div>
              <div style="font-size: 14px; color: #4B5563; margin-top: 4px; font-weight: 500;">${title}</div>
            </div>
            <div class="meta">
              <div style="font-weight: 600; color: #374151;">Orka Admin System</div>
              <div>Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>${htmlHeaders}</tr>
            </thead>
            <tbody>
              ${htmlRows}
            </tbody>
          </table>
          <div class="footer">
            <span>ORKA CRM S.A. - Relatório de Auditoria Financeira Interna</span>
            <span>Documento Oficial</span>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Actions
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncDesc || !newIncVal || !newIncDate || !newIncClient) return;

    const newInc: Receita = {
      id: `inc-${Math.random().toString().substring(2, 7)}`,
      description: newIncDesc,
      value: Number(newIncVal),
      dueDate: formatIsoToPtBr(newIncDate),
      receivedDate: newIncStatus === 'Recebido' ? formatIsoToPtBr(newIncDate) : null,
      category: newIncCat,
      status: newIncStatus,
      client: newIncClient
    };

    setIncomes([newInc, ...incomes]);
    if (isSupabaseActive()) {
      supabaseTransactions.insertIncome(newInc);
    }
    setIsReceitaModalOpen(false);
    
    // reset state
    setNewIncDesc('');
    setNewIncVal('');
    setNewIncDate('');
    setNewIncCat('Assinatura');
    setNewIncStatus('Pendente');
    setNewIncClient('');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc || !newExpVal || !newExpDate || !newExpSupplier) return;

    const newExp: Despesa = {
      id: `exp-${Math.random().toString().substring(2, 7)}`,
      description: newExpDesc,
      value: Number(newExpVal),
      dueDate: formatIsoToPtBr(newExpDate),
      paymentDate: newExpStatus === 'Pago' ? formatIsoToPtBr(newExpDate) : null,
      category: newExpCat,
      status: newExpStatus,
      supplier: newExpSupplier
    };

    setExpenses([newExp, ...expenses]);
    if (isSupabaseActive()) {
      supabaseTransactions.insertExpense(newExp);
    }
    setIsDespesaModalOpen(false);

    // reset state
    setNewExpDesc('');
    setNewExpVal('');
    setNewExpDate('');
    setNewExpCat('Infraestrutura');
    setNewExpStatus('Pendente');
    setNewExpSupplier('');
  };

  const handleAddProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropTitle || !newPropClient || !newPropVal || !newPropValid) return;

    const newProp: Proposal = {
      id: `prop-${Math.random().toString().substring(2, 7)}`,
      title: newPropTitle,
      client: newPropClient,
      value: Number(newPropVal),
      date: new Date().toLocaleDateString('pt-BR'),
      validUntil: formatIsoToPtBr(newPropValid),
      status: 'Enviada'
    };

    setProposals([newProp, ...proposals]);
    if (isSupabaseActive()) {
      supabaseProposals.insert(newProp);
    }
    setIsProposalModalOpen(false);

    setNewPropTitle('');
    setNewPropClient('');
    setNewPropVal('');
    setNewPropValid('');
  };

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContTitle || !newContClient || !newContVal || !newContStart || !newContEnd) return;

    const newCont: Contract = {
      id: `cont-${Math.random().toString().substring(2, 7)}`,
      title: newContTitle,
      client: newContClient,
      value: Number(newContVal),
      startDate: formatIsoToPtBr(newContStart),
      endDate: formatIsoToPtBr(newContEnd),
      status: 'Ativo'
    };

    setContracts([newCont, ...contracts]);
    if (isSupabaseActive()) {
      supabaseContracts.insert(newCont);
    }
    setIsContractModalOpen(false);

    setNewContTitle('');
    setNewContClient('');
    setNewContVal('');
    setNewContStart('');
    setNewContEnd('');
  };

  const handleSignContractFromProposal = (proposal: Proposal) => {
    const startStr = new Date().toLocaleDateString('pt-BR');
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const endStr = nextYear.toLocaleDateString('pt-BR');

    const newCont: Contract = {
      id: `cont-${Math.random().toString().substring(2, 7)}`,
      title: `Contrato - ${proposal.title}`,
      client: proposal.client,
      value: Math.floor(proposal.value * 0.15) || 5000,
      startDate: startStr,
      endDate: endStr,
      status: 'Ativo'
    };

    setContracts([newCont, ...contracts]);
    setProposals(proposals.map(p => p.id === proposal.id ? { ...p, status: 'Aceita' } : p));
    if (isSupabaseActive()) {
      supabaseContracts.insert(newCont);
      supabaseProposals.update({ ...proposal, status: 'Aceita' });
    }
  };

  const handleMarkPaymentAsPaid = (payment: Payment) => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const updatedPayment: Payment = { ...payment, status: 'Pago', paymentDate: todayStr };

    setPayments(payments.map(p => p.id === payment.id ? updatedPayment : p));

    const isSetup = payment.description.toLowerCase().includes('setup');
    const newInc: Receita = {
      id: `inc-${Math.random().toString().substring(2, 7)}`,
      description: payment.description,
      value: payment.value,
      dueDate: payment.dueDate,
      receivedDate: todayStr,
      category: isSetup ? 'Setup' : 'Assinatura',
      status: 'Recebido',
      client: payment.client
    };

    setIncomes([newInc, ...incomes]);
    if (isSupabaseActive()) {
      supabasePayments.update(updatedPayment);
      supabaseTransactions.insertIncome(newInc);
    }
  };

  // Render Sub-Views
  const renderSubView = () => {
    switch (activeSubTab) {
      case 'dashboard':
        const maxVal = Math.max(...currentMonthlyData.map(d => Math.max(d.incomes, d.expenses))) * 1.15 || 200000;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
            {/* KPI Cards Row */}
            <div className="metrics-grid">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="metric-title">Faturamento Recebido</span>
                    <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>{parseValue(totalRecebido)}</h2>
                  </div>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                    <ArrowUpRight size={20} />
                  </div>
                </div>
                <div className="metric-footer">
                  <span className="metric-trend-up">↑ 12.4%</span>
                  <span className="metric-period">vs mês anterior</span>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="metric-title">Despesas Pagas</span>
                    <h2 className="metric-value" style={{ color: 'var(--color-danger)' }}>{parseValue(totalDespesasPagas)}</h2>
                  </div>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>
                    <ArrowDownRight size={20} />
                  </div>
                </div>
                <div className="metric-footer">
                  <span className="metric-trend-down" style={{ color: 'var(--color-success)' }}>↓ 5.2%</span>
                  <span className="metric-period">economia de custos</span>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="metric-title">Fluxo de Caixa Líquido</span>
                    <h2 className="metric-value" style={{ color: 'var(--color-primary)' }}>{parseValue(netBalance)}</h2>
                  </div>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(45, 140, 255, 0.1)', color: 'var(--color-primary)' }}>
                    <Activity size={20} />
                  </div>
                </div>
                <div className="metric-footer">
                  <span className="metric-trend-up" style={{ color: netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {netBalance >= 0 ? '+' : '-'}{parseValue(Math.abs(netBalance))}
                  </span>
                  <span className="metric-period">saldo atual em caixa</span>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="metric-title">Margem de Lucro</span>
                    <h2 className="metric-value" style={{ color: 'var(--color-purple)' }}>{profitMargin.toFixed(1)}%</h2>
                  </div>
                  <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple)' }}>
                    <Layers size={20} />
                  </div>
                </div>
                <div className="metric-footer">
                  <span className="metric-trend-up" style={{ color: 'var(--color-purple)' }}>Meta: 35.0%</span>
                  <span className="metric-period">operação altamente saudável</span>
                </div>
              </div>
            </div>

            {/* Monthly SVG Chart */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Comparativo Mensal: Receitas vs Despesas</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Faturamento Realizado e Despesas Consolidadas em 2026</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'var(--color-success)' }}></span>
                    <span>Receitas</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'var(--color-danger)' }}></span>
                    <span>Despesas</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Column Bar SVG Chart */}
              <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 600 240" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="50" y1="40" x2="570" y2="40" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50" y1="80" x2="570" y2="80" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50" y1="120" x2="570" y2="120" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50" y1="160" x2="570" y2="160" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50" y1="200" x2="570" y2="200" stroke="var(--border-color)" strokeWidth="1" />

                  {/* Y Axis labels */}
                  <text x="40" y="44" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ {Math.round(maxVal * 0.75 / 1000)}k</text>
                  <text x="40" y="84" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ {Math.round(maxVal * 0.50 / 1000)}k</text>
                  <text x="40" y="124" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ {Math.round(maxVal * 0.25 / 1000)}k</text>
                  <text x="40" y="164" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ 0</text>

                  {/* Rendering Columns */}
                  {currentMonthlyData.map((d, index) => {
                    const colWidth = 18;
                    const groupWidth = 72; // width of each month section
                    const startX = 70 + index * groupWidth;

                    // calculate heights relative to max value
                    const incHeight = (d.incomes / maxVal) * 160;
                    const expHeight = (d.expenses / maxVal) * 160;

                    const incY = 200 - incHeight;
                    const expY = 200 - expHeight;

                    return (
                      <g key={d.month}>
                        {/* Income Bar (Green) */}
                        <rect 
                          x={startX} 
                          y={incY} 
                          width={colWidth} 
                          height={incHeight} 
                          fill="var(--color-success)" 
                          rx="3"
                          style={{ transition: 'all 0.3s ease' }}
                        >
                          <title>Receitas: {parseValue(d.incomes)}</title>
                        </rect>
                        
                        {/* Expense Bar (Red) */}
                        <rect 
                          x={startX + colWidth + 4} 
                          y={expY} 
                          width={colWidth} 
                          height={expHeight} 
                          fill="var(--color-danger)" 
                          rx="3"
                          style={{ transition: 'all 0.3s ease' }}
                        >
                          <title>Despesas: {parseValue(d.expenses)}</title>
                        </rect>

                        {/* X Axis Label */}
                        <text 
                          x={startX + colWidth} 
                          y="220" 
                          fill="var(--text-secondary)" 
                          fontSize="10" 
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {d.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* AI Financial insights */}
            <div className="ai-analysis-box" style={{ padding: '20px', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Sparkles size={18} style={{ color: 'var(--color-purple)' }} />
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>ORKA Brain - Insights Financeiros & Projeções</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Com base nos fluxos ativos, a saúde financeira corporativa está excelente. A projeção de <b>Fluxo de Caixa Líquido para Julho de 2026</b> indica um aumento de <b>R$ 18.000</b> em receitas receitas se os pagamentos pendentes da Stripe e HypeTech Corp forem liquidados. Sugerimos renegociar despesas de infraestrutura da AWS e APIs para otimizar a margem operacional de 67% para 72%.
              </p>
            </div>
          </div>
        );

      case 'incomes':
      case 'expenses':
        const isInc = activeSubTab === 'incomes';
        
        // filtering & search
        const listData = isInc 
          ? incomes.filter(inc => {
              const matchesSearch = inc.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    inc.client.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
              const matchesCategory = categoryFilter === 'all' || inc.category === categoryFilter;
              return matchesSearch && matchesStatus && matchesCategory;
            })
          : expenses.filter(exp => {
              const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    exp.supplier.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
              const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
              return matchesSearch && matchesStatus && matchesCategory;
            });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {/* Filters bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '500px' }}>
                <div className="search-box" style={{ flexGrow: 1, maxWidth: '300px' }}>
                  <Search size={16} className="text-secondary" />
                  <input 
                    type="text" 
                    placeholder={isInc ? "Buscar receitas ou clientes..." : "Buscar despesas ou credores..."}
                    className="search-input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <select 
                  className="form-select" 
                  style={{ width: '130px', padding: '0 12px', height: '36px', fontSize: '0.78rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Status (Todos)</option>
                  <option value={isInc ? "Recebido" : "Pago"}>{isInc ? "Recebido" : "Pago"}</option>
                  <option value="Pendente">Pendente</option>
                </select>

                <select 
                  className="form-select" 
                  style={{ width: '150px', padding: '0 12px', height: '36px', fontSize: '0.78rem' }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Categoria (Todas)</option>
                  {isInc ? (
                    <>
                      <option value="Assinatura">Assinatura</option>
                      <option value="Consultoria">Consultoria</option>
                      <option value="Setup">Setup</option>
                      <option value="Outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Salários">Salários</option>
                      <option value="Impostos">Impostos</option>
                      <option value="Serviços">Serviços</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>

              {/* Add and export actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportExcel(isInc ? 'incomes' : 'expenses')}>
                  <Download size={14} />
                  <span>Excel</span>
                </button>
                <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportPDF(isInc ? 'incomes' : 'expenses')}>
                  <FileText size={14} />
                  <span>PDF</span>
                </button>
                <button className="primary-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => isInc ? setIsReceitaModalOpen(true) : setIsDespesaModalOpen(true)}>
                  <Plus size={14} />
                  <span>Novo Lançamento</span>
                </button>
              </div>
            </div>

            {/* List Table */}
            <div className="table-container">
              <table className="customer-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Lançamento</th>
                    <th>{isInc ? 'Cliente' : 'Fornecedor'}</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>{isInc ? 'Recebimento' : 'Pagamento'}</th>
                    <th>Status</th>
                    <th style={{ width: '60px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                          {isInc ? <Building size={12} className="text-secondary" /> : <User size={12} className="text-secondary" />}
                          <span>{isInc ? (item as Receita).client : (item as Despesa).supplier}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: isInc ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {parseValue(item.value)}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.dueDate}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {isInc ? ((item as Receita).receivedDate || '-') : ((item as Despesa).paymentDate || '-')}
                      </td>
                      <td>
                        {item.status === 'Recebido' || item.status === 'Pago' ? (
                          <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            {item.status}
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            Pendente
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {item.status === 'Pendente' && (
                            <button 
                              className="icon-btn" 
                              style={{ color: 'var(--color-success)', border: 'none', background: 'none', cursor: 'pointer' }}
                              title={isInc ? 'Marcar como Recebido' : 'Marcar como Pago'}
                              onClick={() => {
                                const todayStr = new Date().toLocaleDateString('pt-BR');
                                if (isInc) {
                                  setIncomes(incomes.map(inc => inc.id === item.id ? { ...inc, status: 'Recebido', receivedDate: todayStr } : inc));
                                } else {
                                  setExpenses(expenses.map(exp => exp.id === item.id ? { ...exp, status: 'Pago', paymentDate: todayStr } : exp));
                                }
                              }}
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                            className="icon-btn" 
                            style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                            title="Remover"
                            onClick={async () => {
                              if (window.confirm('Tem certeza que deseja excluir este registro financeiro?')) {
                                if (isInc) {
                                  setIncomes(incomes.filter(inc => inc.id !== item.id));
                                  if (isSupabaseActive()) {
                                    await supabaseTransactions.delete(item.id);
                                  }
                                } else {
                                  setExpenses(expenses.filter(exp => exp.id !== item.id));
                                  if (isSupabaseActive()) {
                                    await supabaseTransactions.delete(item.id);
                                  }
                                }
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {listData.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Nenhum registro financeiro encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'cashflow':
        // Generate cash flow matrix
        let cumulative = 0;
        const cashFlowRows = currentMonthlyData.map(d => {
          const net = d.incomes - d.expenses;
          cumulative += net;
          return {
            ...d,
            net,
            cumulative
          };
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Demonstrativo Financeiro de Fluxo de Caixa</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mapeamento mensal de receitas e despesas operacionais realizadas.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportExcel('cashflow')}>
                  <Download size={14} />
                  <span>Exportar Excel</span>
                </button>
                <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportPDF('cashflow')}>
                  <FileText size={14} />
                  <span>Imprimir PDF</span>
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="customer-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Mês Operacional</th>
                    <th>Receitas Operacionais</th>
                    <th>Despesas Consolidadas</th>
                    <th>Saldo Líquido Mensal</th>
                    <th>Saldo Acumulado em Caixa</th>
                    <th>Eficiência</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowRows.map((row) => (
                    <tr key={row.month}>
                      <td style={{ fontWeight: 700 }}>{row.month} 2026</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{parseValue(row.incomes)}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{parseValue(row.expenses)}</td>
                      <td style={{ fontWeight: 700, color: row.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {row.net >= 0 ? '+' : ''}{parseValue(row.net)}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                        {parseValue(row.cumulative)}
                      </td>
                      <td>
                        {row.incomes > 0 ? (
                          <span className="badge" style={{ backgroundColor: 'rgba(45, 140, 255, 0.08)', color: 'var(--color-primary)' }}>
                            {((row.net / row.incomes) * 100).toFixed(0)}% margem
                          </span>
                        ) : (
                          <span className="badge badge-warning">N/D</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <AlertCircle size={20} className="text-secondary" style={{ color: 'var(--color-primary)' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <b>Auditoria Automatizada:</b> Este fluxo considera faturamentos liquidados e despesas quitadas dentro dos limites do trimestre fiscal corrente.
              </div>
            </div>
          </div>
        );

      case 'proposals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '16px' }}>
            
            {/* Proposals Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Propostas Comerciais</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Central de ofertas e cotações estruturadas geradas para leads.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportExcel('proposals')}>
                    <Download size={14} />
                    <span>Excel</span>
                  </button>
                  <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportPDF('proposals')}>
                    <FileText size={14} />
                    <span>PDF</span>
                  </button>
                  <button className="primary-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => setIsProposalModalOpen(true)}>
                    <Plus size={14} />
                    <span>Criar Proposta</span>
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Cliente</th>
                      <th>Valor da Proposta</th>
                      <th>Data de Emissão</th>
                      <th>Validade</th>
                      <th>Status</th>
                      <th style={{ width: '120px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.title}</td>
                        <td>{p.client}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{parseValue(p.value)}</td>
                        <td>{p.date}</td>
                        <td>{p.validUntil}</td>
                        <td>
                          <span className={`badge ${
                            p.status === 'Aceita' ? 'badge-success' : 
                            p.status === 'Enviada' ? 'badge-primary' :
                            p.status === 'Recusada' ? 'badge-danger' : 'badge-purple'
                          }`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(p.status === 'Enviada' || p.status === 'Aceita') && (
                              <button 
                                className="outline-btn" 
                                style={{ padding: '4px 8px', fontSize: '0.68rem', borderColor: 'var(--color-success)', color: 'var(--color-success)', display: 'inline-flex', gap: '4px' }}
                                title="Assinar Contrato de Trabalho"
                                onClick={() => handleSignContractFromProposal(p)}
                              >
                                <FileCheck size={12} />
                                <span>Assinar</span>
                              </button>
                            )}
                            <button 
                              className="icon-btn" 
                              style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                              onClick={async () => {
                                if (window.confirm('Tem certeza que deseja excluir esta proposta?')) {
                                  setProposals(proposals.filter(pr => pr.id !== p.id));
                                  if (isSupabaseActive()) {
                                    await supabaseProposals.delete(p.id);
                                  }
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contracts Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Contratos de Clientes (MRR & Acordos)</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vínculos jurídicos ativos garantindo faturamento e suporte técnico.</p>
                </div>
                <button className="primary-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => setIsContractModalOpen(true)}>
                  <Plus size={14} />
                  <span>Novo Contrato</span>
                </button>
              </div>

              <div className="table-container">
                <table className="customer-table">
                  <thead>
                    <tr>
                      <th>Contrato</th>
                      <th>Cliente Associado</th>
                      <th>MRR Recorrente</th>
                      <th>Início da Vigência</th>
                      <th>Fim do Contrato</th>
                      <th>Status</th>
                      <th style={{ width: '100px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td>{c.client}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-purple)' }}>{parseValue(c.value)}/mês</td>
                        <td>{c.startDate}</td>
                        <td>{c.endDate}</td>
                        <td>
                          <span className={`badge ${
                            c.status === 'Ativo' ? 'badge-success' : 
                            c.status === 'Suspenso' ? 'badge-warning' : 'badge-danger'
                          }`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {c.status === 'Ativo' ? (
                              <button 
                                className="outline-btn" 
                                style={{ padding: '4px 6px', fontSize: '0.65rem' }} 
                                onClick={() => setContracts(contracts.map(co => co.id === c.id ? { ...co, status: 'Suspenso' } : co))}
                              >
                                Suspender
                              </button>
                            ) : (
                              <button 
                                className="outline-btn" 
                                style={{ padding: '4px 6px', fontSize: '0.65rem', color: 'var(--color-success)' }} 
                                onClick={() => setContracts(contracts.map(co => co.id === c.id ? { ...co, status: 'Ativo' } : co))}
                              >
                                Reativar
                              </button>
                            )}
                            <button 
                              className="icon-btn" 
                              style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                              onClick={async () => {
                                if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
                                  setContracts(contracts.filter(co => co.id !== c.id));
                                  if (isSupabaseActive()) {
                                    await supabaseContracts.delete(c.id);
                                  }
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );

      case 'payments':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Central de Faturamento (Faturas & Parcelas)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Histórico e acompanhamento de cobranças de parcelas de implantação e assinaturas.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportExcel('payments')}>
                  <Download size={14} />
                  <span>Excel</span>
                </button>
                <button className="outline-btn" style={{ padding: '8px 14px', fontSize: '0.78rem' }} onClick={() => handleExportPDF('payments')}>
                  <FileText size={14} />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Cobrança</th>
                    <th>Cliente</th>
                    <th>Valor Cobrado</th>
                    <th>Vencimento</th>
                    <th>Liquidado Em</th>
                    <th>Forma de Pagamento</th>
                    <th>Status</th>
                    <th style={{ width: '130px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.description}</td>
                      <td>{p.client}</td>
                      <td style={{ fontWeight: 700 }}>{parseValue(p.value)}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.dueDate}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.paymentDate || '-'}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={12} className="text-secondary" />
                          {p.method}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          p.status === 'Pago' ? 'badge-success' : 
                          p.status === 'Pendente' ? 'badge-warning' : 'badge-danger'
                        }`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {p.status === 'Pendente' && (
                            <button 
                              className="primary-btn" 
                              style={{ padding: '4px 8px', fontSize: '0.68rem', backgroundColor: 'var(--color-success)', color: '#fff', display: 'inline-flex', gap: '4px' }}
                              onClick={() => handleMarkPaymentAsPaid(p)}
                            >
                              <CheckCircle size={12} />
                              <span>Marcar Pago</span>
                            </button>
                          )}
                          <button 
                            className="icon-btn" 
                            style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                            onClick={async () => {
                              if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
                                setPayments(payments.filter(pay => pay.id !== p.id));
                                if (isSupabaseActive()) {
                                  await supabasePayments.delete(p.id);
                                }
                              }
                            }}
                          >
                            <Trash2 size={12} />
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
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top subheader with subtab selectors */}
      <div className="financial-subtab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div className="mobile-scroll-tabs" style={{ display: 'flex', gap: '6px' }}>
          {(['dashboard', 'incomes', 'expenses', 'cashflow', 'proposals', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              className={`outline-btn ${activeSubTab === tab ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '8px 16px', borderRadius: '20px', whiteSpace: 'nowrap' }}
              onClick={() => {
                setActiveSubTab(tab);
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
            >
              {tab === 'dashboard' ? 'Painel & Gráficos' : 
               tab === 'incomes' ? 'Receitas' :
               tab === 'expenses' ? 'Despesas' :
               tab === 'cashflow' ? 'Fluxo de Caixa' :
               tab === 'proposals' ? 'Propostas & Contratos' : 'Pagamentos'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          <Clock size={12} />
          <span>Exercício: 2026 (Consolidado)</span>
        </div>
      </div>

      {/* Main Sub View rendering */}
      {renderSubView()}

      {/* MODAL RECEITA */}
      {isReceitaModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registrar Receita</h3>
            <form onSubmit={handleAddIncome} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Descrição da Receita</span>
                <input 
                  type="text" 
                  placeholder="Ex: Faturamento Mensal Stripe Julho" 
                  className="form-input"
                  value={newIncDesc}
                  onChange={(e) => setNewIncDesc(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Cliente</span>
                <input 
                  type="text" 
                  placeholder="Ex: Stripe Brasil" 
                  className="form-input"
                  value={newIncClient}
                  onChange={(e) => setNewIncClient(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Valor (R$)</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 10000" 
                    className="form-input"
                    value={newIncVal}
                    onChange={(e) => setNewIncVal(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Categoria</span>
                  <select 
                    className="form-select"
                    value={newIncCat}
                    onChange={(e) => setNewIncCat(e.target.value as Receita['category'])}
                  >
                    <option value="Assinatura">Assinatura</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Setup">Setup</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Vencimento</span>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newIncDate}
                    onChange={(e) => setNewIncDate(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Status Inicial</span>
                  <select 
                    className="form-select"
                    value={newIncStatus}
                    onChange={(e) => setNewIncStatus(e.target.value as Receita['status'])}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Recebido">Recebido</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsReceitaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar Receita</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DESPESA */}
      {isDespesaModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registrar Despesa</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Descrição da Despesa</span>
                <input 
                  type="text" 
                  placeholder="Ex: Fatura AWS Hospedagem" 
                  className="form-input"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Fornecedor / Credor</span>
                <input 
                  type="text" 
                  placeholder="Ex: Amazon Web Services" 
                  className="form-input"
                  value={newExpSupplier}
                  onChange={(e) => setNewExpSupplier(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Valor da Fatura (R$)</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 14500" 
                    className="form-input"
                    value={newExpVal}
                    onChange={(e) => setNewExpVal(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Categoria</span>
                  <select 
                    className="form-select"
                    value={newExpCat}
                    onChange={(e) => setNewExpCat(e.target.value as Despesa['category'])}
                  >
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Salários">Salários</option>
                    <option value="Impostos">Impostos</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Vencimento</span>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Status Inicial</span>
                  <select 
                    className="form-select"
                    value={newExpStatus}
                    onChange={(e) => setNewExpStatus(e.target.value as Despesa['status'])}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsDespesaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar Despesa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROPOSAL */}
      {isProposalModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Criar Nova Proposta</h3>
            <form onSubmit={handleAddProposal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Título do Projeto / Escopo</span>
                <input 
                  type="text" 
                  placeholder="Ex: Implantação Agentes QA pós-deploy" 
                  className="form-input"
                  value={newPropTitle}
                  onChange={(e) => setNewPropTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Cliente (Lead)</span>
                <input 
                  type="text" 
                  placeholder="Ex: Stripe Brasil" 
                  className="form-input"
                  value={newPropClient}
                  onChange={(e) => setNewPropClient(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Valor Estimado (R$)</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 45000" 
                    className="form-input"
                    value={newPropVal}
                    onChange={(e) => setNewPropVal(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Data Limite Validade</span>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newPropValid}
                    onChange={(e) => setNewPropValid(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsProposalModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Enviar Proposta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONTRACT */}
      {isContractModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registrar Novo Contrato</h3>
            <form onSubmit={handleAddContract} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Contrato</span>
                <input 
                  type="text" 
                  placeholder="Ex: Contrato ORKA Enterprise Assinatura" 
                  className="form-input"
                  value={newContTitle}
                  onChange={(e) => setNewContTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Cliente</span>
                <input 
                  type="text" 
                  placeholder="Ex: Stripe Brasil" 
                  className="form-input"
                  value={newContClient}
                  onChange={(e) => setNewContClient(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Valor Recorrente Mensal (MRR) (R$)</span>
                <input 
                  type="number" 
                  placeholder="Ex: 10000" 
                  className="form-input"
                  value={newContVal}
                  onChange={(e) => setNewContVal(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Início Vigência</span>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newContStart}
                    onChange={(e) => setNewContStart(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Fim Vigência</span>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newContEnd}
                    onChange={(e) => setNewContEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsContractModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar Contrato</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
