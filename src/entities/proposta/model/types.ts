export interface Proposta {
  id: string;
  leadId: string;
  valorSetup: number;
  valorMrr: number;
  probabilidade: number;
  status: 'rascunho' | 'enviada' | 'aprovada' | 'recusada';
  dataPrevista?: string;
  createdAt?: string;
}
