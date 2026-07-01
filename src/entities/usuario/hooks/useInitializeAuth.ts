import { useEffect } from 'react';
import { useAuthStore } from '../model/store';
import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';

export function useInitializeAuth() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUserProfile = useAuthStore((state) => state.setUserProfile);
  const setTeamMembers = useAuthStore((state) => state.setTeamMembers);
  const setNotifications = useAuthStore((state) => state.setNotifications);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userEmail = useAuthStore((state) => state.userEmail);

  // 1. Listen to Supabase Auth Changes or check initial session
  useEffect(() => {
    if (!isSupabaseActive()) {
      // Offline fallback: check localStorage session
      const savedEmail = localStorage.getItem('orka_user_email');
      if (savedEmail) {
        login(savedEmail);
      }
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        login(session.user.email);
        localStorage.setItem('orka_user_email', session.user.email);
      } else {
        logout();
        localStorage.removeItem('orka_user_email');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        login(session.user.email);
        localStorage.setItem('orka_user_email', session.user.email);
      } else {
        logout();
        localStorage.removeItem('orka_user_email');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout]);

  // 2. Fetch User Profile, Team, and Notifications on authentication
  useEffect(() => {
    let channel: any = null;
    
    const loadProfileData = async () => {
      if (!isAuthenticated || !userEmail) return;

      let activeProfile = null;
      let activeTeam = [];
      let activeNotifs = [];

      if (isSupabaseActive()) {
        try {
          // Fetch Profile
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

          if (dbProfile) {
            activeProfile = {
              email: dbProfile.email,
              name: dbProfile.name,
              role: dbProfile.role || 'Analista',
              avatar: dbProfile.avatar || '',
              details: dbProfile.details || '',
              tenant_id: dbProfile.tenant_id || dbProfile.email.split('@')[1]
            };
          } else {
            // Auto create profile
            const namePrefix = userEmail.split('@')[0];
            const name = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
            const role = userEmail === 'admin@orka.ai' ? 'Admin' : 'Analista';
            const tenant_id = userEmail.split('@')[1];
            activeProfile = {
              email: userEmail,
              name,
              role,
              avatar: '',
              details: `Membro integrado à equipe em ${new Date().toLocaleDateString('pt-BR')}`,
              tenant_id
            };
            await supabase.from('profiles').upsert(activeProfile);
          }

          // Fetch Team (filtered by tenant)
          const tenant = activeProfile.tenant_id || userEmail.split('@')[1];
          const { data: dbTeam } = await supabase
            .from('team_members')
            .select('*')
            .eq('tenant_id', tenant);
          activeTeam = dbTeam || [];

          // Add current user to team if not present
          const existsInTeam = activeTeam.some(
            (m: any) => m.email.toLowerCase() === userEmail.toLowerCase()
          );
          if (!existsInTeam && activeProfile) {
            const newMember = {
              id: `usr-${Math.random().toString().substring(2, 7)}`,
              name: activeProfile.name,
              email: activeProfile.email,
              role: activeProfile.role,
              status: 'Ativo',
              tenant_id: tenant,
            };
            await supabase.from('team_members').insert(newMember);
            activeTeam = [...activeTeam, newMember];
          }

          // Fetch Notifications
          const { data: dbNotifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false });
          
          activeNotifs = (dbNotifs || []).map((n: any) => ({
            id: n.id,
            userEmail: n.user_email,
            text: n.text,
            time: n.time || 'Agora mesmo',
            read: n.read || false,
          }));

        } catch (error) {
          console.error('Error loading data from Supabase:', error);
        }
      } else {
        // Fallback: LocalStorage simulation
        const tenant = userEmail.split('@')[1];
        const savedProfile = localStorage.getItem(`orka_profile_${userEmail}`);
        if (savedProfile) {
          activeProfile = JSON.parse(savedProfile);
          if (!activeProfile.tenant_id) {
            activeProfile.tenant_id = tenant;
          }
        } else {
          const namePrefix = userEmail.split('@')[0];
          const name = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
          const role = userEmail === 'admin@orka.ai' ? 'Admin' : 'Analista';
          activeProfile = {
            email: userEmail,
            name,
            role,
            avatar: '',
            details: `Membro integrado à equipe em ${new Date().toLocaleDateString('pt-BR')}`,
            tenant_id: tenant
          };
          localStorage.setItem(`orka_profile_${userEmail}`, JSON.stringify(activeProfile));
        }

        const savedTeam = localStorage.getItem('orka_team');
        if (savedTeam) {
          const allMembers = JSON.parse(savedTeam);
          activeTeam = allMembers.filter((m: any) => (m.tenant_id || m.email.split('@')[1]) === tenant);
        } else {
          activeTeam = [
            { id: 'usr-1', name: 'Orka Admin', email: 'admin@orka.ai', role: 'Admin', status: 'Ativo', tenant_id: 'orka.ai' }
          ];
          localStorage.setItem('orka_team', JSON.stringify(activeTeam));
        }

        const existsInLocalTeam = activeTeam.some(
          (m: any) => m.email.toLowerCase() === userEmail.toLowerCase()
        );
        if (!existsInLocalTeam && activeProfile) {
          const newMember = {
            id: `usr-${Math.random().toString().substring(2, 7)}`,
            name: activeProfile.name,
            email: activeProfile.email,
            role: activeProfile.role,
            status: 'Ativo',
            tenant_id: tenant,
          };
          activeTeam = [...activeTeam, newMember];
          
          // Save the full global team list to LocalStorage
          const allSaved = savedTeam ? JSON.parse(savedTeam) : [];
          allSaved.push(newMember);
          localStorage.setItem('orka_team', JSON.stringify(allSaved));
        }

        const savedNotifs = localStorage.getItem(`orka_notifs_${userEmail}`);
        if (savedNotifs) {
          activeNotifs = JSON.parse(savedNotifs);
        } else {
          activeNotifs = [
            { id: '1', userEmail, text: '🤖 Bem-vindo ao ORKA CRM!', time: 'Agora mesmo', read: false }
          ];
          localStorage.setItem(`orka_notifs_${userEmail}`, JSON.stringify(activeNotifs));
        }
      }

      setUserProfile(activeProfile);
      setTeamMembers(activeTeam);
      setNotifications(activeNotifs);

      // Subscribe to real-time notification inserts for this user
      if (isSupabaseActive()) {
        channel = supabase
          .channel(`notifications-changes-${userEmail}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_email=eq.${userEmail}`
            },
            (payload) => {
              const newNotif = {
                id: payload.new.id,
                userEmail: payload.new.user_email,
                text: payload.new.text,
                time: payload.new.time || 'Agora mesmo',
                read: payload.new.read || false,
              };
              useAuthStore.getState().addNotification(newNotif);
            }
          )
          .subscribe();
      }
    };

    loadProfileData();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAuthenticated, userEmail, setUserProfile, setTeamMembers, setNotifications]);
}
