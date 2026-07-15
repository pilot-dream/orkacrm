import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  AlertCircle
} from 'lucide-react';

import { useLeadStore } from '../../entities/lead/model/store';
import { useClienteStore } from '../../entities/cliente/model/store';
import { useProductStore } from '../../entities/produto/model/store';
import { usePropostaStore } from '../../entities/proposta/model/store';
import { useAuthStore } from '../../entities/usuario/model/store';
const KanbanBoard = React.lazy(() => import('./components/KanbanBoard').then(m => ({ default: m.KanbanBoard })));
import { KanbanSkeleton } from '../../widgets/skeletons/KanbanSkeleton';
import { LeadFiles } from './components/LeadFiles';
import type { Lead, LeadStage, NegotiatedProduct } from '../../entities/lead/model/types';
import type { Proposta } from '../../entities/proposta/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { isSupabaseActive, supabase } from '../../shared/api/supabaseClient';

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'prospeccao', label: 'Prospecção', color: '#60A5FA' },
  { id: 'qualificacao', label: 'Qualificação', color: '#A78BFA' },
  { id: 'negociacao', label: 'Negociação', color: '#FBBF24' },
  { id: 'contrato', label: 'Contrato Enviado', color: '#F472B6' },
  { id: 'fechado', label: 'Fechado', color: '#10B981' },
  { id: 'perdido', label: 'Perdido', color: '#EF4444' }
];

const getDayFromDateString = (dateStr: string | number | undefined): number => {
  if (!dateStr) return 10;
  if (typeof dateStr === 'number') return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = Number(parts[2]);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return day;
    }
  }
  const partsSlash = dateStr.split('/');
  if (partsSlash.length === 3) {
    const day = Number(partsSlash[0]);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      return day;
    }
  }
  const num = Number(dateStr);
  if (!isNaN(num)) return num;
  return 10;
};

const getDateStringFromDayNumber = (dayNum: number | string | undefined): string => {
  if (!dayNum) return '';
  if (typeof dayNum === 'string') {
    if (dayNum.includes('-')) return dayNum;
    const parsed = Number(dayNum);
    if (isNaN(parsed)) return '';
    dayNum = parsed;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(dayNum).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LeadsPage() {
  // Zustand Stores
  const { leads, loading, error, fetchLeads, addLead, updateLead, updateLeadStage, deleteLead } = useLeadStore();
  const { products, fetchProducts } = useProductStore();
  const { fetchPropostasByLeadId, addProposta } = usePropostaStore();
  const fetchClientes = useClienteStore((state) => state.fetchClientes);
  const teamMembers = useAuthStore((state) => state.teamMembers);
  const userProfile = useAuthStore((state) => state.userProfile);

  // Drag and Drop validation states
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationErrorList, setValidationErrorList] = useState<string[]>([]);

  // UI state
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [tempSearchQuery, setTempSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(tempSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [tempSearchQuery]);

  useEffect(() => {
    const stage = searchParams.get('stage');
    if (stage) {
      setStageFilter(stage);
    }
  }, [searchParams]);
  
  // Modal / Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [leadToDeleteId, setLeadToDeleteId] = useState<string | null>(null);
  
  // Pending stage change validation for expected close date
  const [pendingMove, setPendingMove] = useState<{ leadId: string; targetStage: LeadStage; oldStage: LeadStage } | null>(null);
  const [pendingExpectedDate, setPendingExpectedDate] = useState('');
  
  // Drawer active tab
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'comments' | 'files'>('details');

  // Form states for adding Lead
  const [formCompany, setFormCompany] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState(true);
  const [formEmail, setFormEmail] = useState('');
  const [formPriority, setFormPriority] = useState<'alta' | 'media' | 'baixa'>('media');
  const [formStage, setFormStage] = useState<LeadStage>('prospeccao');
  const [formOwner, setFormOwner] = useState('');
  const [formSource, setFormSource] = useState('Outbound');
  const [formSegment, setFormSegment] = useState('');
  const [formEmployeeCount, setFormEmployeeCount] = useState('');
  const [formMonthlyRevenue, setFormMonthlyRevenue] = useState('');
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formNeeds, setFormNeeds] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formCountry, setFormCountry] = useState('');
  
  // Custom states for Products
  const [formProducts, setFormProducts] = useState<NegotiatedProduct[]>([]);
  const [formMrr, setFormMrr] = useState('');
  const [formCommission, setFormCommission] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New finance integration fields
  const [formSetupPaymentMethod, setFormSetupPaymentMethod] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [formSetupPaymentDate, setFormSetupPaymentDate] = useState('');
  const [formSetupInstallmentsCount, setFormSetupInstallmentsCount] = useState('1');
  const [formSetupInstallmentValue, setFormSetupInstallmentValue] = useState('');
  const [formSetupFirstInstallmentDate, setFormSetupFirstInstallmentDate] = useState('');
  const [formMrrDueDay, setFormMrrDueDay] = useState('10');
  const [formSetupValue, setFormSetupValue] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDrawerProductChange = (updatedProducts: NegotiatedProduct[]) => {
    const totalSetup = updatedProducts.reduce((acc, p) => acc + p.setup, 0);
    const totalMrr = updatedProducts.reduce((acc, p) => acc + p.mrr, 0);
    const totalComissao = updatedProducts.reduce((acc, p) => acc + (p.setup + p.mrr) * (p.percentual / 100), 0);
    
    setEditFields({
      ...editFields,
      productsNegotiated: updatedProducts,
      value: totalSetup,
      mrrValue: totalMrr,
      percentage: totalComissao
    });
  };

  // Auto calculation on products change
  useEffect(() => {
    const totalMrr = formProducts.reduce((acc, p) => acc + p.mrr, 0);
    const totalComissao = formProducts.reduce((acc, p) => acc + (p.setup + p.mrr) * (p.percentual / 100), 0);
    const totalSetup = formProducts.reduce((acc, p) => acc + p.setup, 0);
    
    setFormMrr(String(totalMrr));
    setFormCommission(String(totalComissao));
    setFormSetupValue(String(totalSetup));
  }, [formProducts]);

  // Installment value auto-calculation
  useEffect(() => {
    const setupVal = Number(formSetupValue) || 0;
    const count = Number(formSetupInstallmentsCount) || 1;
    setFormSetupInstallmentValue(String(Math.round(setupVal / count)));
  }, [formSetupValue, formSetupInstallmentsCount]);

  // Form states for proposals
  const [propSetup, setPropSetup] = useState('');
  const [propMrr, setPropMrr] = useState('');
  const [propProb, setPropProb] = useState('80');
  const [propDate, setPropDate] = useState('');
  const [propStatus, setPropStatus] = useState<'rascunho' | 'enviada'>('rascunho');

  // Edit fields (in Drawer)
  const [editFields, setEditFields] = useState<Partial<Lead>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Installment value auto-calculation in Drawer
  useEffect(() => {
    if (editFields.setupPaymentMethod === 'parcelado') {
      const setupVal = Number(editFields.value) || 0;
      const count = Number(editFields.setupInstallmentsCount) || 1;
      const instVal = Math.round(setupVal / count);
      if (editFields.setupInstallmentValue !== instVal) {
        setEditFields(prev => ({
          ...prev,
          setupInstallmentValue: instVal
        }));
      }
    }
  }, [editFields.value, editFields.setupInstallmentsCount, editFields.setupPaymentMethod]);

  // Timeline / comments/ files state (from database)
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [commentsList, setCommentsList] = useState<string[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchProducts();
  }, []);

  // Sync editFields when selectedLeadId changes
  const selectedLead = leads.find(l => l.id === selectedLeadId);
  useEffect(() => {
    if (selectedLead) {
      setEditFields({
        ...selectedLead,
        setupPaymentMethod: selectedLead.setupPaymentMethod || 'a_vista',
        setupPaymentDate: selectedLead.setupPaymentDate || '',
        setupInstallmentsCount: selectedLead.setupInstallmentsCount || 1,
        setupInstallmentValue: selectedLead.setupInstallmentValue || 0,
        setupFirstInstallmentDate: selectedLead.setupFirstInstallmentDate || '',
        mrrDueDay: selectedLead.mrrDueDay || 10
      });
      setValidationError(null);
      fetchPropostasByLeadId(selectedLead.id);
      loadTimelineAndComments(selectedLead.id);
    }
  }, [selectedLeadId, leads]);

  // Load database timeline, comments, files for Lead
  const loadTimelineAndComments = async (leadId: string) => {
    if (isSupabaseActive()) {
      try {
        // Fetch Activities
        const { data: acts } = await supabase
          .from('atividades')
          .select('*')
          .eq('relacionamento_id', leadId)
          .order('created_at', { ascending: false });
        
        setTimelineItems(acts || []);

        // Fetch Comments
        const { data: dbLead } = await supabase
          .from('leads')
          .select('comments')
          .eq('id', leadId)
          .single();
        setCommentsList(dbLead?.comments || []);

      } catch (err) {
        console.error(err);
      }
    } else {
      // Local mockup timeline
      setTimelineItems(selectedLead?.timeline || []);
      setCommentsList(selectedLead?.comments || []);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Add Lead Action
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany || !formContactName) return;

    // Faturamento Mensal is mandatory if stage is not prospeccao
    if (formStage !== 'prospeccao' && !formMonthlyRevenue) {
      setModalError('O Faturamento Mensal da Empresa é obrigatório a partir do estágio de Qualificação.');
      return;
    }

    // Negociação requires expectedCloseDate
    if (formStage === 'negociacao' && !formExpectedDate) {
      setModalError('A Data Prevista de Fechamento é obrigatória no estágio de Negociação.');
      return;
    }

    // Validation for Commercial Conditions
    if (formStage === 'negociacao' || formStage === 'contrato') {
      if (formSetupPaymentMethod === 'parcelado') {
        if (!formSetupInstallmentsCount || Number(formSetupInstallmentsCount) <= 0) {
          setModalError('A quantidade de parcelas é obrigatória.');
          return;
        }
        if (!formSetupFirstInstallmentDate) {
          setModalError('A data da primeira parcela é obrigatória.');
          return;
        }
      }
      if (!formMrrDueDay) {
        setModalError('O dia de vencimento da mensalidade é obrigatório.');
        return;
      }
    }

    const aiScore = Math.floor(Math.random() * (99 - 70 + 1)) + 70;
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      company: formCompany,
      contactName: formContactName,
      role: formRole,
      phone: formPhone,
      whatsapp: formWhatsapp,
      email: formEmail,
      value: Number(formSetupValue) || 0,
      stage: formStage,
      priority: formPriority,
      owner: formOwner || undefined,
      source: formSource,
      segment: formSegment,
      employeeCount: formEmployeeCount ? Number(formEmployeeCount) : undefined,
      monthlyRevenue: formMonthlyRevenue ? Number(formMonthlyRevenue) : undefined,
      expectedDate: formExpectedDate || undefined,
      needs: formNeeds,
      aiScore,
      aiInsights: `Lead cadastrado. Fit analisado de ${aiScore}%.`,
      dateAdded: new Date().toLocaleDateString('pt-BR'),
      observations: formNeeds ? [formNeeds] : [],
      timeline: [{ date: new Date().toLocaleDateString('pt-BR'), title: 'Lead Cadastrado', desc: 'Negócio inserido no funil.' }],
      comments: [],
      productsNegotiated: formProducts,
      mrrValue: Number(formMrr),
      percentage: Number(formCommission),
      cnpj: formCnpj || undefined,
      address: formAddress || undefined,
      city: formCity || undefined,
      state: formState || undefined,
      country: formCountry || undefined,
      setupPaymentMethod: formSetupPaymentMethod,
      setupPaymentDate: formSetupPaymentDate || undefined,
      setupInstallmentsCount: formSetupPaymentMethod === 'parcelado' ? Number(formSetupInstallmentsCount) : undefined,
      setupInstallmentValue: formSetupPaymentMethod === 'parcelado' ? Number(formSetupInstallmentValue) : undefined,
      setupFirstInstallmentDate: formSetupPaymentMethod === 'parcelado' ? formSetupFirstInstallmentDate || undefined : undefined,
      mrrDueDay: formMrrDueDay ? getDayFromDateString(formMrrDueDay) : 10
    };

    try {
      setModalError(null);
      const success = await addLead(newLead);
      if (success) {
        setIsAddModalOpen(false);
        resetAddForm();
        showToast('Lead criado com sucesso! 🎉');
      } else {
        const freshError = useLeadStore.getState().error;
        setModalError(freshError || 'Erro ao salvar o lead. Verifique se executou o script migration.sql.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Erro ao criar o lead.');
    }
  };

  const resetAddForm = () => {
    setFormCompany('');
    setFormContactName('');
    setFormRole('');
    setFormPhone('');
    setFormWhatsapp(true);
    setFormEmail('');
    setFormPriority('media');
    setFormStage('prospeccao');
    setFormOwner('');
    setFormSource('Outbound');
    setFormSegment('');
    setFormEmployeeCount('');
    setFormMonthlyRevenue('');
    setFormExpectedDate('');
    setFormNeeds('');
    setFormProducts([]);
    setFormCnpj('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormCountry('');
    setFormSetupPaymentMethod('a_vista');
    setFormSetupPaymentDate('');
    setFormSetupInstallmentsCount('1');
    setFormSetupInstallmentValue('');
    setFormSetupFirstInstallmentDate('');
    setFormMrrDueDay('10');
    setFormSetupValue('');
    setModalError(null);
  };

  // Save Lead Edits (Drawer)
  const handleSaveEdits = async () => {
    const triggerValidationError = (msg: string) => {
      setValidationError(msg);
      setTimeout(() => {
        document.getElementById('drawer-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    };

    if (!editFields.company) {
      triggerValidationError('⚠️ O nome da empresa é obrigatório.');
      return;
    }
    if (!editFields.contactName) {
      triggerValidationError('⚠️ O nome do contato é obrigatório.');
      return;
    }

    // Faturamento Mensal da Empresa is mandatory starting from Qualificação
    if (editFields.stage !== 'prospeccao' && !editFields.monthlyRevenue) {
      triggerValidationError('⚠️ O Faturamento Mensal da Empresa é obrigatório a partir do estágio de Qualificação.');
      return;
    }

    // Regras de validação do PRD
    if (editFields.stage === 'negociacao' && !editFields.expectedDate) {
      triggerValidationError('⚠️ A Data Prevista de Fechamento é obrigatória no estágio de Negociação.');
      return;
    }

    if (editFields.stage === 'fechado' && !editFields.owner) {
      triggerValidationError('⚠️ O Lead não pode ser fechado/convertido sem um responsável (Responsável).');
      return;
    }

    // Validation for Commercial Conditions in Drawer
    if (editFields.stage === 'negociacao' || editFields.stage === 'contrato' || editFields.stage === 'fechado') {
      if (editFields.setupPaymentMethod === 'parcelado') {
        if (!editFields.setupInstallmentsCount || Number(editFields.setupInstallmentsCount) <= 0) {
          triggerValidationError('⚠️ A quantidade de parcelas é obrigatória.');
          return;
        }
        if (!editFields.setupFirstInstallmentDate) {
          triggerValidationError('⚠️ A data da primeira parcela é obrigatória.');
          return;
        }
      }
      if (!editFields.mrrDueDay) {
        triggerValidationError('⚠️ O dia de vencimento da mensalidade é obrigatório.');
        return;
      }
    }

    setValidationError(null);
    const updatedLead: Lead = {
      ...selectedLead!,
      ...editFields,
      mrrDueDay: editFields.mrrDueDay ? getDayFromDateString(editFields.mrrDueDay) : 10
    } as Lead;

    try {
      const success = await updateLead(updatedLead);
      if (success) {
        if (editFields.stage === 'fechado') {
          if (!isSupabaseActive()) {
            mockOfflineConversion(updatedLead);
          } else {
            // Re-fetch customer list to update Zustand Clientes store immediately
            await fetchClientes();
          }
          showToast('Lead convertido em Cliente com sucesso! 🎉');
        } else {
          showToast('Lead atualizado com sucesso! 🎉');
        }
        setIsDetailDrawerOpen(false);
      } else {
        setValidationError(error || 'Erro ao atualizar o lead. Verifique as configurações de banco.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Erro ao salvar alterações.');
    }
  };

  const mockOfflineConversion = (lead: Lead) => {
    // customers
    const customers = JSON.parse(localStorage.getItem('orka_customers') || '[]');
    
    // Check duplicates by CNPJ or Email
    let existingCust = customers.find((c: any) => 
      (lead.cnpj && c.cnpj === lead.cnpj) || 
      (lead.email && c.email === lead.email) ||
      c.id === lead.id
    );

    const nowStr = new Date().toLocaleDateString('pt-BR');

    if (existingCust) {
      // Update existing
      existingCust.originalLead = lead.company;
      existingCust.conversionDate = nowStr;
      existingCust.convertedBy = lead.owner || 'Comercial';
      existingCust.monthlySpend = lead.mrrValue || 0;
      existingCust.setupValue = lead.value || 0;
      existingCust.mrrValue = lead.mrrValue || 0;
      existingCust.poc = lead.contactName;
      existingCust.contactName = lead.contactName;
      existingCust.email = lead.email;
      existingCust.phone = lead.phone;
      existingCust.whatsapp = lead.whatsapp;
      existingCust.productsNegotiated = lead.productsNegotiated;
      existingCust.monthlyRevenue = lead.monthlyRevenue || 0;
      existingCust.mrrDueDay = lead.mrrDueDay || 10;
    } else {
      // Create new
      customers.push({
        id: lead.id,
        name: lead.company,
        status: 'active',
        poc: lead.contactName,
        contactName: lead.contactName,
        role: lead.role,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
        cnpj: lead.cnpj,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        segment: lead.segment,
        owner: lead.owner,
        source: lead.source,
        productsNegotiated: lead.productsNegotiated || [],
        setupValue: lead.value || 0,
        mrrValue: lead.mrrValue || 0,
        observations: lead.observations || [],
        tags: lead.tags || [],
        monthlySpend: lead.mrrValue || 0,
        plan: 'Plano Simulação',
        startDate: nowStr,
        conversionDate: nowStr,
        originalLead: lead.company,
        convertedBy: lead.owner || 'Comercial',
        monthlyRevenue: lead.monthlyRevenue || 0,
        mrrDueDay: lead.mrrDueDay || 10
      });
    }
    localStorage.setItem('orka_customers', JSON.stringify(customers));

    // projects
    const projects = JSON.parse(localStorage.getItem('orka_projects') || '[]');
    const generatedProjectId = `proj-${Date.now()}`;
    projects.push({
      id: generatedProjectId,
      name: `Projeto - ${lead.company}`,
      description: 'Projeto operacional gerado automaticamente a partir da conversão.',
      stage: 'fila',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      priority: 'media',
      progress: 0
    });
    localStorage.setItem('orka_projects', JSON.stringify(projects));

    // transactions
    const trxs = JSON.parse(localStorage.getItem('orka_transactions') || '[]');
    if ((lead.value) > 0) {
      if (lead.setupPaymentMethod === 'a_vista') {
        trxs.push({
          id: `trx-${Date.now()}-setup`,
          type: 'income',
          description: `Taxa de Setup - ${lead.company}`,
          value: lead.value,
          due_date: lead.setupPaymentDate || nowStr,
          status: 'Pendente',
          party: lead.company,
          category: 'Setup',
          projectId: generatedProjectId,
          tenant_id: lead.tenant_id
        });
      } else if (lead.setupPaymentMethod === 'parcelado' && lead.setupInstallmentsCount) {
        const instVal = lead.setupInstallmentValue || Math.round(lead.value / lead.setupInstallmentsCount);
        const firstDateStr = lead.setupFirstInstallmentDate || nowStr;
        
        const parts = firstDateStr.split('/');
        const firstDate = parts.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : new Date();

        for (let i = 0; i < lead.setupInstallmentsCount; i++) {
          const installmentDate = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, firstDate.getDate());
          const dateStr = installmentDate.toLocaleDateString('pt-BR');
          trxs.push({
            id: `trx-${Date.now()}-setup-${i}`,
            type: 'income',
            description: `Taxa de Setup - ${lead.company} (Parcela ${i+1}/${lead.setupInstallmentsCount})`,
            value: instVal,
            due_date: dateStr,
            status: 'Pendente',
            party: lead.company,
            category: 'Setup',
            installmentNumber: i + 1,
            projectId: generatedProjectId,
            tenant_id: lead.tenant_id
          });
        }
      } else {
        trxs.push({
          id: `trx-${Date.now()}-setup`,
          type: 'income',
          description: `Taxa de Setup - ${lead.company}`,
          value: lead.value,
          due_date: nowStr,
          status: 'Pendente',
          party: lead.company,
          category: 'Setup',
          projectId: generatedProjectId,
          tenant_id: lead.tenant_id
        });
      }
    }


    if ((lead.mrrValue || 0) > 0) {
      let dueDate: Date;
      const mrrDueDayRaw = lead.mrrDueDay as unknown as string | number;
      if (typeof mrrDueDayRaw === 'string' && mrrDueDayRaw.includes('-')) {
        // New format: full date string YYYY-MM-DD → use as-is (first installment)
        dueDate = new Date(mrrDueDayRaw + 'T12:00:00');
      } else {
        // Legacy format: day number (10, 20, 30)
        const mrrDay = Number(mrrDueDayRaw) || 10;
        const today = new Date();
        let dueYear = today.getFullYear();
        let dueMonth = today.getMonth();
        if (today.getDate() > mrrDay) dueMonth += 1;
        dueDate = new Date(dueYear, dueMonth, mrrDay);
      }

      trxs.push({
        id: `trx-${Date.now()}-mrr`,
        type: 'income',
        description: `Mensalidade (MRR) - ${lead.company}`,
        value: lead.mrrValue,
        due_date: dueDate.toLocaleDateString('pt-BR'),
        status: 'Pendente',
        party: lead.company,
        category: 'Assinatura',
        projectId: generatedProjectId,
        tenant_id: lead.tenant_id
      });
    }

    localStorage.setItem('orka_transactions', JSON.stringify(trxs));
  };

  const handleConfirmPendingMove = async () => {
    if (!pendingMove || !pendingExpectedDate) return;
    const { leadId, targetStage, oldStage } = pendingMove;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      setPendingMove(null);
      return;
    }

    const dateParts = pendingExpectedDate.split('-');
    let formattedDate = pendingExpectedDate;
    if (dateParts.length === 3) {
      formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }

    lead.expectedDate = formattedDate;
    setPendingMove(null);

    try {
      await updateLeadStage(leadId, targetStage, oldStage);
      showToast(`Lead movido para Negociação! 🚀`);
    } catch (err: any) {
      alert(`Erro ao salvar alteração de estágio: ${err.message || 'Erro de conexão.'}`);
    }
  };

  // Drag and Drop implementation with business rules validations
  const handleLeadMove = React.useCallback(async (leadId: string, targetStage: LeadStage) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const oldStage = lead.stage;

    // Reset validations error modal state
    setValidationErrorList([]);
    const errors: string[] = [];



    // Rule 2: Fechado requires comercial owner, products, values
    if (targetStage === 'fechado') {
      if (!lead.owner) {
        errors.push('Responsável Comercial não definido no Lead.');
      }
      if (!lead.productsNegotiated || lead.productsNegotiated.length === 0) {
        errors.push('Nenhum Produto Negociado associado. Vincule pelo menos um produto ao Lead.');
      }
      const hasPositiveValues = (lead.value || 0) > 0 || (lead.mrrValue || 0) > 0;
      if (!hasPositiveValues) {
        errors.push('Os valores totais de Setup ou MRR negociados devem ser maiores que zero.');
      }
    }

    // Rule 3: Negociação expected date confirmation prompt if missing
    if (targetStage === 'negociacao' && !lead.expectedDate) {
      setPendingMove({ leadId, targetStage, oldStage });
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setPendingExpectedDate(todayStr);
      return;
    }

    if (errors.length > 0) {
      setValidationErrorList(errors);
      setIsValidationModalOpen(true);
      return;
    }

    // Optimistic UI state update via Zustand store
    try {
      await updateLeadStage(leadId, targetStage, oldStage);
      
      if (targetStage === 'fechado') {
        if (!isSupabaseActive()) {
          mockOfflineConversion({ ...lead, stage: targetStage });
        } else {
          // Re-fetch customer list to update Zustand Clientes store immediately
          await fetchClientes();
        }
        showToast('Lead convertido em Cliente com sucesso. 🎉');
      } else if (oldStage === 'fechado') {
        // Lead saiu de Fechado → Trigger SQL reverte conversão automaticamente
        if (isSupabaseActive()) {
          await fetchClientes();
        }
        showToast('Conversão revertida. Cliente desativado e registros financeiros removidos. ⚠️');
      } else {
        showToast(`Lead movido para ${STAGES.find(s => s.id === targetStage)?.label}! 🚀`);
        if (targetStage === 'contrato') {
          setSelectedLeadId(leadId);
          setIsDetailDrawerOpen(true);
        }
      }
    } catch (err: any) {
      alert(`Erro ao salvar alteração de estágio: ${err.message || 'Erro de conexão.'}`);
    }
  }, [leads, updateLeadStage, mockOfflineConversion, fetchClientes]);

  // Add Comment Action
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedLeadId) return;

    const list = [...commentsList, `${userProfile?.name || 'Usuário'}: ${newCommentText}`];
    
    if (isSupabaseActive()) {
      try {
        await supabase.from('leads').update({ comments: list }).eq('id', selectedLeadId);
        // Create activity
        await supabase.from('atividades').insert({
          relacionamento_tipo: 'lead',
          relacionamento_id: selectedLeadId,
          titulo: 'Comentário Adicionado',
          descricao: `${userProfile?.name || 'Usuário'} adicionou um comentário.`
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      const lead = leads.find(l => l.id === selectedLeadId);
      if (lead) {
        lead.comments = list;
        lead.timeline?.unshift({
          date: new Date().toLocaleDateString('pt-BR'),
          title: 'Comentário Adicionado',
          desc: newCommentText
        });
        await updateLead(lead);
      }
    }
    setCommentsList(list);
    setNewCommentText('');
    loadTimelineAndComments(selectedLeadId);
  };

  // Create Proposal Action
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !propSetup || !propMrr) return;

    const newProp: Proposta = {
      id: `prop-${Date.now()}`,
      leadId: selectedLeadId,
      valorSetup: Number(propSetup),
      valorMrr: Number(propMrr),
      probabilidade: Number(propProb),
      status: propStatus,
      dataPrevista: propDate || undefined
    };

    const success = await addProposta(newProp);
    if (success) {
      setIsProposalModalOpen(false);
      setPropSetup('');
      setPropMrr('');
      setPropDate('');
      
      // Update Lead total value based on this proposal
      const lead = leads.find(l => l.id === selectedLeadId);
      if (lead) {
        const updated = {
          ...lead,
          value: Number(propSetup),
          mrrValue: Number(propMrr),
          probability: Number(propProb),
          expectedDate: propDate || lead.expectedDate
        };
        await updateLead(updated);
      }
    }
  };

  // Open Delete Confirm Dialog
  const handleLeadClick = React.useCallback((leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDetailDrawerOpen(true);
  }, []);

  const handleDeleteClick = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeadToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (leadToDeleteId) {
      const success = await deleteLead(leadToDeleteId);
      if (success) {
        setSelectedLeadId(null);
        setIsDetailDrawerOpen(false);
      }
    }
    setIsDeleteConfirmOpen(false);
    setLeadToDeleteId(null);
  };

  // Filtering leads
  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
    const matchesOwner = ownerFilter === 'all' || l.owner === ownerFilter;
    const matchesPriority = priorityFilter === 'all' || l.priority === priorityFilter;
    
    return matchesSearch && matchesStage && matchesOwner && matchesPriority;
  });

  // Sorting leads
  const priorityWeight = { alta: 3, media: 2, baixa: 1 };
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'priority') {
      const wA = priorityWeight[a.priority || 'baixa'];
      const wB = priorityWeight[b.priority || 'baixa'];
      return wB - wA;
    }
    return 0; // Default
  });

  return (
    <PageContainer>
      <header className="mobile-header-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Central de Leads</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Gestão comercial e funil de prospecção da ORKA</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('kanban')}
            >
              Funil Kanban
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('list')}
            >
              Lista
            </button>
          </div>
          <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Adicionar Lead</span>
          </button>
        </div>
      </header>

      {/* Filter and Search Section */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={tempSearchQuery} onChange={setTempSearchQuery} placeholder="Buscar por empresa, contato ou e-mail..." />
        
        <div className="mobile-filters-row" style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Estágios</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          
          <select 
            value={ownerFilter} 
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="form-select"
            style={{ width: '180px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Responsáveis</option>
            {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>

          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '6px 12px' }}
          >
            <option value="all">Todas as Prioridades</option>
            <option value="alta">🔴 Alta</option>
            <option value="media">🟡 Média</option>
            <option value="baixa">🟢 Baixa</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
            className="form-select"
            style={{ width: '170px', padding: '6px 12px' }}
          >
            <option value="date">Ordenar por Data</option>
            <option value="priority">Ordenar por Prioridade</option>
          </select>
        </div>
      </section>

      {loading && <LoadingOverlay active={true} message="Carregando Leads comercial..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <React.Suspense fallback={<KanbanSkeleton />}>
          <KanbanBoard
            leads={sortedLeads}
            stages={STAGES}
            onLeadMove={handleLeadMove}
            onLeadClick={handleLeadClick}
            onLeadDelete={handleDeleteClick}
          />
        </React.Suspense>
      ) : (
        /* List View */
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Empresa</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Contato</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Valor Estimado</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Estágio</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Responsável</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Prioridade</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>AI Score</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map(l => (
                <tr 
                  key={l.id} 
                  onClick={() => {
                    setSelectedLeadId(l.id);
                    setIsDetailDrawerOpen(true);
                  }}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{l.company}</td>
                  <td style={{ padding: '12px 16px' }}>{l.contactName}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(l.value)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: STAGES.find(s => s.id === l.stage)?.color || '#fff'
                    }}>
                      {STAGES.find(s => s.id === l.stage)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{l.owner || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: l.priority === 'alta' ? 'rgba(239, 68, 68, 0.1)' : l.priority === 'media' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: l.priority === 'alta' ? '#EF4444' : l.priority === 'media' ? '#F59E0B' : '#10B981'
                    }}>
                      {l.priority === 'alta' ? '🔴 Alta' : l.priority === 'media' ? '🟡 Média' : '🟢 Baixa'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {l.aiScore ? (
                      <span style={{ color: '#C084FC', fontWeight: 700 }}>{l.aiScore}%</span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="icon-btn" 
                      onClick={(e) => handleDeleteClick(l.id, e)}
                      style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedLeads.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum lead encontrado.</div>
          )}
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '560px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Criar Novo Negócio (Lead)</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            
            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}
            
            <div className="max-h-[60vh] overflow-y-auto pb-10 px-1 -mx-1">
              <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Empresa *</span>
                  <input type="text" className="form-input" value={formCompany} onChange={(e) => setFormCompany(e.target.value)} required placeholder="Ex: Stripe Inc" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <span className="input-label">Contato *</span>
                  <input type="text" className="form-input" value={formContactName} onChange={(e) => setFormContactName(e.target.value)} required placeholder="Ex: Mariana Silva" />
                </div>
                <div className="input-group">
                  <span className="input-label">Cargo</span>
                  <input type="text" className="form-input" value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder="Ex: Diretora de TI" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <span className="input-label">Telefone</span>
                  <input type="text" className="form-input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Ex: (11) 98888-7777" />
                </div>
                <div className="input-group">
                  <span className="input-label">E-mail</span>
                  <input type="email" className="form-input" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Ex: mariana@stripe.com" />
                </div>
              </div>

              {/* Selecionar e Vincular Produtos */}
              <div style={{
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <span className="input-label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Produtos Negociados</span>
                
                {/* Dropdown de Seleção */}
                <div className="input-group">
                  <span className="input-label" style={{ fontSize: '0.75rem' }}>Vincular Produto</span>
                  <select 
                    className="form-select" 
                    value="" 
                    onChange={(e) => {
                      const prodId = e.target.value;
                      if (!prodId) return;
                      const selected = products.find(p => p.id === prodId);
                      if (selected) {
                        if (formProducts.some(p => p.productId === selected.id)) {
                          alert('Este produto já foi adicionado.');
                          return;
                        }
                        setFormProducts([
                          ...formProducts,
                          {
                            productId: selected.id,
                            name: selected.nome,
                            setup: selected.setup,
                            mrr: selected.mrr,
                            percentual: selected.percentual
                          }
                        ]);
                      }
                    }}
                  >
                    <option value="">-- Selecione para Adicionar --</option>
                    {products.filter(p => p.status === 'ativo').map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Lista de Produtos Selecionados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formProducts.map((p, index) => (
                    <div 
                      key={p.productId} 
                      style={{
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{p.name}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setFormProducts(formProducts.filter(item => item.productId !== p.productId));
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--color-danger)',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          [ Remover ]
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Setup (R$)</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                            value={p.setup} 
                            onChange={(e) => {
                              const val = Number(e.target.value || 0);
                              setFormProducts(formProducts.map((item, idx) => idx === index ? { ...item, setup: val } : item));
                            }} 
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Mensalidade (R$)</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                            value={p.mrr} 
                            onChange={(e) => {
                              const val = Number(e.target.value || 0);
                              setFormProducts(formProducts.map((item, idx) => idx === index ? { ...item, mrr: val } : item));
                            }} 
                          />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Comissão (%)</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                            value={p.percentual} 
                            onChange={(e) => {
                              const val = Number(e.target.value || 0);
                              setFormProducts(formProducts.map((item, idx) => idx === index ? { ...item, percentual: val } : item));
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {formProducts.length === 0 && (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                      Nenhum produto vinculado ainda.
                    </div>
                  )}
                </div>

                {formProducts.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    marginTop: '8px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Total Setup</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(formProducts.reduce((acc, p) => acc + p.setup, 0))}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Total MRR</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(formProducts.reduce((acc, p) => acc + p.mrr, 0))}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Comissão Estimada</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-warning)' }}>{formatCurrency(formProducts.reduce((acc, p) => acc + (Number(formMonthlyRevenue) || 0) * (p.percentual / 100), 0))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <span className="input-label">Estágio Inicial</span>
                  <select className="form-select" value={formStage} onChange={(e) => setFormStage(e.target.value as LeadStage)}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Prioridade *</span>
                  <select className="form-select" value={formPriority} onChange={(e) => setFormPriority(e.target.value as 'alta' | 'media' | 'baixa')}>
                    <option value="alta">🔴 Alta</option>
                    <option value="media">🟡 Média</option>
                    <option value="baixa">🟢 Baixa</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on Stage */}
              {formStage !== 'prospeccao' && (
                <div className="input-group">
                  <span className="input-label">Faturamento Mensal da Empresa (R$) *</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formMonthlyRevenue} 
                    onChange={(e) => setFormMonthlyRevenue(e.target.value)} 
                    placeholder="Ex: 50000" 
                    required 
                  />
                </div>
              )}

              {formStage === 'negociacao' && (
                <div className="input-group">
                  <span className="input-label">Data Prevista de Negociação *</span>
                  <input type="date" className="form-input" value={formExpectedDate} onChange={(e) => setFormExpectedDate(e.target.value)} required />
                </div>
              )}

              {/* Seção Condições Comerciais */}
              {(formStage === 'negociacao' || formStage === 'contrato') && (
                <div style={{
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <span className="input-label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Condições Comerciais</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <span className="input-label">Forma de pagamento do Setup</span>
                      <select 
                        className="form-select" 
                        value={formSetupPaymentMethod} 
                        onChange={(e) => setFormSetupPaymentMethod(e.target.value as any)}
                      >
                        <option value="a_vista">À vista</option>
                        <option value="parcelado">Parcelado</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <span className="input-label">Valor do Setup (R$)</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={formSetupValue} 
                        onChange={(e) => setFormSetupValue(e.target.value)} 
                        placeholder="Valor do Setup" 
                      />
                    </div>
                  </div>

                  {formSetupPaymentMethod === 'a_vista' && (
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <span className="input-label">Data prevista de pagamento do Setup</span>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={formSetupPaymentDate} 
                        onChange={(e) => setFormSetupPaymentDate(e.target.value)} 
                      />
                    </div>
                  )}

                  {formSetupPaymentMethod === 'parcelado' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span className="input-label">Quantidade de parcelas *</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={formSetupInstallmentsCount} 
                            onChange={(e) => setFormSetupInstallmentsCount(e.target.value)} 
                            placeholder="Ex: 6"
                            required
                          />
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span className="input-label">Valor de cada parcela (R$)</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={formSetupInstallmentValue} 
                            onChange={(e) => setFormSetupInstallmentValue(e.target.value)} 
                          />
                        </div>
                      </div>

                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <span className="input-label">Data da primeira parcela *</span>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={formSetupFirstInstallmentDate} 
                          onChange={(e) => setFormSetupFirstInstallmentDate(e.target.value)} 
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <span className="input-label">Data de vencimento da mensalidade (MRR) *</span>
                    <input
                      type="date"
                      className="form-input"
                      value={formMrrDueDay}
                      onChange={(e) => setFormMrrDueDay(e.target.value)}
                      required
                    />
                    {formMrrDueDay && (() => {
                      const d = new Date(formMrrDueDay + 'T12:00:00');
                      const next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
                      return <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Próxima parcela: {next.toLocaleDateString('pt-BR')}</span>;
                    })()}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="input-group">
                  <span className="input-label">Responsável Comercial</span>
                  <select className="form-select" value={formOwner} onChange={(e) => setFormOwner(e.target.value)}>
                    <option value="">Nenhum</option>
                    {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Origem do Lead</span>
                  <select className="form-select" value={formSource} onChange={(e) => setFormSource(e.target.value)}>
                    <option value="Site">Site</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Indicação">Indicação</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Necessidades & Dores</span>
                <textarea className="form-input" style={{ minHeight: '80px', resize: 'none' }} value={formNeeds} onChange={(e) => setFormNeeds(e.target.value)} placeholder="Quais as dores principais..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar Lead</button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail / Edit Drawer */}
      {isDetailDrawerOpen && selectedLead && (
        <div className="drawer-overlay" onClick={() => setIsDetailDrawerOpen(false)} style={{ zIndex: 900 }}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ width: '600px', padding: '24px', zIndex: 901 }}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{editFields.company}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ficha de Lead Comercial</span>
              </div>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsDetailDrawerOpen(false)}>✕</button>
            </div>

            {/* Tab navigation */}
            <div className="flex overflow-x-auto scrollbar-none" style={{ gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              {(['details', 'timeline', 'comments', 'files'] as const).map((tab) => (
                <button
                  key={tab}
                  className="whitespace-nowrap"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'details' ? 'Editar Detalhes' : 
                   tab === 'timeline' ? 'Timeline' :
                   tab === 'comments' ? 'Comentários' : 'Arquivos'}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div id="drawer-scroll-container" className="pb-10" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {validationError && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                  {validationError}
                </div>
              )}

              {activeTab === 'details' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <span className="input-label">Empresa</span>
                    <input type="text" className="form-input" value={editFields.company || ''} onChange={(e) => setEditFields({ ...editFields, company: e.target.value })} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="input-group">
                      <span className="input-label">Contato</span>
                      <input type="text" className="form-input" value={editFields.contactName || ''} onChange={(e) => setEditFields({ ...editFields, contactName: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <span className="input-label">Cargo</span>
                      <input type="text" className="form-input" value={editFields.role || ''} onChange={(e) => setEditFields({ ...editFields, role: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Telefone</span>
                      <input type="text" className="form-input" value={editFields.phone || ''} onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <span className="input-label">E-mail</span>
                      <input type="email" className="form-input" value={editFields.email || ''} onChange={(e) => setEditFields({ ...editFields, email: e.target.value })} />
                    </div>
                  </div>

                  {/* Selecionar e Vincular Produtos no Drawer */}
                  <div style={{
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <span className="input-label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Produtos Negociados</span>
                    
                    {/* Dropdown de Seleção */}
                    <div className="input-group">
                      <span className="input-label" style={{ fontSize: '0.75rem' }}>Vincular Produto</span>
                      <select 
                        className="form-select" 
                        value="" 
                        onChange={(e) => {
                          const prodId = e.target.value;
                          if (!prodId) return;
                          const selected = products.find(p => p.id === prodId);
                          if (selected) {
                            const list = editFields.productsNegotiated || [];
                            if (list.some(p => p.productId === selected.id)) {
                              alert('Este produto já foi adicionado.');
                              return;
                            }
                            const updatedList = [
                              ...list,
                              {
                                productId: selected.id,
                                name: selected.nome,
                                setup: selected.setup,
                                mrr: selected.mrr,
                                percentual: selected.percentual
                              }
                            ];
                            handleDrawerProductChange(updatedList);
                          }
                        }}
                      >
                        <option value="">-- Selecione para Adicionar --</option>
                        {products.filter(p => p.status === 'ativo').map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Lista de Produtos no Drawer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(editFields.productsNegotiated || []).map((p, index) => (
                        <div 
                          key={p.productId} 
                          style={{
                            padding: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{p.name}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                const list = editFields.productsNegotiated || [];
                                const updatedList = list.filter(item => item.productId !== p.productId);
                                handleDrawerProductChange(updatedList);
                              }}
                              style={{
                                border: 'none',
                                background: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                fontSize: '0.72rem',
                                fontWeight: 600
                              }}
                            >
                              [ Remover ]
                            </button>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Setup (R$)</span>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                                value={p.setup} 
                                onChange={(e) => {
                                  const val = Number(e.target.value || 0);
                                  const list = editFields.productsNegotiated || [];
                                  const updatedList = list.map((item, idx) => idx === index ? { ...item, setup: val } : item);
                                  handleDrawerProductChange(updatedList);
                                }} 
                              />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Mensalidade (R$)</span>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                                value={p.mrr} 
                                onChange={(e) => {
                                  const val = Number(e.target.value || 0);
                                  const list = editFields.productsNegotiated || [];
                                  const updatedList = list.map((item, idx) => idx === index ? { ...item, mrr: val } : item);
                                  handleDrawerProductChange(updatedList);
                                }} 
                              />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Comissão (%)</span>
                              <input 
                                type="number" 
                                className="form-input" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                                value={p.percentual} 
                                onChange={(e) => {
                                  const val = Number(e.target.value || 0);
                                  const list = editFields.productsNegotiated || [];
                                  const updatedList = list.map((item, idx) => idx === index ? { ...item, percentual: val } : item);
                                  handleDrawerProductChange(updatedList);
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!editFields.productsNegotiated || editFields.productsNegotiated.length === 0) && (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                          Nenhum produto vinculado ainda.
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Estágio</span>
                      <select className="form-select" value={editFields.stage || 'prospeccao'} onChange={(e) => setEditFields({ ...editFields, stage: e.target.value as LeadStage })}>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Prioridade</span>
                      <select className="form-select" value={editFields.priority || 'baixa'} onChange={(e) => setEditFields({ ...editFields, priority: e.target.value as 'alta' | 'media' | 'baixa' })}>
                        <option value="alta">🔴 Alta</option>
                        <option value="media">🟡 Média</option>
                        <option value="baixa">🟢 Baixa</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional render: Faturamento Mensal (monthlyRevenue) in Qualificação or later */}
                  {editFields.stage !== 'prospeccao' && (
                    <div className="input-group">
                      <span className="input-label">Faturamento Mensal da Empresa (R$) *</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={editFields.monthlyRevenue || ''} 
                        onChange={(e) => setEditFields({ ...editFields, monthlyRevenue: Number(e.target.value) })} 
                        required 
                      />
                    </div>
                  )}

                  {/* Conditional render: Data Prevista (expectedDate) in Negociação */}
                  {editFields.stage === 'negociacao' && (
                    <div className="input-group">
                      <span className="input-label">Data Prevista de Negociação *</span>
                      <input type="date" className="form-input" value={editFields.expectedDate || ''} onChange={(e) => setEditFields({ ...editFields, expectedDate: e.target.value })} required />
                    </div>
                  )}

                  {/* Seção Condições Comerciais no Drawer */}
                  {(editFields.stage === 'negociacao' || editFields.stage === 'contrato' || editFields.stage === 'fechado') && (
                    <div style={{
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <span className="input-label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Condições Comerciais</span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span className="input-label">Forma de pagamento do Setup</span>
                          <select 
                            className="form-select" 
                            value={editFields.setupPaymentMethod || 'a_vista'} 
                            onChange={(e) => setEditFields({ ...editFields, setupPaymentMethod: e.target.value as any })}
                          >
                            <option value="a_vista">À vista</option>
                            <option value="parcelado">Parcelado</option>
                          </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span className="input-label">Valor do Setup (R$)</span>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={editFields.value || 0} 
                            onChange={(e) => setEditFields({ ...editFields, value: Number(e.target.value) })} 
                          />
                        </div>
                      </div>

                      {editFields.setupPaymentMethod === 'a_vista' && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <span className="input-label">Data prevista de pagamento do Setup</span>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={editFields.setupPaymentDate || ''} 
                            onChange={(e) => setEditFields({ ...editFields, setupPaymentDate: e.target.value })} 
                          />
                        </div>
                      )}

                      {editFields.setupPaymentMethod === 'parcelado' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <span className="input-label">Quantidade de parcelas *</span>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={editFields.setupInstallmentsCount || ''} 
                                onChange={(e) => setEditFields({ ...editFields, setupInstallmentsCount: Number(e.target.value) })} 
                                placeholder="Ex: 6"
                                required
                              />
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <span className="input-label">Valor de cada parcela (R$)</span>
                              <input 
                                type="number" 
                                className="form-input" 
                                value={editFields.setupInstallmentValue || ''} 
                                onChange={(e) => setEditFields({ ...editFields, setupInstallmentValue: Number(e.target.value) })} 
                              />
                            </div>
                          </div>

                          <div className="input-group" style={{ marginBottom: 0 }}>
                            <span className="input-label">Data da primeira parcela *</span>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={editFields.setupFirstInstallmentDate || ''} 
                              onChange={(e) => setEditFields({ ...editFields, setupFirstInstallmentDate: e.target.value })} 
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <span className="input-label">Data de vencimento da mensalidade (MRR) *</span>
                        <input
                          type="date"
                          className="form-input"
                          value={editFields.mrrDueDay ? getDateStringFromDayNumber(editFields.mrrDueDay) : ''}
                          onChange={(e) => setEditFields({ ...editFields, mrrDueDay: e.target.value as unknown as number })}
                          required
                        />
                        {editFields.mrrDueDay && (() => {
                          const val = getDateStringFromDayNumber(editFields.mrrDueDay);
                          if (!val || !val.includes('-')) return null;
                          const d = new Date(val + 'T12:00:00');
                          const next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
                          return <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Próxima parcela: {next.toLocaleDateString('pt-BR')}</span>;
                        })()}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Responsável</span>
                      <select className="form-select" value={editFields.owner || ''} onChange={(e) => setEditFields({ ...editFields, owner: e.target.value })}>
                        <option value="">Nenhum</option>
                        {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Probabilidade (%)</span>
                      <input type="number" className="form-input" value={editFields.probability || 0} onChange={(e) => setEditFields({ ...editFields, probability: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Mensalidade (MRR)</span>
                      <input type="number" className="form-input" value={editFields.mrrValue || 0} onChange={(e) => setEditFields({ ...editFields, mrrValue: Number(e.target.value) })} />
                    </div>
                  </div>

                  {/* CNPJ and Address Section */}
                  <div style={{
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginTop: '8px'
                  }}>
                    <span className="input-label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Dados Adicionais de Faturamento & Localização</span>
                    
                    <div className="input-group">
                      <span className="input-label">CNPJ (Opcional)</span>
                      <input type="text" className="form-input" placeholder="00.000.000/0000-00" value={editFields.cnpj || ''} onChange={(e) => setEditFields({ ...editFields, cnpj: e.target.value })} />
                    </div>

                    <div className="input-group">
                      <span className="input-label">Endereço</span>
                      <input type="text" className="form-input" placeholder="Rua, Número, Bairro" value={editFields.address || ''} onChange={(e) => setEditFields({ ...editFields, address: e.target.value })} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <span className="input-label">Cidade</span>
                        <input type="text" className="form-input" placeholder="Cidade" value={editFields.city || ''} onChange={(e) => setEditFields({ ...editFields, city: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <span className="input-label">Estado</span>
                        <input type="text" className="form-input" placeholder="UF" value={editFields.state || ''} onChange={(e) => setEditFields({ ...editFields, state: e.target.value })} />
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-label">País</span>
                      <input type="text" className="form-input" placeholder="País" value={editFields.country || ''} onChange={(e) => setEditFields({ ...editFields, country: e.target.value })} />
                    </div>
                  </div>

                </div>
              )}


              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Linha do Tempo Universal</h4>
                  <div className="timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px', marginLeft: '8px' }}>
                    {timelineItems.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-22px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{item.titulo}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.descricao}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : item.date}
                        </div>
                      </div>
                    ))}
                    {timelineItems.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhum log de atividade registrado.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Comentários Internos</h4>
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Escreva uma anotação..." 
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>Enviar</button>
                  </form>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {commentsList.map((comm, idx) => (
                      <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)', lineHeight: 1.4 }}>
                        {comm}
                      </div>
                    ))}
                    {commentsList.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px' }}>
                        Sem comentários. Adicione o primeiro acima!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <LeadFiles 
                  leadId={selectedLead.id} 
                  onFilesChanged={() => loadTimelineAndComments(selectedLead.id)} 
                />
              )}
            </div>
            
            {/* Pinned Action Buttons Footer */}
            {activeTab === 'details' && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--border-color)',
                flexShrink: 0
              }}>
                {validationError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)' }}>
                    {validationError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="primary-btn" style={{ flexGrow: 1, justifyContent: 'center' }} onClick={handleSaveEdits}>
                    Salvar Alterações
                  </button>
                  <button 
                    type="button" 
                    className="outline-btn" 
                    style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', cursor: 'pointer' }} 
                    onClick={(e) => handleDeleteClick(selectedLead.id, e as any)}
                  >
                    Excluir Lead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proposal Add Modal */}
      {isProposalModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="card animate-slide-up" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Adicionar Proposta</h3>
            
            <form onSubmit={handleCreateProposal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <span className="input-label">Setup (R$) *</span>
                <input type="number" className="form-input" value={propSetup} onChange={(e) => setPropSetup(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-label">MRR (R$) *</span>
                <input type="number" className="form-input" value={propMrr} onChange={(e) => setPropMrr(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-label">Probabilidade (%)</span>
                <input type="number" className="form-input" value={propProb} onChange={(e) => setPropProb(e.target.value)} />
              </div>
              <div className="input-group">
                <span className="input-label">Data Prevista</span>
                <input type="date" className="form-input" value={propDate} onChange={(e) => setPropDate(e.target.value)} />
              </div>
              <div className="input-group">
                <span className="input-label">Status</span>
                <select className="form-select" value={propStatus} onChange={(e) => setPropStatus(e.target.value as any)}>
                  <option value="rascunho">Rascunho</option>
                  <option value="enviada">Enviada</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsProposalModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar Proposta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validation Warning Modal */}
      {isValidationModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="card animate-slide-up" style={{ width: '450px', padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', marginBottom: '16px' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Restrições de Movimentação</h3>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Não foi possível mover o lead de estágio devido às seguintes pendências de dados:
            </p>

            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingLeft: '20px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#fff'
            }}>
              {validationErrorList.map((err, idx) => (
                <li key={idx} style={{ lineHeight: '1.4' }}>{err}</li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="outline-btn" 
                onClick={() => setIsValidationModalOpen(false)}
                style={{ cursor: 'pointer' }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingMove && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="card animate-slide-up" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>Data Prevista de Negociação</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              A data prevista de negociação é obrigatória para mover o lead para o estágio de <b>Negociação</b>.
            </p>
            
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <span className="input-label">Data Prevista *</span>
              <input 
                type="date" 
                className="form-input" 
                value={pendingExpectedDate} 
                onChange={(e) => setPendingExpectedDate(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="outline-btn" 
                onClick={() => {
                  setPendingMove(null);
                  showToast('Movimentação cancelada.');
                }}
                style={{ cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="primary-btn" 
                onClick={handleConfirmPendingMove}
                style={{ cursor: 'pointer' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        title="Excluir Lead?"
        message="Esta ação é permanente e removerá todas as propostas vinculadas a este lead comercial. Deseja prosseguir?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1100,
          fontWeight: 600,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}

    </PageContainer>
  );
}
