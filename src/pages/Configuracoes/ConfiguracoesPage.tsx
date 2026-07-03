import { useEffect } from 'react';
import { SettingsView } from '../../components/SettingsView';
import type { TeamMember } from '../../components/SettingsView';
import { useAuthStore } from '../../entities/usuario/model/store';
import { useProductStore } from '../../entities/produto/model/store';
import { supabase, isSupabaseActive } from '../../shared/api/supabaseClient';
import { supabaseTeam } from '../../lib/supabaseService';

export default function ConfiguracoesPage() {
  const userProfile = useAuthStore((state) => state.userProfile);
  const teamMembers = useAuthStore((state) => state.teamMembers);
  const setUserProfile = useAuthStore((state) => state.setUserProfile);
  const setTeamMembers = useAuthStore((state) => state.setTeamMembers);

  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProfile = async (profile: any) => {
    if (isSupabaseActive()) {
      await supabase.from('profiles').upsert(profile);
    } else {
      localStorage.setItem(`orka_profile_${profile.email}`, JSON.stringify(profile));
    }
    setUserProfile(profile);
  };

  const handleAddTeamMember = async (member: TeamMember): Promise<boolean> => {
    let success = false;
    if (isSupabaseActive()) {
      success = await supabaseTeam.insert(member);
    } else {
      success = true;
    }

    if (success) {
      const updated = [...teamMembers, member];
      setTeamMembers(updated);
      if (!isSupabaseActive()) {
        localStorage.setItem('orka_team', JSON.stringify(updated));
      }
    }
    return success;
  };

  const handleDeleteTeamMember = async (id: string) => {
    let success = false;
    if (isSupabaseActive()) {
      success = await supabaseTeam.delete(id);
    } else {
      success = true;
    }

    if (success) {
      const updated = teamMembers.filter((m) => m.id !== id);
      setTeamMembers(updated);
      if (!isSupabaseActive()) {
        localStorage.setItem('orka_team', JSON.stringify(updated));
      }
      alert('Membro da equipe removido com sucesso!');
    } else {
      alert('Erro ao remover membro da equipe.');
    }
  };

  const handleUpdateTeamMemberRole = async (id: string, role: TeamMember['role']) => {
    const member = teamMembers.find((m) => m.id === id);
    if (!member) return;
    const updatedMember = { ...member, role };

    let success = false;
    if (isSupabaseActive()) {
      success = await supabaseTeam.update(updatedMember);
    } else {
      success = true;
    }

    if (success) {
      const updated = teamMembers.map((m) => (m.id === id ? updatedMember : m));
      setTeamMembers(updated);
      if (!isSupabaseActive()) {
        localStorage.setItem('orka_team', JSON.stringify(updated));
      }
    } else {
      alert('Erro ao atualizar cargo do membro.');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          <span className="hide-on-mobile">Configurações do Sistema</span>
          <span className="show-on-mobile">Configurações</span>
        </h1>
        <p className="hide-on-mobile" style={{ color: 'var(--color-text-muted)' }}>ORKA CRM v2.0 - Parâmetros da Empresa & Equipe</p>
      </header>

      <div style={{ marginTop: '24px' }}>
        <SettingsView
          userProfile={userProfile}
          onSaveProfile={handleSaveProfile}
          team={teamMembers}
          onAddTeamMember={handleAddTeamMember}
          onDeleteTeamMember={handleDeleteTeamMember}
          onUpdateTeamMemberRole={handleUpdateTeamMemberRole}
          products={products}
        />
      </div>
    </div>
  );
}
