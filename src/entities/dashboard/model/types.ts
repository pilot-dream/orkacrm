export type WidgetConfig = {
  timeRange?: 'hoje' | 'semana' | 'mes' | 'ano' | 'tudo';
  color?: string;
  showComparison?: boolean;
  showChart?: boolean;
  showPercentage?: boolean;
  showTrend?: boolean;
  limit?: number;
  customTitle?: string;
  [key: string]: any;
};

export type DashboardLayoutItem = {
  i: string; // Widget instance ID
  x: number;
  y: number;
  w: number;
  h: number;
  widgetId: string; // The type of widget (from registry)
  config?: WidgetConfig;
  isHidden?: boolean;
};

export type DashboardConfig = {
  id: string;
  user_email: string;
  tenant_id?: string;
  name: string;
  layout_data: DashboardLayoutItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
