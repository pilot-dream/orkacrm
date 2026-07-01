export interface Cliente {
  id: string;
  name: string;
  abbr?: string;
  plan?: string;
  automationsCount?: number;
  monthlySpend?: number;
  status: 'active' | 'inactive';
  startDate?: string;
  poc?: string;
  createdAt?: string;
  
  // Traceability & details
  contactName?: string;
  role?: string;
  email?: string;
  phone?: string;
  whatsapp?: boolean;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  segment?: string;
  owner?: string;
  source?: string;
  tenant_id?: string;
  productsNegotiated?: any[];
  setupValue?: number;
  mrrValue?: number;
  observations?: string[];
  tags?: string[];
  conversionDate?: string;
  originalLead?: string;
  convertedBy?: string;
  monthlyRevenue?: number;
  mrrDueDay?: number;
}
