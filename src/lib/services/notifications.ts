import { supabase } from '@/lib/supabase'
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationPreference,
  NotificationSubscription,
  NotificationStats,
  RealTimeConnection,
  WebSocketMessage,
  CreateNotificationData,
  UpdateNotificationData,
  NotificationFilter,
  NotificationSort,
  PaginatedNotifications,
  ChannelType,
  NotificationFrequency,
  MessageType,
  validateNotificationData,
  createNotificationTemplate,
  formatNotificationTime
} from '@/types/notifications'
import { ActivityService } from './activities'

export class NotificationService {
  private static wsConnections = new Map<string, WebSocket>()
  private static userConnections = new Map<string, Set<string>>()

  // Notification Management
  static async getNotifications(
    userId: string,
    filter?: NotificationFilter,
    sort?: NotificationSort,
    page = 1,
    limit = 20
  ): Promise<PaginatedNotifications> {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
        `, { count: 'exact' })
        .eq('recipient_id', userId)

      // Apply filters
      if (filter) {
        if (filter.type) {
          if (Array.isArray(filter.type)) {
            query = query.in('type', filter.type)
          } else {
            query = query.eq('type', filter.type)
          }
        }

        if (filter.priority) {
          if (Array.isArray(filter.priority)) {
            query = query.in('priority', filter.priority)
          } else {
            query = query.eq('priority', filter.priority)
          }
        }

        if (filter.status) {
          if (Array.isArray(filter.status)) {
            query = query.in('status', filter.status)
          } else {
            query = query.eq('status', filter.status)
          }
        }

        if (filter.is_read !== undefined) {
          if (filter.is_read) {
            query = query.not('read_at', 'is', null)
          } else {
            query = query.is('read_at', null)
          }
        }

        if (filter.sender_id) {
          query = query.eq('sender_id', filter.sender_id)
        }

        if (filter.entity_type) {
          query = query.eq('entity_type', filter.entity_type)
        }

        if (filter.entity_id) {
          query = query.eq('entity_id', filter.entity_id)
        }

        if (filter.date_from) {
          query = query.gte('created_at', filter.date_from)
        }

        if (filter.date_to) {
          query = query.lte('created_at', filter.date_to)
        }

        if (filter.search) {
          query = query.or(`title.ilike.%${filter.search}%,message.ilike.%${filter.search}%`)
        }
      }

      // Apply sorting
      const sortField = sort?.field || 'created_at'
      const sortDirection = sort?.direction || 'desc'
      query = query.order(sortField, { ascending: sortDirection === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      const notifications: Notification[] = (data || []).map(notification => ({
        ...notification,
        sender_name: notification.sender?.full_name,
        sender_avatar: notification.sender?.avatar_url,
        time_ago: formatNotificationTime(notification.created_at),
        is_read: !!notification.read_at,
        is_expired: notification.expires_at ? new Date(notification.expires_at) < new Date() : false
      }))

      return {
        notifications,
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
      throw new Error('Falha ao carregar notificações')
    }
  }

  static async getNotificationById(id: string): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Notificação não encontrada')

      return {
        ...data,
        sender_name: data.sender?.full_name,
        sender_avatar: data.sender?.avatar_url,
        time_ago: formatNotificationTime(data.created_at),
        is_read: !!data.read_at,
        is_expired: data.expires_at ? new Date(data.expires_at) < new Date() : false
      }
    } catch (error) {
      console.error('Erro ao buscar notificação:', error)
      throw new Error('Falha ao carregar notificação')
    }
  }

  static async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      // Validate data
      const validationErrors = validateNotificationData(data)
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`)
      }

      // If template is provided, use it to generate title and message
      let title = data.title
      let message = data.message

      if (data.template_id && data.template_data) {
        const template = createNotificationTemplate(
          data.type,
          data.template_data.entityName,
          data.template_data.userName,
          data.template_data
        )
        title = template.title
        message = template.message
      }

      // Handle multiple recipients
      const recipientIds = data.recipient_ids || (data.recipient_id ? [data.recipient_id] : [])
      const notifications: Notification[] = []

      for (const recipientId of recipientIds) {
        const { data: notification, error } = await supabase
          .from('notifications')
          .insert({
            title,
            message,
            type: data.type,
            priority: data.priority || 'medium',
            status: 'pending' as NotificationStatus,
            recipient_id: recipientId,
            sender_id: data.sender_id,
            entity_type: data.entity_type,
            entity_id: data.entity_id,
            metadata: data.metadata,
            action_url: data.action_url,
            action_label: data.action_label,
            expires_at: data.expires_at
          })
          .select(`
            *,
            sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
          `)
          .single()

        if (error) throw error

        const formattedNotification: Notification = {
          ...notification,
          sender_name: notification.sender?.full_name,
          sender_avatar: notification.sender?.avatar_url,
          time_ago: formatNotificationTime(notification.created_at),
          is_read: false,
          is_expired: false
        }

        notifications.push(formattedNotification)

        // Send real-time notification
        await this.sendRealTimeNotification(recipientId, formattedNotification)

        // Send through other channels if specified
        if (data.channels) {
          await this.sendThroughChannels(formattedNotification, data.channels)
        }
      }

      // Log activity
      if (data.sender_id) {
        await ActivityService.logActivity(
          'notification_created',
          `Notificação "${title}" foi enviada`,
          data.sender_id,
          'notification',
          notifications[0].id,
          {
            entityName: title,
            metadata: {
              type: data.type,
              recipients_count: recipientIds.length
            }
          }
        )
      }

      return notifications[0]
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      throw new Error('Falha ao criar notificação')
    }
  }

  static async updateNotification(id: string, data: UpdateNotificationData): Promise<Notification> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(full_name, avatar_url)
        `)
        .single()

      if (error) throw error
      if (!notification) throw new Error('Notificação não encontrada')

      const formattedNotification: Notification = {
        ...notification,
        sender_name: notification.sender?.full_name,
        sender_avatar: notification.sender?.avatar_url,
        time_ago: formatNotificationTime(notification.created_at),
        is_read: !!notification.read_at,
        is_expired: notification.expires_at ? new Date(notification.expires_at) < new Date() : false
      }

      // Send real-time update
      await this.sendRealTimeMessage(notification.recipient_id, {
        type: 'notification_read',
        payload: formattedNotification,
        timestamp: new Date().toISOString()
      })

      return formattedNotification
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error)
      throw new Error('Falha ao atualizar notificação')
    }
  }

  static async markAsRead(id: string): Promise<Notification> {
    return this.updateNotification(id, {
      read_at: new Date().toISOString(),
      status: 'delivered' as NotificationStatus
    })
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString(),
          status: 'delivered' as NotificationStatus
        })
        .eq('recipient_id', userId)
        .is('read_at', null)

      if (error) throw error

      // Send real-time update
      await this.sendRealTimeMessage(userId, {
        type: 'notification_read',
        payload: { all: true },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      throw new Error('Falha ao marcar notificações como lidas')
    }
  }

  static async deleteNotification(id: string): Promise<void> {
    try {
      const notification = await this.getNotificationById(id)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Send real-time update
      await this.sendRealTimeMessage(notification.recipient_id, {
        type: 'notification_deleted',
        payload: { id },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erro ao excluir notificação:', error)
      throw new Error('Falha ao excluir notificação')
    }
  }

  // Notification Preferences
  static async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao buscar preferências:', error)
      throw new Error('Falha ao carregar preferências de notificação')
    }
  }

  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>[]
  ): Promise<NotificationPreference[]> {
    try {
      // Delete existing preferences
      await supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', userId)

      // Insert new preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(
          preferences.map(pref => ({
            ...pref,
            user_id: userId
          }))
        )
        .select()

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error)
      throw new Error('Falha ao atualizar preferências de notificação')
    }
  }

  // Notification Stats
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const [totalResult, unreadResult, todayResult, weekResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .is('read_at', null),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .gte('created_at', new Date().toISOString().split('T')[0]),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ])

      // Get notifications by type
      const { data: typeData } = await supabase
        .from('notifications')
        .select('type')
        .eq('recipient_id', userId)

      const typeStats = typeData?.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const totalNotifications = totalResult.count || 0
      const notificationsByType = Object.entries(typeStats).map(([type, count]) => ({
        type: type as NotificationType,
        count,
        percentage: totalNotifications > 0 ? Math.round((count / totalNotifications) * 100) : 0
      }))

      // Get notifications by priority
      const { data: priorityData } = await supabase
        .from('notifications')
        .select('priority')
        .eq('recipient_id', userId)

      const priorityStats = priorityData?.reduce((acc, notification) => {
        acc[notification.priority] = (acc[notification.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const notificationsByPriority = Object.entries(priorityStats).map(([priority, count]) => ({
        priority: priority as NotificationPriority,
        count,
        percentage: totalNotifications > 0 ? Math.round((count / totalNotifications) * 100) : 0
      }))

      return {
        total_notifications: totalNotifications,
        unread_notifications: unreadResult.count || 0,
        notifications_today: todayResult.count || 0,
        notifications_this_week: weekResult.count || 0,
        notifications_by_type: notificationsByType,
        notifications_by_priority: notificationsByPriority,
        read_rate: totalNotifications > 0 
          ? Math.round(((totalNotifications - (unreadResult.count || 0)) / totalNotifications) * 100)
          : 0,
        average_read_time: 0, // This would require tracking read times
        most_active_hours: [] // This would require more complex querying
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      throw new Error('Falha ao carregar estatísticas de notificação')
    }
  }

  // Real-time WebSocket Management
  static async initializeWebSocket(userId: string): Promise<WebSocket> {
    try {
      // In a real implementation, you would connect to your WebSocket server
      // For now, we'll simulate with a mock WebSocket
      const ws = new WebSocket('ws://localhost:3001/ws')
      
      ws.onopen = () => {
        console.log('WebSocket connected for user:', userId)
        this.registerConnection(userId, ws)
      }

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleWebSocketMessage(userId, message)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected for user:', userId)
        this.unregisterConnection(userId)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error for user:', userId, error)
      }

      return ws
    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error)
      throw new Error('Falha ao conectar WebSocket')
    }
  }

  private static registerConnection(userId: string, ws: WebSocket): void {
    const connectionId = Math.random().toString(36).substring(7)
    this.wsConnections.set(connectionId, ws)
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set())
    }
    this.userConnections.get(userId)?.add(connectionId)
  }

  private static unregisterConnection(userId: string): void {
    const connections = this.userConnections.get(userId)
    if (connections) {
      connections.forEach(connectionId => {
        this.wsConnections.delete(connectionId)
      })
      this.userConnections.delete(userId)
    }
  }

  private static handleWebSocketMessage(userId: string, message: WebSocketMessage): void {
    switch (message.type) {
      case 'ping':
        this.sendRealTimeMessage(userId, {
          type: 'pong',
          payload: {},
          timestamp: new Date().toISOString()
        })
        break
      // Handle other message types as needed
    }
  }

  static async sendRealTimeNotification(userId: string, notification: Notification): Promise<void> {
    await this.sendRealTimeMessage(userId, {
      type: 'notification',
      payload: notification,
      timestamp: new Date().toISOString()
    })
  }

  static async sendRealTimeMessage(userId: string, message: WebSocketMessage): Promise<void> {
    try {
      const connections = this.userConnections.get(userId)
      if (connections) {
        connections.forEach(connectionId => {
          const ws = this.wsConnections.get(connectionId)
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message))
          }
        })
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem em tempo real:', error)
    }
  }

  // Channel Integration
  private static async sendThroughChannels(
    notification: Notification,
    channels: Array<{ type: ChannelType; is_enabled: boolean }>
  ): Promise<void> {
    for (const channel of channels) {
      if (!channel.is_enabled) continue

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(notification)
            break
          case 'push':
            await this.sendPushNotification(notification)
            break
          case 'sms':
            await this.sendSMSNotification(notification)
            break
          case 'webhook':
            await this.sendWebhookNotification(notification)
            break
          // in_app is handled by real-time WebSocket
        }
      } catch (error) {
        console.error(`Erro ao enviar via ${channel.type}:`, error instanceof Error ? error.message : String(error))
      }
    }
  }

  private static async sendEmailNotification(notification: Notification): Promise<void> {
    // Implement email sending logic
    console.log('Sending email notification:', notification.title)
  }

  private static async sendPushNotification(notification: Notification): Promise<void> {
    // Implement push notification logic
    console.log('Sending push notification:', notification.title)
  }

  private static async sendSMSNotification(notification: Notification): Promise<void> {
    // Implement SMS sending logic
    console.log('Sending SMS notification:', notification.title)
  }

  private static async sendWebhookNotification(notification: Notification): Promise<void> {
    // Implement webhook sending logic
    console.log('Sending webhook notification:', notification.title)
  }

  // Utility Methods
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) throw error

      console.log('Expired notifications cleaned up')
    } catch (error) {
      console.error('Erro ao limpar notificações expiradas:', error)
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null)

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error('Erro ao buscar contagem não lidas:', error)
      return 0
    }
  }
}