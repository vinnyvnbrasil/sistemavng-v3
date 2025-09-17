import { createClient } from '@supabase/supabase-js'
import {
  AuditLog,
  SystemLog,
  AuditRule,
  AuditReport,
  AuditStats,
  LogStats,
  AuditAction,
  ResourceType,
  AuditSeverity,
  AuditCategory,
  LogLevel,
  LogCategory,
  AuditLogFilter,
  SystemLogFilter,
  AuditLogSort,
  SystemLogSort,
  AuditLogResponse,
  SystemLogResponse,
  AuditRuleResponse,
  AuditReportResponse,
  ReportSchedule,
  ReportFormat,
  AUDIT_SETTINGS,
  LOG_SETTINGS
} from '@/types/audit'
import { ActivityService } from './activities'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class AuditService {
  constructor() {
    // ActivityService is now used as static methods
  }

  // Audit Log Management
  async createAuditLog(data: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLogResponse> {
    try {
      const auditLog: AuditLog = {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from('audit_logs')
        .insert([auditLog])
        .select()
        .single()

      if (error) {
        console.error('Error creating audit log:', error)
        return { success: false, message: 'Erro ao criar log de auditoria' }
      }

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Log de auditoria criado',
        data.user_id || 'system',
        'system',
        auditLog.id,
        {
          description: `Log de auditoria criado: ${data.action}`,
          entityName: 'audit_log',
          metadata: { action: data.action, severity: data.severity }
        }
      )

      return { success: true, data: result, message: 'Log de auditoria criado com sucesso' }
    } catch (error) {
      console.error('Error creating audit log:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async getAuditLogs(
    filter: AuditLogFilter = {},
    sort: AuditLogSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    limit: number = AUDIT_SETTINGS.DEFAULT_PAGE_SIZE
  ): Promise<AuditLogResponse> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id)
      }
      if (filter.action) {
        if (Array.isArray(filter.action)) {
          query = query.in('action', filter.action)
        } else {
          query = query.eq('action', filter.action)
        }
      }
      if (filter.resource_type) {
        if (Array.isArray(filter.resource_type)) {
          query = query.in('resource_type', filter.resource_type)
        } else {
          query = query.eq('resource_type', filter.resource_type)
        }
      }
      if (filter.resource_id) {
        query = query.eq('resource_id', filter.resource_id)
      }
      if (filter.severity) {
        if (Array.isArray(filter.severity)) {
          query = query.in('severity', filter.severity)
        } else {
          query = query.eq('severity', filter.severity)
        }
      }
      if (filter.category) {
        if (Array.isArray(filter.category)) {
          query = query.in('category', filter.category)
        } else {
          query = query.eq('category', filter.category)
        }
      }
      if (filter.risk_score_min !== undefined) {
        query = query.gte('risk_score', filter.risk_score_min)
      }
      if (filter.risk_score_max !== undefined) {
        query = query.lte('risk_score', filter.risk_score_max)
      }
      if (filter.ip_address) {
        query = query.eq('ip_address', filter.ip_address)
      }
      if (filter.location) {
        query = query.ilike('location', `%${filter.location}%`)
      }
      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from)
      }
      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to)
      }
      if (filter.search) {
        query = query.or(`description.ilike.%${filter.search}%,action.ilike.%${filter.search}%`)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: logs, error, count } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        return { success: false, message: 'Erro ao buscar logs de auditoria' }
      }

      return {
        success: true,
        logs: logs || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async getAuditLog(id: string): Promise<AuditLogResponse> {
    try {
      const { data: log, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching audit log:', error)
        return { success: false, message: 'Log de auditoria não encontrado' }
      }

      return { success: true, data: log }
    } catch (error) {
      console.error('Error fetching audit log:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async deleteAuditLog(id: string, userId: string): Promise<AuditLogResponse> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting audit log:', error)
        return { success: false, message: 'Erro ao excluir log de auditoria' }
      }

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Log de auditoria excluído',
        userId,
        'system',
        id,
        {
          description: 'Log de auditoria excluído',
          entityName: 'audit_log'
        }
      )

      return { success: true, message: 'Log de auditoria excluído com sucesso' }
    } catch (error) {
      console.error('Error deleting audit log:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  // System Log Management
  async createSystemLog(data: Omit<SystemLog, 'id' | 'created_at'>): Promise<SystemLogResponse> {
    try {
      const systemLog: SystemLog = {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from('system_logs')
        .insert([systemLog])
        .select()
        .single()

      if (error) {
        console.error('Error creating system log:', error)
        return { success: false, message: 'Erro ao criar log do sistema' }
      }

      return { success: true, data: result, message: 'Log do sistema criado com sucesso' }
    } catch (error) {
      console.error('Error creating system log:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async getSystemLogs(
    filter: SystemLogFilter = {},
    sort: SystemLogSort = { field: 'created_at', direction: 'desc' },
    page: number = 1,
    limit: number = LOG_SETTINGS.DEFAULT_PAGE_SIZE
  ): Promise<SystemLogResponse> {
    try {
      let query = supabase
        .from('system_logs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filter.level) {
        if (Array.isArray(filter.level)) {
          query = query.in('level', filter.level)
        } else {
          query = query.eq('level', filter.level)
        }
      }
      if (filter.category) {
        if (Array.isArray(filter.category)) {
          query = query.in('category', filter.category)
        } else {
          query = query.eq('category', filter.category)
        }
      }
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id)
      }
      if (filter.request_id) {
        query = query.eq('request_id', filter.request_id)
      }
      if (filter.error_name) {
        query = query.eq('error->name', filter.error_name)
      }
      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from)
      }
      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to)
      }
      if (filter.search) {
        query = query.or(`message.ilike.%${filter.search}%,category.ilike.%${filter.search}%`)
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: logs, error, count } = await query

      if (error) {
        console.error('Error fetching system logs:', error)
        return { success: false, message: 'Erro ao buscar logs do sistema' }
      }

      return {
        success: true,
        logs: logs || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error) {
      console.error('Error fetching system logs:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async getSystemLog(id: string): Promise<SystemLogResponse> {
    try {
      const { data: log, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching system log:', error)
        return { success: false, message: 'Log do sistema não encontrado' }
      }

      return { success: true, data: log }
    } catch (error) {
      console.error('Error fetching system log:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  // Audit Rules Management
  async createAuditRule(data: Omit<AuditRule, 'id' | 'created_at' | 'updated_at'>): Promise<AuditRuleResponse> {
    try {
      const rule: AuditRule = {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from('audit_rules')
        .insert([rule])
        .select()
        .single()

      if (error) {
        console.error('Error creating audit rule:', error)
        return { success: false, message: 'Erro ao criar regra de auditoria' }
      }

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Regra de auditoria criada',
        data.created_by,
        'system',
        rule.id,
        {
          description: `Regra de auditoria criada: ${data.name}`,
          entityName: 'audit_rule'
        }
      )

      return { success: true, data: result, message: 'Regra de auditoria criada com sucesso' }
    } catch (error) {
      console.error('Error creating audit rule:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async getAuditRules(): Promise<AuditRuleResponse> {
    try {
      const { data: rules, error } = await supabase
        .from('audit_rules')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching audit rules:', error)
        return { success: false, message: 'Erro ao buscar regras de auditoria' }
      }

      return { success: true, rules: rules || [] }
    } catch (error) {
      console.error('Error fetching audit rules:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async updateAuditRule(id: string, data: Partial<AuditRule>, userId: string): Promise<AuditRuleResponse> {
    try {
      const { data: result, error } = await supabase
        .from('audit_rules')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating audit rule:', error)
        return { success: false, message: 'Erro ao atualizar regra de auditoria' }
      }

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Regra de auditoria atualizada',
        userId,
        'system',
        id,
        {
          description: `Regra de auditoria atualizada: ${result.name}`,
          entityName: 'audit_rule'
        }
      )

      return { success: true, data: result, message: 'Regra de auditoria atualizada com sucesso' }
    } catch (error) {
      console.error('Error updating audit rule:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async deleteAuditRule(id: string, userId: string): Promise<AuditRuleResponse> {
    try {
      const { error } = await supabase
        .from('audit_rules')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting audit rule:', error)
        return { success: false, message: 'Erro ao excluir regra de auditoria' }
      }

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Regra de auditoria excluída',
        userId,
        'system',
        id,
        {
          description: 'Regra de auditoria excluída',
          entityName: 'audit_rule'
        }
      )

      return { success: true, message: 'Regra de auditoria excluída com sucesso' }
    } catch (error) {
      console.error('Error deleting audit rule:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  // Audit Reports Management
  async createAuditReport(data: Omit<AuditReport, 'id' | 'created_at' | 'updated_at'>): Promise<AuditReportResponse> {
    try {
      const report: AuditReport = {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from('audit_reports')
        .insert([report])
        .select()
        .single()

      if (error) {
        console.error('Error creating audit report:', error)
        return { success: false, message: 'Erro ao criar relatório de auditoria' }
      }

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Relatório de auditoria criado',
        data.created_by,
        'system',
        report.id,
        {
          description: `Relatório de auditoria criado: ${data.name}`,
          entityName: 'audit_report'
        }
      )

      return { success: true, data: result, message: 'Relatório de auditoria criado com sucesso' }
    } catch (error) {
      console.error('Error creating audit report:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async getAuditReports(): Promise<AuditReportResponse> {
    try {
      const { data: reports, error } = await supabase
        .from('audit_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching audit reports:', error)
        return { success: false, message: 'Erro ao buscar relatórios de auditoria' }
      }

      return { success: true, reports: reports || [] }
    } catch (error) {
      console.error('Error fetching audit reports:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  async generateAuditReport(id: string, userId: string): Promise<AuditReportResponse> {
    try {
      // Get report configuration
      const { data: report, error: reportError } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('id', id)
        .single()

      if (reportError || !report) {
        return { success: false, message: 'Relatório não encontrado' }
      }

      // Get audit logs based on report filters
      const logsResponse = await this.getAuditLogs(
        report.filters,
        { field: 'created_at', direction: 'desc' },
        1,
        AUDIT_SETTINGS.MAX_EXPORT_RECORDS
      )

      if (!logsResponse.success || !logsResponse.logs) {
        return { success: false, message: 'Erro ao buscar dados para o relatório' }
      }

      // Generate report file based on format
      const fileUrl = await this.generateReportFile(logsResponse.logs, report.format, report.name)

      // Update report generation timestamp
      await supabase
        .from('audit_reports')
        .update({ 
          last_generated_at: new Date().toISOString(),
          next_generation_at: this.calculateNextGeneration(report.schedule)
        })
        .eq('id', id)

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Relatório de auditoria gerado',
        userId,
        'system',
        id,
        {
          description: `Relatório de auditoria gerado: ${report.name}`,
          entityName: 'audit_report'
        }
      )

      return { 
        success: true, 
        message: 'Relatório gerado com sucesso',
        file_url: fileUrl
      }
    } catch (error) {
      console.error('Error generating audit report:', error)
      return { success: false, message: 'Erro interno do servidor' }
    }
  }

  // Statistics
  async getAuditStats(dateFrom?: string, dateTo?: string): Promise<AuditStats> {
    try {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Get total logs count
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })

      // Get logs today
      const { count: logsToday } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Get logs this week
      const { count: logsThisWeek } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisWeek.toISOString())

      // Get logs this month
      const { count: logsThisMonth } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString())

      // Get high risk events
      const { count: highRiskEvents } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('risk_score', AUDIT_SETTINGS.HIGH_RISK_THRESHOLD)
        .gte('created_at', today.toISOString())

      // Get specific action counts
      const { count: failedLogins } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', AuditAction.LOGIN_FAILED)
        .gte('created_at', today.toISOString())

      const { count: successfulLogins } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', AuditAction.LOGIN)
        .gte('created_at', today.toISOString())

      const { count: dataModifications } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .in('action', [AuditAction.DATA_CREATED, AuditAction.DATA_UPDATED, AuditAction.DATA_DELETED])
        .gte('created_at', today.toISOString())

      // Get top users (mock data for now)
      const topUsers = [
        { user_id: '1', user_name: 'João Silva', action_count: 45 },
        { user_id: '2', user_name: 'Maria Santos', action_count: 32 },
        { user_id: '3', user_name: 'Pedro Costa', action_count: 28 }
      ]

      // Get top actions (mock data for now)
      const topActions = [
        { action: AuditAction.LOGIN, count: 156 },
        { action: AuditAction.DATA_VIEWED, count: 89 },
        { action: AuditAction.DATA_UPDATED, count: 67 }
      ]

      // Risk distribution (mock data for now)
      const riskDistribution = [
        { risk_level: 'Baixo', count: 234, percentage: 65 },
        { risk_level: 'Médio', count: 89, percentage: 25 },
        { risk_level: 'Alto', count: 28, percentage: 8 },
        { risk_level: 'Crítico', count: 7, percentage: 2 }
      ]

      // Hourly activity (mock data for now)
      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: Math.floor(Math.random() * 20)
      }))

      return {
        total_logs: totalLogs || 0,
        logs_today: logsToday || 0,
        logs_this_week: logsThisWeek || 0,
        logs_this_month: logsThisMonth || 0,
        high_risk_events: highRiskEvents || 0,
        failed_logins: failedLogins || 0,
        successful_logins: successfulLogins || 0,
        data_modifications: dataModifications || 0,
        system_errors: 0,
        security_violations: 0,
        top_users: topUsers,
        top_actions: topActions,
        risk_distribution: riskDistribution,
        hourly_activity: hourlyActivity
      }
    } catch (error) {
      console.error('Error getting audit stats:', error)
      return {
        total_logs: 0,
        logs_today: 0,
        logs_this_week: 0,
        logs_this_month: 0,
        high_risk_events: 0,
        failed_logins: 0,
        successful_logins: 0,
        data_modifications: 0,
        system_errors: 0,
        security_violations: 0,
        top_users: [],
        top_actions: [],
        risk_distribution: [],
        hourly_activity: []
      }
    }
  }

  async getLogStats(dateFrom?: string, dateTo?: string): Promise<LogStats> {
    try {
      // Get total logs count
      const { count: totalLogs } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })

      // Mock data for demonstration
      const logsByLevel = {
        [LogLevel.DEBUG]: 1234,
        [LogLevel.INFO]: 5678,
        [LogLevel.WARN]: 234,
        [LogLevel.ERROR]: 89,
        [LogLevel.FATAL]: 12
      }

      const logsByCategory = {
        [LogCategory.APPLICATION]: 2345,
        [LogCategory.DATABASE]: 1234,
        [LogCategory.AUTHENTICATION]: 567,
        [LogCategory.API]: 890,
        [LogCategory.SECURITY]: 123,
        [LogCategory.PERFORMANCE]: 456,
        [LogCategory.SYSTEM]: 234,
        [LogCategory.INTEGRATION]: 123
      }

      const topErrors = [
        { error: 'DatabaseConnectionError', count: 45 },
        { error: 'ValidationError', count: 32 },
        { error: 'AuthenticationError', count: 28 }
      ]

      const performanceMetrics = [
        { endpoint: '/api/users', avg_duration: 245, request_count: 1234 },
        { endpoint: '/api/reports', avg_duration: 1890, request_count: 567 },
        { endpoint: '/api/auth/login', avg_duration: 123, request_count: 890 }
      ]

      return {
        total_logs: totalLogs || 0,
        logs_by_level: logsByLevel,
        logs_by_category: logsByCategory,
        error_rate: 2.5,
        average_response_time: 456,
        memory_usage_avg: 78.5,
        cpu_usage_avg: 45.2,
        top_errors: topErrors,
        performance_metrics: performanceMetrics
      }
    } catch (error) {
      console.error('Error getting log stats:', error)
      return {
        total_logs: 0,
        logs_by_level: {} as Record<LogLevel, number>,
        logs_by_category: {} as Record<LogCategory, number>,
        error_rate: 0,
        average_response_time: 0,
        memory_usage_avg: 0,
        cpu_usage_avg: 0,
        top_errors: [],
        performance_metrics: []
      }
    }
  }

  // Utility Methods
  private async generateReportFile(logs: AuditLog[], format: ReportFormat, name: string): Promise<string> {
    // This would typically generate and upload the file to storage
    // For now, return a mock URL
    return `https://example.com/reports/${name}-${Date.now()}.${format.toLowerCase()}`
  }

  private calculateNextGeneration(schedule?: ReportSchedule): string | undefined {
    if (!schedule) return undefined

    const now = new Date()
    const next = new Date(now)

    switch (schedule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
      case 'quarterly':
        next.setMonth(next.getMonth() + 3)
        break
    }

    next.setHours(schedule.hour, schedule.minute, 0, 0)
    return next.toISOString()
  }

  // Cleanup Methods
  async cleanupOldLogs(): Promise<void> {
    try {
      const auditRetentionDate = new Date()
      auditRetentionDate.setDate(auditRetentionDate.getDate() - AUDIT_SETTINGS.DEFAULT_RETENTION_DAYS)

      const logRetentionDate = new Date()
      logRetentionDate.setDate(logRetentionDate.getDate() - LOG_SETTINGS.DEFAULT_RETENTION_DAYS)

      // Delete old audit logs
      await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', auditRetentionDate.toISOString())

      // Delete old system logs
      await supabase
        .from('system_logs')
        .delete()
        .lt('created_at', logRetentionDate.toISOString())

      console.log('Old logs cleaned up successfully')
    } catch (error) {
      console.error('Error cleaning up old logs:', error)
    }
  }

  // Helper method to log audit events
  async logAuditEvent(
    userId: string | undefined,
    action: AuditAction,
    resourceType: ResourceType,
    resourceId: string | undefined,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        description,
        metadata,
        ip_address: ipAddress || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        risk_score: this.calculateRiskScore(action, metadata),
        severity: this.calculateSeverity(action),
        category: this.getActionCategory(action)
      })
    } catch (error) {
      console.error('Error logging audit event:', error)
    }
  }

  private calculateRiskScore(action: AuditAction, metadata?: Record<string, any>): number {
    // Simple risk scoring logic
    const riskMap: Record<AuditAction, number> = {
      [AuditAction.LOGIN_FAILED]: 6,
      [AuditAction.SECURITY_VIOLATION]: 9,
      [AuditAction.SUSPICIOUS_ACTIVITY]: 8,
      [AuditAction.ACCESS_DENIED]: 5,
      [AuditAction.DATA_DELETED]: 7,
      [AuditAction.USER_DELETED]: 8,
      [AuditAction.CONFIGURATION_CHANGED]: 6,
      [AuditAction.PERMISSION_CHANGED]: 7,
      [AuditAction.PASSWORD_CHANGED]: 4,
      [AuditAction.TWO_FACTOR_DISABLED]: 6,
      [AuditAction.LOGIN]: 2,
      [AuditAction.DATA_VIEWED]: 1,
      [AuditAction.DATA_CREATED]: 3,
      [AuditAction.DATA_UPDATED]: 3,
      [AuditAction.USER_CREATED]: 4,
      [AuditAction.USER_UPDATED]: 3,
      [AuditAction.LOGOUT]: 1,
      [AuditAction.PASSWORD_RESET]: 5,
      [AuditAction.TWO_FACTOR_ENABLED]: 2,
      [AuditAction.USER_ACTIVATED]: 3,
      [AuditAction.USER_DEACTIVATED]: 5,
      [AuditAction.USER_ROLE_CHANGED]: 6,
      [AuditAction.DATA_EXPORTED]: 4,
      [AuditAction.DATA_IMPORTED]: 5,
      [AuditAction.SYSTEM_BACKUP]: 3,
      [AuditAction.SYSTEM_RESTORE]: 7,
      [AuditAction.SYSTEM_MAINTENANCE]: 4,
      [AuditAction.API_REQUEST]: 1,
      [AuditAction.API_ERROR]: 4,
      [AuditAction.RATE_LIMIT_EXCEEDED]: 5
    }

    return riskMap[action] || 3
  }

  private calculateSeverity(action: AuditAction): AuditSeverity {
    const severityMap: Record<AuditAction, AuditSeverity> = {
      [AuditAction.SECURITY_VIOLATION]: AuditSeverity.CRITICAL,
      [AuditAction.SUSPICIOUS_ACTIVITY]: AuditSeverity.HIGH,
      [AuditAction.DATA_DELETED]: AuditSeverity.HIGH,
      [AuditAction.USER_DELETED]: AuditSeverity.HIGH,
      [AuditAction.SYSTEM_RESTORE]: AuditSeverity.HIGH,
      [AuditAction.LOGIN_FAILED]: AuditSeverity.MEDIUM,
      [AuditAction.ACCESS_DENIED]: AuditSeverity.MEDIUM,
      [AuditAction.CONFIGURATION_CHANGED]: AuditSeverity.MEDIUM,
      [AuditAction.PERMISSION_CHANGED]: AuditSeverity.MEDIUM,
      [AuditAction.PASSWORD_RESET]: AuditSeverity.MEDIUM,
      [AuditAction.TWO_FACTOR_DISABLED]: AuditSeverity.MEDIUM,
      [AuditAction.USER_ROLE_CHANGED]: AuditSeverity.MEDIUM,
      [AuditAction.DATA_IMPORTED]: AuditSeverity.MEDIUM,
      [AuditAction.USER_DEACTIVATED]: AuditSeverity.MEDIUM,
      [AuditAction.RATE_LIMIT_EXCEEDED]: AuditSeverity.MEDIUM,
      [AuditAction.API_ERROR]: AuditSeverity.MEDIUM,
      [AuditAction.LOGIN]: AuditSeverity.LOW,
      [AuditAction.LOGOUT]: AuditSeverity.LOW,
      [AuditAction.DATA_VIEWED]: AuditSeverity.LOW,
      [AuditAction.DATA_CREATED]: AuditSeverity.LOW,
      [AuditAction.DATA_UPDATED]: AuditSeverity.LOW,
      [AuditAction.DATA_EXPORTED]: AuditSeverity.LOW,
      [AuditAction.USER_CREATED]: AuditSeverity.LOW,
      [AuditAction.USER_UPDATED]: AuditSeverity.LOW,
      [AuditAction.USER_ACTIVATED]: AuditSeverity.LOW,
      [AuditAction.PASSWORD_CHANGED]: AuditSeverity.LOW,
      [AuditAction.TWO_FACTOR_ENABLED]: AuditSeverity.LOW,
      [AuditAction.SYSTEM_BACKUP]: AuditSeverity.LOW,
      [AuditAction.SYSTEM_MAINTENANCE]: AuditSeverity.LOW,
      [AuditAction.API_REQUEST]: AuditSeverity.LOW
    }

    return severityMap[action] || AuditSeverity.LOW
  }

  private getActionCategory(action: AuditAction): AuditCategory {
    const categoryMap: Record<AuditAction, AuditCategory> = {
      [AuditAction.LOGIN]: AuditCategory.AUTHENTICATION,
      [AuditAction.LOGOUT]: AuditCategory.AUTHENTICATION,
      [AuditAction.LOGIN_FAILED]: AuditCategory.AUTHENTICATION,
      [AuditAction.PASSWORD_CHANGED]: AuditCategory.AUTHENTICATION,
      [AuditAction.PASSWORD_RESET]: AuditCategory.AUTHENTICATION,
      [AuditAction.TWO_FACTOR_ENABLED]: AuditCategory.AUTHENTICATION,
      [AuditAction.TWO_FACTOR_DISABLED]: AuditCategory.AUTHENTICATION,
      [AuditAction.ACCESS_DENIED]: AuditCategory.AUTHORIZATION,
      [AuditAction.PERMISSION_CHANGED]: AuditCategory.AUTHORIZATION,
      [AuditAction.USER_ROLE_CHANGED]: AuditCategory.AUTHORIZATION,
      [AuditAction.DATA_VIEWED]: AuditCategory.DATA_ACCESS,
      [AuditAction.DATA_EXPORTED]: AuditCategory.DATA_ACCESS,
      [AuditAction.DATA_CREATED]: AuditCategory.DATA_MODIFICATION,
      [AuditAction.DATA_UPDATED]: AuditCategory.DATA_MODIFICATION,
      [AuditAction.DATA_DELETED]: AuditCategory.DATA_MODIFICATION,
      [AuditAction.DATA_IMPORTED]: AuditCategory.DATA_MODIFICATION,
      [AuditAction.USER_CREATED]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.USER_UPDATED]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.USER_DELETED]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.USER_ACTIVATED]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.USER_DEACTIVATED]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.SYSTEM_BACKUP]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.SYSTEM_RESTORE]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.SYSTEM_MAINTENANCE]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.CONFIGURATION_CHANGED]: AuditCategory.SYSTEM_ADMINISTRATION,
      [AuditAction.SECURITY_VIOLATION]: AuditCategory.SECURITY,
      [AuditAction.SUSPICIOUS_ACTIVITY]: AuditCategory.SECURITY,
      [AuditAction.API_REQUEST]: AuditCategory.PERFORMANCE,
      [AuditAction.API_ERROR]: AuditCategory.PERFORMANCE,
      [AuditAction.RATE_LIMIT_EXCEEDED]: AuditCategory.PERFORMANCE
    }

    return categoryMap[action] || AuditCategory.SYSTEM_ADMINISTRATION
  }
}