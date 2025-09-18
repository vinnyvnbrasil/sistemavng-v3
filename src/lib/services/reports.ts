import { supabase } from '@/lib/supabase'
import {
  Report,
  ReportType,
  ReportCategory,
  ReportFormat,
  ReportStatus,
  ReportGenerationRequest,
  ReportGenerationResult,
  AnalyticsData,
  DashboardAnalytics,
  OverviewMetrics,
  UserAnalytics,
  TeamAnalytics,
  ProjectAnalytics,
  FileAnalytics,
  ActivityAnalytics,
  PerformanceAnalytics,
  TrendAnalytics,
  UserMetric,
  TeamMetric,
  ProjectMetric,
  FileMetric,
  DataPoint,
  ExportRequest,
  ExportResult,
  DateRange,
  ReportParameters,
  getDateRangeFromPreset,
  validateReportParameters
} from '@/types/reports'
import { ActivityService } from './activities'

export class ReportService {
  // Report Management
  static async getReports(category?: ReportCategory, status?: ReportStatus): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          creator:profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(report => ({
        ...report,
        creator_name: report.creator?.full_name || 'Usuário Desconhecido',
        creator_avatar: report.creator?.avatar_url
      }))
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error)
      throw new Error('Falha ao carregar relatórios')
    }
  }

  static async getReportById(id: string): Promise<Report> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          creator:profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Relatório não encontrado')

      return {
        ...data,
        creator_name: data.creator?.full_name || 'Usuário Desconhecido',
        creator_avatar: data.creator?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error)
      throw new Error('Falha ao carregar relatório')
    }
  }

  static async createReport(request: ReportGenerationRequest): Promise<Report> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      // Validate parameters
      const validationErrors = validateReportParameters(request.parameters)
      if (validationErrors.length > 0) {
        throw new Error(`Parâmetros inválidos: ${validationErrors.join(', ')}`)
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          name: request.name,
          type: request.type,
          category: request.category,
          created_by: userId,
          parameters: request.parameters,
          format: request.format,
          status: 'draft' as ReportStatus,
          is_scheduled: !!request.schedule,
          schedule_config: request.schedule,
          recipients: request.recipients || [],
          is_public: false,
          view_count: 0,
          download_count: 0
        })
        .select(`
          *,
          creator:profiles(full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'file_uploaded',
        `Relatório "${request.name}" foi criado`,
        userId,
        'system',
        data.id,
        {
          entityName: request.name,
          metadata: {
            category: request.category,
            type: request.type
          }
        }
      )

      return {
        ...data,
        creator_name: data.creator?.full_name || 'Usuário Desconhecido',
        creator_avatar: data.creator?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error)
      throw new Error('Falha ao criar relatório')
    }
  }

  static async generateReport(reportId: string): Promise<ReportGenerationResult> {
    try {
      const startTime = Date.now()
      const report = await this.getReportById(reportId)

      // Update status to generating
      await supabase
        .from('reports')
        .update({ status: 'generating' as ReportStatus })
        .eq('id', reportId)

      // Generate analytics data based on report parameters
      const analyticsData = await this.generateAnalyticsData(report.parameters)

      // Generate file based on format
      let fileUrl: string | undefined
      let fileSize: number | undefined

      if (report.format !== 'dashboard') {
        const exportResult = await this.exportData({
          data: analyticsData.data,
          format: report.format,
          filename: `${report.name}_${new Date().toISOString().split('T')[0]}`
        })
        fileUrl = exportResult.file_url
        fileSize = exportResult.file_size
      }

      const generationTime = Date.now() - startTime

      // Update report with results
      await supabase
        .from('reports')
        .update({
          status: 'completed' as ReportStatus,
          last_generated: new Date().toISOString(),
          file_url: fileUrl,
          file_size: fileSize
        })
        .eq('id', reportId)

      // Log activity
      await ActivityService.logActivity(
        'file_uploaded',
        `Relatório "${report.name}" foi gerado`,
        (await supabase.auth.getUser()).data.user?.id || '',
        'system',
        reportId,
        {
          entityName: report.name,
          metadata: {
            generation_time: generationTime,
            data_points: analyticsData.data.length
          }
        }
      )

      return {
        report_id: reportId,
        status: 'completed',
        file_url: fileUrl,
        file_size: fileSize,
        generated_at: new Date().toISOString(),
        generation_time: generationTime,
        data_points: analyticsData.data.length
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      
      // Update status to failed
      await supabase
        .from('reports')
        .update({ 
          status: 'failed' as ReportStatus,
          last_generated: new Date().toISOString()
        })
        .eq('id', reportId)

      return {
        report_id: reportId,
        status: 'failed',
        generated_at: new Date().toISOString(),
        generation_time: Date.now(),
        data_points: 0,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  static async deleteReport(id: string): Promise<void> {
    try {
      const report = await this.getReportById(id)

      // Delete file if exists
      if (report.file_url) {
        // Extract file path from URL and delete from storage
        const filePath = report.file_url.split('/').pop()
        if (filePath) {
          await supabase.storage
            .from('reports')
            .remove([filePath])
        }
      }

      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'file_deleted',
        `Relatório "${report.name}" foi excluído`,
        (await supabase.auth.getUser()).data.user?.id || '',
        'system',
        id,
        {
          entityName: report.name
        }
      )
    } catch (error) {
      console.error('Erro ao excluir relatório:', error)
      throw new Error('Falha ao excluir relatório')
    }
  }

  // Analytics Data Generation
  static async generateAnalyticsData(parameters: ReportParameters): Promise<AnalyticsData> {
    try {
      const { date_range, filters } = parameters
      const startTime = Date.now()

      // This is a simplified implementation
      // In a real application, you would query your actual data sources
      const data: DataPoint[] = []
      
      // Generate sample data based on date range
      const startDate = new Date(date_range.start_date)
      const endDate = new Date(date_range.end_date)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        data.push({
          date: currentDate.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 100) + 50,
          activities: Math.floor(Math.random() * 500) + 100,
          files: Math.floor(Math.random() * 50) + 10,
          storage: Math.floor(Math.random() * 1000000) + 500000
        })
      }

      return {
        metrics: [
          { name: 'users', label: 'Usuários', type: 'number' },
          { name: 'activities', label: 'Atividades', type: 'number' },
          { name: 'files', label: 'Arquivos', type: 'number' },
          { name: 'storage', label: 'Armazenamento', type: 'number', format: 'bytes' }
        ],
        dimensions: [
          { name: 'date', label: 'Data', type: 'date' }
        ],
        data,
        totals: {
          users: data.reduce((sum, point) => sum + point.users, 0),
          activities: data.reduce((sum, point) => sum + point.activities, 0),
          files: data.reduce((sum, point) => sum + point.files, 0),
          storage: data.reduce((sum, point) => sum + point.storage, 0)
        },
        metadata: {
          total_records: data.length,
          query_time: Date.now() - startTime,
          generated_at: new Date().toISOString(),
          cache_hit: false,
          filters_applied: filters,
          date_range
        }
      }
    } catch (error) {
      console.error('Erro ao gerar dados analíticos:', error)
      throw new Error('Falha ao gerar dados analíticos')
    }
  }

  // Dashboard Analytics
  static async getDashboardAnalytics(dateRange?: DateRange): Promise<DashboardAnalytics> {
    try {
      const range = dateRange || getDateRangeFromPreset('last_30_days')
      
      // In a real implementation, these would be actual database queries
      const overview = await this.getOverviewMetrics(range)
      const userAnalytics = await this.getUserAnalytics(range)
      const teamAnalytics = await this.getTeamAnalytics(range)
      const projectAnalytics = await this.getProjectAnalytics(range)
      const fileAnalytics = await this.getFileAnalytics(range)
      const activityAnalytics = await this.getActivityAnalytics(range)
      const performanceAnalytics = await this.getPerformanceAnalytics(range)
      const trends = await this.getTrendAnalytics(range)

      return {
        overview,
        user_analytics: userAnalytics,
        team_analytics: teamAnalytics,
        project_analytics: projectAnalytics,
        file_analytics: fileAnalytics,
        activity_analytics: activityAnalytics,
        performance_analytics: performanceAnalytics,
        trends
      }
    } catch (error) {
      console.error('Erro ao buscar analytics do dashboard:', error)
      throw new Error('Falha ao carregar analytics')
    }
  }

  private static async getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics> {
    // Simplified implementation with mock data
    return {
      total_users: 150,
      active_users: 120,
      total_teams: 25,
      total_projects: 45,
      total_tasks: 320,
      completed_tasks: 280,
      total_files: 1250,
      storage_used: 5.2 * 1024 * 1024 * 1024, // 5.2GB
      activities_today: 85,
      growth_rate: 12.5
    }
  }

  private static async getUserAnalytics(dateRange: DateRange): Promise<UserAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        new_users: Math.floor(Math.random() * 10) + 1,
        active_users: Math.floor(Math.random() * 50) + 80,
        login_count: Math.floor(Math.random() * 200) + 100
      })
    }

    return {
      user_growth: data,
      user_activity: data,
      user_engagement: data,
      top_users: [
        { user_id: '1', user_name: 'João Silva', metric_value: 95, metric_type: 'activities', rank: 1 },
        { user_id: '2', user_name: 'Maria Santos', metric_value: 87, metric_type: 'activities', rank: 2 },
        { user_id: '3', user_name: 'Pedro Costa', metric_value: 76, metric_type: 'activities', rank: 3 }
      ],
      user_distribution: data,
      login_frequency: data
    }
  }

  private static async getTeamAnalytics(dateRange: DateRange): Promise<TeamAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        productivity: Math.floor(Math.random() * 30) + 70,
        collaboration: Math.floor(Math.random() * 40) + 60,
        performance: Math.floor(Math.random() * 25) + 75
      })
    }

    return {
      team_performance: data,
      team_productivity: data,
      team_collaboration: data,
      top_teams: [
        { team_id: '1', team_name: 'Desenvolvimento', metric_value: 92, metric_type: 'productivity', rank: 1, member_count: 8 },
        { team_id: '2', team_name: 'Design', metric_value: 88, metric_type: 'productivity', rank: 2, member_count: 5 },
        { team_id: '3', team_name: 'Marketing', metric_value: 85, metric_type: 'productivity', rank: 3, member_count: 6 }
      ],
      team_size_distribution: data,
      team_activity: data
    }
  }

  private static async getProjectAnalytics(dateRange: DateRange): Promise<ProjectAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        progress: Math.floor(Math.random() * 20) + 60,
        budget_used: Math.floor(Math.random() * 30) + 40,
        completion_rate: Math.floor(Math.random() * 15) + 75
      })
    }

    return {
      project_progress: data,
      project_timeline: data,
      project_budget: data,
      top_projects: [
        { project_id: '1', project_name: 'Sistema VNG v3', metric_value: 85, metric_type: 'progress', rank: 1, completion_percentage: 85 },
        { project_id: '2', project_name: 'App Mobile', metric_value: 72, metric_type: 'progress', rank: 2, completion_percentage: 72 },
        { project_id: '3', project_name: 'Dashboard Analytics', metric_value: 68, metric_type: 'progress', rank: 3, completion_percentage: 68 }
      ],
      project_status_distribution: data,
      project_completion_rate: data
    }
  }

  private static async getFileAnalytics(dateRange: DateRange): Promise<FileAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        uploads: Math.floor(Math.random() * 20) + 5,
        downloads: Math.floor(Math.random() * 50) + 20,
        storage_used: Math.floor(Math.random() * 1000000) + 5000000
      })
    }

    return {
      storage_usage: data,
      file_types: [
        { type: 'document', count: 450, percentage: 36 },
        { type: 'image', count: 320, percentage: 25.6 },
        { type: 'video', count: 180, percentage: 14.4 },
        { type: 'audio', count: 120, percentage: 9.6 },
        { type: 'other', count: 180, percentage: 14.4 }
      ],
      upload_trends: data,
      download_trends: data,
      popular_files: [
        { file_id: '1', file_name: 'Manual_Usuario.pdf', metric_value: 156, metric_type: 'downloads', rank: 1, file_size: 2048000 },
        { file_id: '2', file_name: 'Apresentacao_Projeto.pptx', metric_value: 134, metric_type: 'downloads', rank: 2, file_size: 5120000 },
        { file_id: '3', file_name: 'Logo_Empresa.png', metric_value: 98, metric_type: 'downloads', rank: 3, file_size: 512000 }
      ],
      storage_by_team: data
    }
  }

  private static async getActivityAnalytics(dateRange: DateRange): Promise<ActivityAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        total_activities: Math.floor(Math.random() * 100) + 50,
        user_activities: Math.floor(Math.random() * 30) + 20,
        system_activities: Math.floor(Math.random() * 20) + 10
      })
    }

    return {
      activity_volume: data,
      activity_types: [
        { type: 'user_created', count: 245, percentage: 35 },
        { type: 'user_updated', count: 189, percentage: 27 },
        { type: 'user_deleted', count: 98, percentage: 14 },
        { type: 'login', count: 168, percentage: 24 }
      ],
      activity_timeline: data,
      user_activity: data,
      peak_hours: [
        { hour: 9, activity_count: 45 },
        { hour: 10, activity_count: 52 },
        { hour: 11, activity_count: 38 },
        { hour: 14, activity_count: 41 },
        { hour: 15, activity_count: 48 },
        { hour: 16, activity_count: 35 }
      ],
      activity_heatmap: data
    }
  }

  private static async getPerformanceAnalytics(dateRange: DateRange): Promise<PerformanceAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        response_time: Math.floor(Math.random() * 200) + 100,
        error_rate: Math.random() * 2,
        uptime: 99 + Math.random(),
        cpu_usage: Math.floor(Math.random() * 30) + 40,
        memory_usage: Math.floor(Math.random() * 40) + 50
      })
    }

    return {
      response_times: data,
      error_rates: data,
      uptime: data,
      resource_usage: data,
      user_satisfaction: data,
      system_health: data
    }
  }

  private static async getTrendAnalytics(dateRange: DateRange): Promise<TrendAnalytics> {
    const data: DataPoint[] = []
    const startDate = new Date(dateRange.start_date)
    const endDate = new Date(dateRange.end_date)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      data.push({
        date: currentDate.toISOString().split('T')[0],
        growth: Math.floor(Math.random() * 10) + 5,
        usage: Math.floor(Math.random() * 20) + 70,
        engagement: Math.floor(Math.random() * 15) + 80,
        performance: Math.floor(Math.random() * 10) + 85
      })
    }

    return {
      growth_trends: data,
      usage_trends: data,
      engagement_trends: data,
      performance_trends: data,
      seasonal_patterns: data,
      predictions: data
    }
  }

  // Export Data
  static async exportData(request: ExportRequest): Promise<ExportResult> {
    try {
      let content: string
      let mimeType: string
      let fileExtension: string

      switch (request.format) {
        case 'csv':
          content = this.generateCSV(request.data, request.options)
          mimeType = 'text/csv'
          fileExtension = 'csv'
          break

        case 'excel':
          // In a real implementation, you would use a library like xlsx
          content = this.generateCSV(request.data, request.options)
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          fileExtension = 'xlsx'
          break

        case 'json':
          content = JSON.stringify(request.data, null, 2)
          mimeType = 'application/json'
          fileExtension = 'json'
          break

        case 'pdf':
          // In a real implementation, you would use a PDF generation library
          content = this.generateHTML(request.data)
          mimeType = 'application/pdf'
          fileExtension = 'pdf'
          break

        case 'html':
        default:
          content = this.generateHTML(request.data)
          mimeType = 'text/html'
          fileExtension = 'html'
          break
      }

      // Upload to storage
      const fileName = `${request.filename}.${fileExtension}`
      const filePath = `exports/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, new Blob([content], { type: mimeType }), {
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath)

      return {
        file_url: urlData.publicUrl,
        file_size: new Blob([content]).size,
        format: request.format,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      throw new Error('Falha ao exportar dados')
    }
  }

  private static generateCSV(data: any[], options?: any): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }

  private static generateHTML(data: any[]): string {
    if (data.length === 0) return '<p>Nenhum dado disponível</p>'

    const headers = Object.keys(data[0])
    const tableRows = data.map(row => 
      `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
    ).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Relatório</h1>
        <table>
          <thead>
            <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `
  }
}