export type LeadStage = 'prospeccao' | 'qualificacao' | 'negociacao' | 'contrato' | 'fechado' | 'perdido';

export interface NegotiatedProduct {
  productId: string;
  name: string;
  setup: number;
  mrr: number;
  percentual: number;
}

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  value: number;
  needs?: string;
  role?: string;
  phone?: string;
  whatsapp?: boolean;
  email?: string;
  source?: string;
  owner?: string;
  tenant_id?: string;
  segment?: string;
  employeeCount?: number;
  monthlyRevenue?: number; // Only visible in 'qualificacao'
  productsNegotiated?: NegotiatedProduct[];
  mrrValue?: number;
  percentage?: number;
  probability?: number;
  expectedDate?: string; // Mandatory in 'negociacao'
  priority?: 'alta' | 'media' | 'baixa';
  observations?: string[];
  timeline?: any[];
  files?: any[];
  comments?: string[];
  tags?: string[];
  stage: LeadStage;
  aiScore?: number;
  aiInsights?: string;
  dateAdded?: string;
  createdAt?: string;
  deletedAt?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  setupPaymentMethod?: 'a_vista' | 'parcelado';
  setupPaymentDate?: string;
  setupInstallmentsCount?: number;
  setupInstallmentValue?: number;
  setupFirstInstallmentDate?: string;
  mrrDueDay?: number;
}
