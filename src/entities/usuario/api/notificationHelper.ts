import { supabase, isSupabaseActive } from '../../../shared/api/supabaseClient';
import { useAuthStore } from '../model/store';

export const triggerSystemNotification = async (text: string, targetEmail?: string) => {
  const currentUserEmail = useAuthStore.getState().userEmail || 'admin@orka.ai';
  const emailToNotify = targetEmail || currentUserEmail;

  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    userEmail: emailToNotify,
    text,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    read: false
  };

  try {
    if (isSupabaseActive()) {
      const { error } = await supabase.from('notifications').insert([{
        id: newNotif.id,
        user_email: newNotif.userEmail,
        text: newNotif.text,
        time: newNotif.time,
        read: newNotif.read
      }]);
      if (error) throw error;
    } else {
      // Offline fallback
      const saved = localStorage.getItem(`orka_notifs_${emailToNotify}`);
      const list = saved ? JSON.parse(saved) : [];
      list.unshift(newNotif);
      localStorage.setItem(`orka_notifs_${emailToNotify}`, JSON.stringify(list));
      
      // If current user is being notified, add it to the state directly
      if (emailToNotify.toLowerCase() === currentUserEmail.toLowerCase()) {
        useAuthStore.getState().addNotification(newNotif);
      }
    }
  } catch (err) {
    console.error('Erro ao registrar notificação:', err);
  }
};

export const notifyUserByName = async (text: string, userName?: string) => {
  if (!userName || userName === 'Sem' || userName === 'Sem resp.') {
    // Notify admin
    await triggerSystemNotification(text, 'admin@orka.ai');
    return;
  }

  const team = useAuthStore.getState().teamMembers;
  const member = team.find(
    (m) => m.name.toLowerCase() === userName.toLowerCase() || m.email.toLowerCase() === userName.toLowerCase()
  );

  const targetEmail = member ? member.email : 'admin@orka.ai';
  
  await triggerSystemNotification(text, targetEmail);
  
  // Also notify Admin if the assignee is not Admin, so they can keep track
  if (targetEmail.toLowerCase() !== 'admin@orka.ai') {
    await triggerSystemNotification(text, 'admin@orka.ai');
  }
};

export const checkOverdueItems = async () => {
  // Use dynamic imports or store state to avoid circular dependency
  const { useTaskStore } = await import('../../tarefa/model/store');
  const { useProjectStore } = await import('../../projeto/model/store');

  const tasks = useTaskStore.getState().tasks;
  const projects = useProjectStore.getState().projects;
  const notifications = useAuthStore.getState().notifications;

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Helper to parse DD/MM/YYYY into YYYY-MM-DD
  const parseDate = (dStr?: string) => {
    if (!dStr) return null;
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dStr;
  };

  // Check tasks
  for (const t of tasks) {
    if (t.status !== 'concluida' && t.deadline) {
      const parsedDeadline = parseDate(t.deadline);
      if (parsedDeadline && parsedDeadline < todayStr) {
        const notifText = `⚠️ Tarefa atrasada: "${t.title}"`;
        const alreadyNotified = notifications.some(n => n.text.includes(t.title));
        if (!alreadyNotified) {
          await notifyUserByName(notifText, t.assignee);
        }
      }
    }
  }

  // Check projects
  for (const p of projects) {
    if (p.stage !== 'concluido' && p.deadline) {
      const parsedDeadline = parseDate(p.deadline);
      if (parsedDeadline && parsedDeadline < todayStr) {
        const notifText = `⚠️ Projeto atrasado: "${p.name}"`;
        const alreadyNotified = notifications.some(n => n.text.includes(p.name));
        if (!alreadyNotified) {
          await notifyUserByName(notifText, p.team && p.team.length > 0 ? p.team[0] : undefined);
        }
      }
    }
  }
};
