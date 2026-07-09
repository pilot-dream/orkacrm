import { supabase } from '../../../shared/api/supabaseClient';
import type { DashboardConfig } from '../model/types';

export const dashboardService = {
  async getUserDashboards(userEmail: string): Promise<DashboardConfig[]> {
    const { data, error } = await supabase
      .from('user_dashboards')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching dashboards:', error);
      return [];
    }

    return data || [];
  },

  async createDashboard(dashboard: Omit<DashboardConfig, 'id' | 'created_at' | 'updated_at'>): Promise<DashboardConfig | null> {
    const { data, error } = await supabase
      .from('user_dashboards')
      .insert([dashboard])
      .select()
      .single();

    if (error) {
      console.error('Error creating dashboard:', error);
      return null;
    }

    return data;
  },

  async updateDashboardLayout(id: string, layoutData: any[]): Promise<boolean> {
    const { error } = await supabase
      .from('user_dashboards')
      .update({ layout_data: layoutData, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating dashboard layout:', error);
      return false;
    }

    return true;
  },

  async updateDashboard(id: string, updates: Partial<DashboardConfig>): Promise<boolean> {
    const { error } = await supabase
      .from('user_dashboards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating dashboard:', error);
      return false;
    }

    return true;
  },

  async deleteDashboard(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_dashboards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting dashboard:', error);
      return false;
    }

    return true;
  }
};
