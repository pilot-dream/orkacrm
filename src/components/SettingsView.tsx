import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Key, 
  Sun, 
  Moon, 
  Bell, 
  Shield, 
  Plus, 
  Check, 
  Copy, 
  Trash2, 
  Terminal,
  User,
  DollarSign,
  Upload
} from 'lucide-react';
import { isSupabaseActive, supabase } from '../shared/api/supabaseClient';
import type { Profile } from '../entities/usuario/model/types';
import type { Product } from '../entities/produto/model/types';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Comercial' | 'Financeiro' | 'Gestor' | 'Desenvolvedor' | 'Gerente' | 'Vendedor' | 'Analista';
  status: 'Ativo' | 'Convidado' | 'Suspenso';
  tenant_id?: string;
}

interface ApiKeyRegistry {
  id: string;
  name: string;
  token: string;
  scope: 'Full Access' | 'Read Only';
  created: string;
  status: 'Ativa' | 'Revogada';
}

interface ActiveSession {
  id: string;
  browser: string;
  ip: string;
  location: string;
  status: 'Sessão Atual' | 'Ativa';
}

interface SettingsViewProps {
  userProfile: Profile | null;
  onSaveProfile: (profile: Profile) => void;
  team: TeamMember[];
  onAddTeamMember: (member: TeamMember) => Promise<boolean>;
  onDeleteTeamMember: (id: string) => void;
  onUpdateTeamMemberRole: (id: string, role: TeamMember['role']) => void;
  products: Product[];
}

const initialApiKeys: ApiKeyRegistry[] = [
  { id: 'key-1', name: 'Integração HubSpot Live', token: 'ork_live_a18b9c248ddf082e', scope: 'Full Access', created: '10/02/2026', status: 'Ativa' },
  { id: 'key-2', name: 'Webhook Typeform Gatilho', token: 'ork_live_f89c02d184a2d8d8', scope: 'Read Only', created: '15/06/2026', status: 'Ativa' },
];

const initialSessions: ActiveSession[] = [
  { id: 'sess-1', browser: 'Chrome 124.0.0 (Windows 11)', ip: '191.185.120.45', location: 'São Paulo, BR', status: 'Sessão Atual' },
  { id: 'sess-2', browser: 'Safari 17.2 (macOS Sonoma)', ip: '186.230.12.89', location: 'Rio de Janeiro, BR', status: 'Ativa' },
  { id: 'sess-3', browser: 'Firefox 122.0 (Linux Ubuntu)', ip: '177.45.98.112', location: 'Belo Horizonte, BR', status: 'Ativa' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  onSaveProfile,
  team,
  onAddTeamMember,
  onDeleteTeamMember,
  onUpdateTeamMemberRole,
  products
}) => {
  const [activeCategory, setActiveCategory] = useState<'profile' | 'company' | 'team' | 'roles' | 'products' | 'finance' | 'api' | 'theme' | 'notifications' | 'security'>('profile');

  // User Profile Form State
  const [profileForm, setProfileForm] = useState<Profile>({
    email: '',
    name: '',
    role: 'Analista',
    avatar: '',
    details: ''
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm(userProfile);
    }
  }, [userProfile]);

  // Company Profile State
  const [companyName, setCompanyName] = useState('Orka Tecnologias S.A.');
  const [tradeName, setTradeName] = useState('ORKA CRM');
  const [cnpj, setCnpj] = useState('45.890.123/0001-89');
  const [billingEmail, setBillingEmail] = useState('financeiro@orka.ai');
  const [phone, setPhone] = useState('(11) 3280-4500');
  const [address, setAddress] = useState('Av. Paulista, 1000 - Bela Vista');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'jpeg') {
      alert('Apenas arquivos PNG ou JPEG são permitidos.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('O tamanho máximo do arquivo é 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      if (isSupabaseActive()) {
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('arquivos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('arquivos')
          .getPublicUrl(filePath);

        setProfileForm({ ...profileForm, avatar: data.publicUrl });
      } else {
        setTimeout(() => {
          setProfileForm({ ...profileForm, avatar: URL.createObjectURL(file) });
          setUploadingAvatar(false);
        }, 1000);
        return;
      }
    } catch (error: any) {
      alert(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Team State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<TeamMember['role']>('Analista');

  // API State
  const [apiKeys, setApiKeys] = useState<ApiKeyRegistry[]>(initialApiKeys);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<ApiKeyRegistry['scope']>('Full Access');

  // Theme preference
  const [themePref, setThemePref] = useState<'dark' | 'light'>('dark');

  // Notifications State
  const [notifLeadEmail, setNotifLeadEmail] = useState(true);
  const [notifLeadSlack, setNotifLeadSlack] = useState(true);
  const [notifBilling, setNotifBilling] = useState(true);
  const [notifAiSummary, setNotifAiSummary] = useState(false);
  const [notifLatency, setNotifLatency] = useState(true);
  const [notifTaskAssigned, setNotifTaskAssigned] = useState(true);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>(initialSessions);

  // Dynamic style theme switcher
  const handleThemeChange = (theme: 'dark' | 'light') => {
    setThemePref(theme);
    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg-main', '#F3F4F6');
      document.documentElement.style.setProperty('--bg-sidebar', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-card', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-card-hover', '#F9FAFB');
      document.documentElement.style.setProperty('--text-main', '#111827');
      document.documentElement.style.setProperty('--text-secondary', '#4B5563');
      document.documentElement.style.setProperty('--text-muted', '#9CA3AF');
      document.documentElement.style.setProperty('--border-color', '#E5E7EB');
    } else {
      document.documentElement.style.removeProperty('--bg-main');
      document.documentElement.style.removeProperty('--bg-sidebar');
      document.documentElement.style.removeProperty('--bg-card');
      document.documentElement.style.removeProperty('--bg-card-hover');
      document.documentElement.style.removeProperty('--text-main');
      document.documentElement.style.removeProperty('--text-secondary');
      document.documentElement.style.removeProperty('--text-muted');
      document.documentElement.style.removeProperty('--border-color');
    }
  };

  // Actions
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configurações cadastrais da empresa salvas com sucesso!');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newMember: TeamMember = {
      id: `usr-${Math.random().toString().substring(2, 7)}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: 'Ativo'
    };

    const success = await onAddTeamMember(newMember);
    
    if (success) {
      alert('Novo membro da equipe adicionado com sucesso!');
    } else {
      alert('Aviso: Não foi possível gravar o membro no banco de dados. Verifique se a tabela public.team_members existe no seu Supabase. O membro foi gravado temporariamente no cache local (localStorage) deste dispositivo.');
    }

    setIsUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Analista');
  };

  const handleGenerateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    // generate random token
    const characters = 'abcdef0123456789';
    let tokenStr = 'ork_live_';
    for (let i = 0; i < 16; i++) {
      tokenStr += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const newKey: ApiKeyRegistry = {
      id: `key-${Math.random().toString().substring(2, 7)}`,
      name: newKeyName,
      token: tokenStr,
      scope: newKeyScope,
      created: new Date().toLocaleDateString('pt-BR'),
      status: 'Ativa'
    };

    setApiKeys([newKey, ...apiKeys]);
    setIsKeyModalOpen(false);
    setNewKeyName('');
    setNewKeyScope('Full Access');
  };

  const handleCopyKey = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: 'Revogada' } : k));
  };

  const handleRemoveKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert('A nova senha e a confirmação não coincidem.');
      return;
    }
    alert('Senha corporativa atualizada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Render Right Panel Config Pane
  const renderCategoryPane = () => {
    switch (activeCategory) {
      case 'profile': {
        if (!userProfile) return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Carregando perfil do usuário...</div>;
        return (
          <form onSubmit={(e) => {
            e.preventDefault();
            onSaveProfile(profileForm);
            alert('Perfil atualizado com sucesso!');
          }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              {profileForm.avatar ? (
                <img src={profileForm.avatar} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Meu Perfil de Usuário</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Personalize seus dados cadastrais, cargo e foto de exibição.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <span className="input-label">Nome Completo</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label">Cargo / Função</span>
                <select 
                  className="form-select" 
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as any })}
                >
                  <option value="Admin">Admin</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Analista">Analista</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">E-mail (Identificação da Conta)</span>
              <input 
                type="email" 
                className="form-input" 
                value={profileForm.email}
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            <div className="input-group">
              <span className="input-label">Foto de Perfil (Avatar)</span>
              <div 
                className="form-input" 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center', 
                  padding: '8px 12px',
                  height: 'auto'
                }}
              >
                <label 
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    opacity: uploadingAvatar ? 0.6 : 1,
                    pointerEvents: uploadingAvatar ? 'none' : 'auto'
                  }}
                >
                  <Upload size={16} />
                  <span>Escolher arquivo</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
                
                <div style={{ flexGrow: 1, fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {uploadingAvatar ? (
                    'Enviando...'
                  ) : selectedFileName ? (
                    selectedFileName
                  ) : profileForm.avatar ? (
                    'Imagem já configurada'
                  ) : (
                    'Nenhum arquivo escolhido'
                  )}
                </div>

                {profileForm.avatar && !uploadingAvatar && (
                  <button 
                    type="button" 
                    className="outline-btn" 
                    style={{ color: 'var(--color-danger)', border: 'none', padding: '4px 8px', height: 'auto' }} 
                    onClick={() => { setProfileForm({ ...profileForm, avatar: '' }); setSelectedFileName(''); }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Presets Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="input-label">Escolher Presets Orka</span>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'
                ].map((presetUrl, idx) => (
                  <img 
                    key={idx} 
                    src={presetUrl} 
                    alt={`Preset ${idx}`} 
                    onClick={() => setProfileForm({ ...profileForm, avatar: presetUrl })}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      objectFit: 'cover', 
                      cursor: 'pointer',
                      border: profileForm.avatar === presetUrl ? '2.5px solid var(--color-primary-hover)' : '1px solid var(--border-color)',
                      boxShadow: profileForm.avatar === presetUrl ? '0 0 8px rgba(45, 140, 255, 0.4)' : 'none',
                      transition: 'all 0.2s'
                    }} 
                  />
                ))}
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">Dados Adicionais / Bio</span>
              <textarea 
                className="form-input" 
                placeholder="Escreva detalhes sobre suas responsabilidades..." 
                style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
                value={profileForm.details}
                onChange={(e) => setProfileForm({ ...profileForm, details: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-btn">
                Salvar Perfil
              </button>
            </div>
          </form>
        );
      }
      case 'company':
        return (
          <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div className="customer-logo-abbr" style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>
                {tradeName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Perfil da Empresa</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logotipo e dados fiscais de cobrança e cadastro de SaaS.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <span className="input-label">Razão Social</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label">Nome Fantasia</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <span className="input-label">CNPJ Faturamento</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label">E-mail Financeiro</span>
                <input 
                  type="email" 
                  className="form-input" 
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <span className="input-label">Telefone Comercial</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label">Endereço Fiscal</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <span className="input-label">Cidade</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label">Estado (UF)</span>
                <input 
                  type="text" 
                  className="form-input" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="primary-btn">
                Salvar Alterações
              </button>
            </div>
          </form>
        );

      case 'team':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Equipe & Usuários</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gerencie os membros da equipe e defina o nível de permissão de acesso.</p>
              </div>
              <button className="primary-btn" onClick={() => setIsUserModalOpen(true)}>
                <Plus size={16} />
                <span>Adicionar Usuário</span>
              </button>
            </div>

            <div className="table-container">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th>Cargo / Permissão</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="customer-logo-abbr" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', fontWeight: 700 }}>
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600 }}>{member.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{member.email}</td>
                      <td>
                        <span className={`badge ${member.status === 'Ativo' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          {member.status}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="form-select"
                          style={{ width: '130px', height: '32px', padding: '0 8px', fontSize: '0.78rem' }}
                          value={member.role}
                          onChange={(e) => onUpdateTeamMemberRole(member.id, e.target.value as TeamMember['role'])}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Vendedor">Vendedor</option>
                          <option value="Analista">Analista</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button 
                            className="icon-btn" 
                            style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                            onClick={() => onDeleteTeamMember(member.id)}
                          >
                            <Trash2 size={14} />
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

      case 'roles':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Matriz de Cargos & Permissões</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configuração dos níveis de acesso de cada papel no sistema.</p>
            </div>
            
            <div className="table-container">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Cargo</th>
                    <th>Leads</th>
                    <th>Projetos</th>
                    <th>Financeiro</th>
                    <th>Configurações</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Admin', leads: 'Total (Leitura/Escrita)', projects: 'Total (Leitura/Escrita)', finance: 'Total (Leitura/Escrita)', settings: 'Total (Leitura/Escrita)' },
                    { name: 'Gerente', leads: 'Total (Leitura/Escrita)', projects: 'Total (Leitura/Escrita)', finance: 'Total (Leitura/Escrita)', settings: 'Leitura apenas' },
                    { name: 'Vendedor', leads: 'Apenas Próprios (Escrita)', projects: 'Sem Acesso', finance: 'Sem Acesso', settings: 'Sem Acesso' },
                    { name: 'Analista', leads: 'Leitura apenas', projects: 'Total (Leitura/Escrita)', finance: 'Sem Acesso', settings: 'Sem Acesso' }
                  ].map((role, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{role.name}</td>
                      <td><span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 8px', fontSize: '0.7rem' }}>{role.leads}</span></td>
                      <td><span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 8px', fontSize: '0.7rem' }}>{role.projects}</span></td>
                      <td><span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 8px', fontSize: '0.7rem' }}>{role.finance}</span></td>
                      <td><span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 8px', fontSize: '0.7rem' }}>{role.settings}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'products':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Produtos Disponíveis</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Visão geral dos produtos ativos no portfólio comercial.</p>
              </div>
              <a href="/produtos" className="primary-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} />
                <span>Gerenciar Produtos</span>
              </a>
            </div>
            
            <div className="table-container">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Nome do Produto</th>
                    <th>Valor Setup</th>
                    <th>Valor Mensal (MRR)</th>
                    <th>Comissão (%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{p.nome}</td>
                      <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.setup)}</td>
                      <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p.mrr)}/mês</td>
                      <td>{p.percentual}%</td>
                      <td>
                        <span className={`badge ${p.status === 'ativo' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum produto cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'finance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Parâmetros Financeiros & Fiscais</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Definição de alíquotas de impostos, comissão padrão e termos de faturamento.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div className="form-grid force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Alíquota de Imposto sobre Serviços (ISS) (%)</span>
                  <input type="number" className="form-input" defaultValue={5} />
                </div>
                <div className="input-group">
                  <span className="input-label">Comissão Padrão de Vendas (%)</span>
                  <input type="number" className="form-input" defaultValue={10} />
                </div>
              </div>

              <div className="form-grid force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Prazo de Vencimento Padrão (dias)</span>
                  <input type="number" className="form-input" defaultValue={5} />
                </div>
                <div className="input-group">
                  <span className="input-label">Método de Recebimento Preferencial</span>
                  <select className="form-select" defaultValue="pix">
                    <option value="pix">Pix (Imediato)</option>
                    <option value="boleto">Boleto Bancário (1-2 dias)</option>
                    <option value="cartao">Cartão de Crédito</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="primary-btn" onClick={() => alert('Parâmetros financeiros salvos com sucesso!')}>
                  Salvar Parâmetros
                </button>
              </div>
            </div>
          </div>
        );

      case 'api':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Chaves de API (Tokens de Acesso)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gere chaves privadas seguras para integrar serviços externos ao ORKA Brain.</p>
              </div>
              <button className="primary-btn" onClick={() => setIsKeyModalOpen(true)}>
                <Plus size={16} />
                <span>Gerar Nova Chave</span>
              </button>
            </div>

            <div className="table-container">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Nome do Token</th>
                    <th>Chave Secreta</th>
                    <th>Permissão</th>
                    <th>Criação</th>
                    <th>Status</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(key => (
                    <tr key={key.id}>
                      <td style={{ fontWeight: 600 }}>{key.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <code style={{ fontSize: '0.78rem', backgroundColor: '#05070a', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--color-primary)' }}>
                            {key.status === 'Revogada' ? '••••••••••••••••' : key.token}
                          </code>
                          {key.status !== 'Revogada' && (
                            <button 
                              className="icon-btn" 
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: copiedKeyId === key.id ? 'var(--color-success)' : 'var(--text-muted)' }}
                              onClick={() => handleCopyKey(key.token, key.id)}
                              title="Copiar Token"
                            >
                              {copiedKeyId === key.id ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)', fontSize: '0.7rem' }}>
                          {key.scope}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{key.created}</td>
                      <td>
                        <span className={`badge ${key.status === 'Ativa' ? 'badge-success' : 'badge-danger'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                          {key.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {key.status === 'Ativa' ? (
                            <button 
                              className="outline-btn"
                              style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                              onClick={() => handleRevokeKey(key.id)}
                            >
                              Revogar
                            </button>
                          ) : (
                            <button 
                              className="icon-btn"
                              style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                              onClick={() => handleRemoveKey(key.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Tema & Personalização Visual</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Altere a paleta de cores geral da interface do sistema.</p>
            </div>

            <div className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              
              {/* Dark mode select */}
              <div 
                className={`card ${themePref === 'dark' ? 'active-row' : ''}`}
                style={{ cursor: 'pointer', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)' }}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple)' }}>
                  <Moon size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.88rem' }}>Tema Escuro (Padrão)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cores escuras premium de alto contraste para o ORKA CRM.</span>
                </div>
              </div>

              {/* Light mode select */}
              <div 
                className={`card ${themePref === 'light' ? 'active-row' : ''}`}
                style={{ cursor: 'pointer', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-color)' }}
                onClick={() => handleThemeChange('light')}
              >
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(45, 140, 255, 0.1)', color: 'var(--color-primary)' }}>
                  <Sun size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '0.88rem' }}>Tema Claro</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cores claras e limpas otimizadas para ambientes iluminados.</span>
                </div>
              </div>

            </div>
          </div>
        );

      case 'notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Canais & Preferências de Alertas</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure quais eventos operacionais irão disparar alertas imediatos.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Alerta de Novos Leads (E-mail)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Receba um e-mail de notificação imediata quando um lead qualificado for gerado.</span>
                </div>
                <div 
                  className={`automation-switch ${notifLeadEmail ? 'active' : ''}`}
                  onClick={() => setNotifLeadEmail(!notifLeadEmail)}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Alerta de Novos Leads (Slack Feed)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dispare uma mensagem no canal Slack integrado quando um lead for qualificado.</span>
                </div>
                <div 
                  className={`automation-switch ${notifLeadSlack ? 'active' : ''}`}
                  onClick={() => setNotifLeadSlack(!notifLeadSlack)}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Faturamento & Cobranças</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Seja notificado quando uma fatura de cliente for liquidada ou atrasada.</span>
                </div>
                <div 
                  className={`automation-switch ${notifBilling ? 'active' : ''}`}
                  onClick={() => setNotifBilling(!notifBilling)}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Relatório Diário de IA (ORKA Brain)</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Receba o resumo executivo de ROI de IA gerado automaticamente todas as noites.</span>
                </div>
                <div 
                  className={`automation-switch ${notifAiSummary ? 'active' : ''}`}
                  onClick={() => setNotifAiSummary(!notifAiSummary)}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Monitoramento de Latência WhatsApp</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Disparar aviso crítico se o tempo de resposta do robô de WhatsApp ultrapassar 1.5s.</span>
                </div>
                <div 
                  className={`automation-switch ${notifLatency ? 'active' : ''}`}
                  onClick={() => setNotifLatency(!notifLatency)}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Atribuição de Tarefas</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Notifique colaboradores quando novos cartões ou projetos forem atribuídos.</span>
                </div>
                <div 
                  className={`automation-switch ${notifTaskAssigned ? 'active' : ''}`}
                  onClick={() => setNotifTaskAssigned(!notifTaskAssigned)}
                ></div>
              </div>

            </div>
          </div>
        );

      case 'security':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Password edit */}
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Alterar Senha do Administrador</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Renove a credencial de segurança do usuário atual (admin@orka.ai).</p>
              </div>

              <div className="input-group">
                <span className="input-label">Senha Atual</span>
                <input 
                  type="password" 
                  className="form-input" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Nova Senha</span>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Confirmar Nova Senha</span>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="primary-btn">
                  Atualizar Senha
                </button>
              </div>
            </form>

            {/* MFA Config */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Autenticação de Dois Fatores (MFA)</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aumente a segurança exigindo código OTP via e-mail ou aplicativo autenticador no login.</p>
              </div>
              <div 
                className={`automation-switch ${mfaEnabled ? 'active' : ''}`}
                onClick={() => setMfaEnabled(!mfaEnabled)}
              ></div>
            </div>

            {/* Session Logs auditing */}
            <div>
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700 }}>Sessões Ativas de Segurança</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Histórico de dispositivos autenticados na sua conta Orka CRM.</p>
              </div>

              <div className="table-container">
                <table className="customer-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th>Navegador / Plataforma</th>
                      <th>Endereço IP</th>
                      <th>Localização</th>
                      <th>Status</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(sess => (
                      <tr key={sess.id}>
                        <td style={{ fontWeight: 600 }}>{sess.browser}</td>
                        <td>{sess.ip}</td>
                        <td>{sess.location}</td>
                        <td>
                          <span className={`badge ${sess.status === 'Sessão Atual' ? 'badge-success' : 'badge-purple'}`} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                            {sess.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {sess.status !== 'Sessão Atual' ? (
                              <button 
                                className="outline-btn"
                                style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                                onClick={() => setSessions(sessions.filter(s => s.id !== sess.id))}
                              >
                                Derrubar
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Protegido</span>
                            )}
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
    }
  };

  return (
    <div className="settings-layout-grid" style={{ padding: '24px' }}>
      
      {/* Sidebar interior menu category selector */}
      <div className="settings-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderRight: '1px solid var(--border-color)', paddingRight: '16px', minHeight: '500px' }}>
        
        <button 
          className={`outline-btn ${activeCategory === 'profile' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('profile')}
        >
          <User size={16} />
          <span>Meu Perfil</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'company' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('company')}
        >
          <Building size={16} />
          <span>Perfil da Empresa</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'team' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('team')}
        >
          <Users size={16} />
          <span>Equipe & Membros</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'roles' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('roles')}
        >
          <Shield size={16} />
          <span>Cargos & Permissões</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'products' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('products')}
        >
          <Building size={16} />
          <span>Produtos Cadastrados</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'finance' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('finance')}
        >
          <DollarSign size={16} />
          <span>Parâmetros Financeiros</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'api' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('api')}
        >
          <Key size={16} />
          <span>Chaves de API</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'theme' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('theme')}
        >
          <Sun size={16} />
          <span>Tema & Aparência</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'notifications' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('notifications')}
        >
          <Bell size={16} />
          <span>Alertas & Notif</span>
        </button>

        <button 
          className={`outline-btn ${activeCategory === 'security' ? 'active' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '10px 12px', fontSize: '0.8rem', gap: '10px' }}
          onClick={() => setActiveCategory('security')}
        >
          <Shield size={16} />
          <span>Segurança & Login</span>
        </button>

      </div>

      {/* Main panel config editor rendering */}
      <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {renderCategoryPane()}
      </div>

      {/* ADD USER MODAL */}
      {isUserModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '420px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Convidar Novo Membro</h3>
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome Completo</span>
                <input 
                  type="text" 
                  placeholder="Ex: Ana Oliveira" 
                  className="form-input"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">E-mail Profissional</span>
                <input 
                  type="email" 
                  placeholder="Ex: ana.oliveira@orka.ai" 
                  className="form-input"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Cargo & Permissão</span>
                <select 
                  className="form-select"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as TeamMember['role'])}
                >
                  <option value="Admin">Admin (Acesso Total)</option>
                  <option value="Gerente">Gerente (Gestão Operacional)</option>
                  <option value="Vendedor">Vendedor (Pipeline Comercial)</option>
                  <option value="Analista">Analista (Apenas Leitura)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Enviar Convite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE API KEY MODAL */}
      {isKeyModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '420px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gerar Chave de API Secreta</h3>
            <form onSubmit={handleGenerateApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Identificador da Chave</span>
                <input 
                  type="text" 
                  placeholder="Ex: Integração HubSpot Live" 
                  className="form-input"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Nível de Permissão (Escopo)</span>
                <select 
                  className="form-select"
                  value={newKeyScope}
                  onChange={(e) => setNewKeyScope(e.target.value as ApiKeyRegistry['scope'])}
                >
                  <option value="Full Access">Full Access (Leitura e Escrita)</option>
                  <option value="Read Only">Read Only (Apenas Leitura)</option>
                </select>
              </div>

              <div className="ai-analysis-box" style={{ padding: '10px', fontSize: '0.72rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Terminal size={12} style={{ color: 'var(--color-primary)' }} />
                <span>
                  Para sua segurança, armazene a chave secretamente. Ela não poderá ser recuperada após fechar este aviso.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsKeyModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Gerar Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
