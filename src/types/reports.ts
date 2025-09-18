// Report Types
export interface Report {
  id: string
  name: string
  description?: string
  type: ReportType
  category: ReportCategory
  created_by: string
  created_at: string
  updated_at: string
  last_generated: string | null
  is_scheduled: boolean
  schedule_config?: ScheduleConfig
  parameters: ReportParameters
  format: ReportFormat
  status: ReportStatus
  file_url?: string
  file_size?: number
  recipients?: string[]
  tags?: string[]
  is_public: boolean
  view_count: number
  download_count: number
  
  // Computed fields
  creator_name?: string
  creator_avatar?: string
  next_run?: string
}

export type ReportType = 
  | 'dashboard'
  | 'table'
  | 'chart'
  | 'summary'
  | 'detailed'
  | 'comparison'
  | 'trend'
  | 'custom'

export type ReportCategory = 
  | 'users'
  | 'teams'
  | 'projects'
  | 'tasks'
  | 'files'
  | 'activities'
  | 'performance'
  | 'finance'
  | 'system'
  | 'custom'

export type ReportFormat = 
  | 'pdf'
  | 'excel'
  | 'csv'
  | 'json'
  | 'html'
  | 'dashboard'

export type ReportStatus = 
  | 'draft'
  | 'active'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'archived'
  | 'scheduled'

// Schedule Configuration
export interface ScheduleConfig {
  frequency: ScheduleFrequency
  interval: number
  days_of_week?: number[] // 0-6 (Sunday-Saturday)
  day_of_month?: number // 1-31
  time: string // HH:MM format
  timezone: string
  start_date: string
  end_date?: string
  is_active: boolean
}

export type ScheduleFrequency = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom'

// Report Parameters
export interface ReportParameters {
  date_range: DateRange
  filters: ReportFilters
  grouping?: ReportGrouping
  sorting?: ReportSorting
  aggregations?: ReportAggregation[]
  chart_config?: ChartConfig
  table_config?: TableConfig
  custom_fields?: CustomField[]
}

export interface DateRange {
  start_date: string
  end_date: string
  preset?: DatePreset
}

export type DatePreset = 
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom'

export interface ReportFilters {
  users?: string[]
  teams?: string[]
  projects?: string[]
  status?: string[]
  categories?: string[]
  tags?: string[]
  custom_filters?: { [key: string]: any }
}

export interface ReportGrouping {
  field: string
  type: 'date' | 'category' | 'user' | 'team' | 'status' | 'custom'
  interval?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface ReportSorting {
  field: string
  direction: 'asc' | 'desc'
}

export interface ReportAggregation {
  field: string
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct'
  alias?: string
}

// Chart Configuration
export interface ChartConfig {
  type: ChartType
  title?: string
  x_axis: AxisConfig
  y_axis: AxisConfig
  series: SeriesConfig[]
  colors?: string[]
  legend?: LegendConfig
  tooltip?: TooltipConfig
  responsive?: boolean
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'column'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'heatmap'
  | 'gauge'
  | 'funnel'

export interface AxisConfig {
  field: string
  label?: string
  format?: string
  min?: number
  max?: number
}

export interface SeriesConfig {
  field: string
  label?: string
  type?: ChartType
  color?: string
  stack?: string
}

export interface LegendConfig {
  show: boolean
  position: 'top' | 'bottom' | 'left' | 'right'
}

export interface TooltipConfig {
  show: boolean
  format?: string
}

// Table Configuration
export interface TableConfig {
  columns: TableColumn[]
  pagination?: PaginationConfig
  sorting?: boolean
  filtering?: boolean
  grouping?: boolean
  totals?: boolean
}

export interface TableColumn {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage'
  format?: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface PaginationConfig {
  page_size: number
  show_size_selector: boolean
  show_info: boolean
}

// Custom Fields
export interface CustomField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect'
  options?: string[]
  required?: boolean
  default_value?: any
}

// Analytics Data
export interface AnalyticsData {
  metrics: Metric[]
  dimensions: Dimension[]
  data: DataPoint[]
  totals?: { [key: string]: number }
  metadata: AnalyticsMetadata
}

export interface Metric {
  name: string
  label: string
  type: 'number' | 'currency' | 'percentage' | 'duration'
  format?: string
  description?: string
}

export interface Dimension {
  name: string
  label: string
  type: 'text' | 'date' | 'number' | 'boolean'
  values?: string[]
  description?: string
}

export interface DataPoint {
  [key: string]: any
}

export interface AnalyticsMetadata {
  total_records: number
  query_time: number
  generated_at: string
  cache_hit: boolean
  filters_applied: ReportFilters
  date_range: DateRange
}

// Dashboard Analytics
export interface DashboardAnalytics {
  overview: OverviewMetrics
  user_analytics: UserAnalytics
  team_analytics: TeamAnalytics
  project_analytics: ProjectAnalytics
  file_analytics: FileAnalytics
  activity_analytics: ActivityAnalytics
  performance_analytics: PerformanceAnalytics
  trends: TrendAnalytics
}

export interface OverviewMetrics {
  total_users: number
  active_users: number
  total_teams: number
  total_projects: number
  total_tasks: number
  completed_tasks: number
  total_files: number
  storage_used: number
  activities_today: number
  growth_rate: number
}

export interface UserAnalytics {
  user_growth: DataPoint[]
  user_activity: DataPoint[]
  user_engagement: DataPoint[]
  top_users: UserMetric[]
  user_distribution: DataPoint[]
  login_frequency: DataPoint[]
}

export interface UserMetric {
  user_id: string
  user_name: string
  user_avatar?: string
  metric_value: number
  metric_type: string
  rank: number
}

export interface TeamAnalytics {
  team_performance: DataPoint[]
  team_productivity: DataPoint[]
  team_collaboration: DataPoint[]
  top_teams: TeamMetric[]
  team_size_distribution: DataPoint[]
  team_activity: DataPoint[]
}

export interface TeamMetric {
  team_id: string
  team_name: string
  metric_value: number
  metric_type: string
  rank: number
  member_count: number
}

export interface ProjectAnalytics {
  project_progress: DataPoint[]
  project_timeline: DataPoint[]
  project_budget: DataPoint[]
  top_projects: ProjectMetric[]
  project_status_distribution: DataPoint[]
  project_completion_rate: DataPoint[]
}

export interface ProjectMetric {
  project_id: string
  project_name: string
  metric_value: number
  metric_type: string
  rank: number
  completion_percentage: number
}

export interface FileAnalytics {
  storage_usage: DataPoint[]
  file_types: DataPoint[]
  upload_trends: DataPoint[]
  download_trends: DataPoint[]
  popular_files: FileMetric[]
  storage_by_team: DataPoint[]
}

export interface FileMetric {
  file_id: string
  file_name: string
  metric_value: number
  metric_type: string
  rank: number
  file_size: number
}

export interface ActivityAnalytics {
  activity_volume: DataPoint[]
  activity_types: DataPoint[]
  activity_timeline: DataPoint[]
  user_activity: DataPoint[]
  peak_hours: DataPoint[]
  activity_heatmap: DataPoint[]
}

export interface PerformanceAnalytics {
  response_times: DataPoint[]
  error_rates: DataPoint[]
  uptime: DataPoint[]
  resource_usage: DataPoint[]
  user_satisfaction: DataPoint[]
  system_health: DataPoint[]
}

export interface TrendAnalytics {
  growth_trends: DataPoint[]
  usage_trends: DataPoint[]
  engagement_trends: DataPoint[]
  performance_trends: DataPoint[]
  seasonal_patterns: DataPoint[]
  predictions: DataPoint[]
}

// Report Generation
export interface ReportGenerationRequest {
  report_id?: string
  name: string
  description?: string
  type: ReportType
  category: ReportCategory
  parameters: ReportParameters
  format: ReportFormat
  recipients?: string[]
  schedule?: ScheduleConfig
  is_public?: boolean
}

export interface ReportGenerationResult {
  report_id: string
  status: ReportStatus
  file_url?: string
  file_size?: number
  generated_at: string
  generation_time: number
  error_message?: string
  data_points: number
}

// Export Data
export interface ExportRequest {
  data: any[]
  format: ReportFormat
  filename: string
  options?: ExportOptions
}

export interface ExportOptions {
  include_headers?: boolean
  date_format?: string
  number_format?: string
  currency_symbol?: string
  decimal_places?: number
  thousands_separator?: string
  custom_formatting?: { [key: string]: string }
}

export interface ExportResult {
  file_url: string
  file_size: number
  format: ReportFormat
  generated_at: string
  expires_at: string
}

// Utility Functions
export const REPORT_CATEGORIES = {
  users: { label: 'Usuários', icon: 'Users', color: 'blue' },
  teams: { label: 'Equipes', icon: 'Users', color: 'green' },
  projects: { label: 'Projetos', icon: 'FolderOpen', color: 'purple' },
  tasks: { label: 'Tarefas', icon: 'CheckSquare', color: 'orange' },
  files: { label: 'Arquivos', icon: 'File', color: 'cyan' },
  activities: { label: 'Atividades', icon: 'Activity', color: 'red' },
  performance: { label: 'Performance', icon: 'TrendingUp', color: 'yellow' },
  finance: { label: 'Financeiro', icon: 'DollarSign', color: 'emerald' },
  system: { label: 'Sistema', icon: 'Settings', color: 'gray' },
  custom: { label: 'Personalizado', icon: 'Wrench', color: 'indigo' }
}

export const REPORT_TYPES = {
  dashboard: { label: 'Dashboard', description: 'Visão geral com múltiplos widgets' },
  table: { label: 'Tabela', description: 'Dados em formato tabular' },
  chart: { label: 'Gráfico', description: 'Visualização em gráficos' },
  summary: { label: 'Resumo', description: 'Métricas principais resumidas' },
  detailed: { label: 'Detalhado', description: 'Relatório completo com todos os dados' },
  comparison: { label: 'Comparativo', description: 'Comparação entre períodos ou entidades' },
  trend: { label: 'Tendência', description: 'Análise de tendências ao longo do tempo' },
  custom: { label: 'Personalizado', description: 'Relatório customizado' }
}

export const CHART_TYPES = {
  line: { label: 'Linha', description: 'Gráfico de linha para tendências' },
  bar: { label: 'Barra', description: 'Gráfico de barras horizontais' },
  column: { label: 'Coluna', description: 'Gráfico de colunas verticais' },
  area: { label: 'Área', description: 'Gráfico de área preenchida' },
  pie: { label: 'Pizza', description: 'Gráfico de pizza para proporções' },
  donut: { label: 'Rosca', description: 'Gráfico de rosca' },
  scatter: { label: 'Dispersão', description: 'Gráfico de dispersão' },
  heatmap: { label: 'Mapa de Calor', description: 'Mapa de calor para correlações' },
  gauge: { label: 'Medidor', description: 'Medidor para KPIs' },
  funnel: { label: 'Funil', description: 'Gráfico de funil para conversões' }
}

export const DATE_PRESETS = {
  today: { label: 'Hoje', days: 0 },
  yesterday: { label: 'Ontem', days: 1 },
  last_7_days: { label: 'Últimos 7 dias', days: 7 },
  last_30_days: { label: 'Últimos 30 dias', days: 30 },
  last_90_days: { label: 'Últimos 90 dias', days: 90 },
  this_month: { label: 'Este mês', days: null },
  last_month: { label: 'Mês passado', days: null },
  this_quarter: { label: 'Este trimestre', days: null },
  last_quarter: { label: 'Trimestre passado', days: null },
  this_year: { label: 'Este ano', days: null },
  last_year: { label: 'Ano passado', days: null },
  custom: { label: 'Personalizado', days: null }
}

export function formatMetricValue(value: number, type: string, format?: string): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`
    
    case 'duration':
      const hours = Math.floor(value / 3600)
      const minutes = Math.floor((value % 3600) / 60)
      return `${hours}h ${minutes}m`
    
    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR').format(value)
  }
}

export function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return {
        start_date: today.toISOString(),
        end_date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        preset
      }
    
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      return {
        start_date: yesterday.toISOString(),
        end_date: today.toISOString(),
        preset
      }
    
    case 'last_7_days':
      return {
        start_date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        preset
      }
    
    case 'last_30_days':
      return {
        start_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        preset
      }
    
    case 'this_month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return {
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
        preset
      }
    
    default:
      return {
        start_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        preset: 'last_30_days'
      }
  }
}

export function validateReportParameters(parameters: ReportParameters): string[] {
  const errors: string[] = []
  
  if (!parameters.date_range.start_date) {
    errors.push('Data de início é obrigatória')
  }
  
  if (!parameters.date_range.end_date) {
    errors.push('Data de fim é obrigatória')
  }
  
  if (parameters.date_range.start_date && parameters.date_range.end_date) {
    const startDate = new Date(parameters.date_range.start_date)
    const endDate = new Date(parameters.date_range.end_date)
    
    if (startDate >= endDate) {
      errors.push('Data de início deve ser anterior à data de fim')
    }
  }
  
  return errors
}

// Report Format Labels
export const REPORT_FORMAT_LABELS = {
  pdf: 'PDF',
  excel: 'Excel',
  csv: 'CSV',
  json: 'JSON',
  html: 'HTML',
  dashboard: 'Dashboard'
} as const

// Report Type Labels
export const REPORT_TYPE_LABELS = {
  dashboard: 'Dashboard',
  table: 'Tabela',
  chart: 'Gráfico',
  summary: 'Resumo',
  detailed: 'Detalhado',
  comparison: 'Comparação',
  trend: 'Tendência',
  custom: 'Personalizado'
} as const

// Report Category Labels
export const REPORT_CATEGORY_LABELS = {
  users: 'Usuários',
  teams: 'Equipes',
  projects: 'Projetos',
  tasks: 'Tarefas',
  files: 'Arquivos',
  activities: 'Atividades',
  performance: 'Performance',
  finance: 'Financeiro',
  system: 'Sistema',
  custom: 'Personalizado'
} as const

// Report Status Labels
export const REPORT_STATUS_LABELS = {
  draft: 'Rascunho',
  active: 'Ativo',
  generating: 'Gerando',
  completed: 'Concluído',
  failed: 'Falhou',
  archived: 'Arquivado',
  scheduled: 'Agendado'
} as const