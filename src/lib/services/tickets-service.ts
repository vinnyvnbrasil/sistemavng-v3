import { createClient } from '@supabase/supabase-js';
import { 
  Ticket, 
  TicketFilters, 
  TicketStats, 
  TicketPriority, 
  TicketStatus,
  TicketMessage,
  TicketAttachment,
  Marketplace,
  MarketplaceConfig
} from '@/types/tickets';

export class TicketsService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // ==================== TICKETS CRUD ====================

  async getTickets(
    companyId: string, 
    filters?: TicketFilters, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{
    data: Ticket[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      let query = this.supabase
        .from('tickets')
        .select(`
          *,
          assigned_to:profiles!tickets_assigned_to_fkey(id, full_name, avatar_url),
          created_by:profiles!tickets_created_by_fkey(id, full_name, avatar_url),
          comments:ticket_comments(count),
          attachments:ticket_attachments(count)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.marketplace && filters.marketplace.length > 0) {
        query = query.in('marketplace', filters.marketplace);
      }

      if (filters?.assigned_to && filters.assigned_to.length > 0) {
        query = query.in('assigned_to', filters.assigned_to);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Paginação
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      throw new Error(`Erro ao buscar tickets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await this.supabase
        .from('tickets')
        .select(`
          *,
          assigned_to:profiles!tickets_assigned_to_fkey(id, full_name, avatar_url, email),
          created_by:profiles!tickets_created_by_fkey(id, full_name, avatar_url, email),
          comments:ticket_comments(
            *,
            created_by:profiles!ticket_comments_created_by_fkey(id, full_name, avatar_url)
          ),
          attachments:ticket_attachments(*),
          escalations:ticket_escalations(
            *,
            escalated_by:profiles!ticket_escalations_escalated_by_fkey(id, full_name),
            escalated_to:profiles!ticket_escalations_escalated_to_fkey(id, full_name)
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      throw new Error(`Erro ao buscar ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createTicket(ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    try {
      // Calcular SLA baseado na prioridade
      const slaConfig = await this.getSLAConfig(ticketData.company_id, ticketData.priority);
      const sla_due_date = this.calculateSLADueDate(slaConfig);

      const { data, error } = await this.supabase
        .from('tickets')
        .insert({
          ...ticketData,
          sla_due_date,
          ticket_number: await this.generateTicketNumber(ticketData.company_id)
        })
        .select()
        .single();

      if (error) throw error;

      // Criar comentário inicial se fornecido
      if (ticketData.description) {
        await this.addComment(data.id, {
          message: ticketData.description,
          user_id: ticketData.created_by,
          is_internal: false
        });
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      throw new Error(`Erro ao criar ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updateTicket(
    ticketId: string, 
    updates: Partial<Ticket>,
    userId: string
  ): Promise<Ticket> {
    try {
      const { data, error } = await this.supabase
        .from('tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Registrar mudanças importantes como comentários
      if (updates.status || updates.priority || updates.assigned_to) {
        const changes = [];
        if (updates.status) changes.push(`Status alterado para: ${updates.status}`);
        if (updates.priority) changes.push(`Prioridade alterada para: ${updates.priority}`);
        if (updates.assigned_to) changes.push(`Ticket atribuído`);

        await this.addComment(ticketId, {
          message: `Ticket atualizado:\n${changes.join('\n')}`,
          user_id: userId,
          is_internal: true
        });
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      throw new Error(`Erro ao atualizar ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteTicket(ticketId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar ticket:', error);
      throw new Error(`Erro ao deletar ticket: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==================== COMENTÁRIOS ====================

  async addComment(
    ticketId: string,
    comment: Omit<TicketMessage, 'id' | 'ticket_id' | 'created_at'>
  ): Promise<TicketMessage> {
    try {
      const { data, error } = await this.supabase
        .from('ticket_comments')
        .insert({
          ...comment,
          ticket_id: ticketId
        })
        .select(`
          *,
          created_by:profiles!ticket_comments_created_by_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Atualizar timestamp do ticket
      await this.supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return data;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw new Error(`Erro ao adicionar comentário: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getComments(ticketId: string): Promise<TicketMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('ticket_comments')
        .select(`
          *,
          created_by:profiles!ticket_comments_created_by_fkey(id, full_name, avatar_url)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      throw new Error(`Erro ao buscar comentários: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==================== ANEXOS ====================

  async addAttachment(
    ticketId: string,
    attachment: Omit<TicketAttachment, 'id' | 'ticket_id' | 'created_at'>
  ): Promise<TicketAttachment> {
    try {
      const { data, error } = await this.supabase
        .from('ticket_attachments')
        .insert({
          ...attachment,
          ticket_id: ticketId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar anexo:', error);
      throw new Error(`Erro ao adicionar anexo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadFile(file: File, ticketId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${ticketId}/${Date.now()}.${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = this.supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw new Error(`Erro ao fazer upload do arquivo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==================== ESTATÍSTICAS ====================

  async getTicketStats(companyId: string): Promise<TicketStats> {
    try {
      const { data: tickets, error } = await this.supabase
        .from('tickets')
        .select('status, priority, marketplace, created_at, sla_due_date')
        .eq('company_id', companyId);

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: TicketStats = {
        total: tickets.length,
        by_status: {} as Record<TicketStatus, number>,
        by_priority: {} as Record<TicketPriority, number>,
        by_marketplace: {} as Record<Marketplace, number>,
        avg_resolution_time: 0, // TODO: Calcular baseado em tickets resolvidos
        resolution_rate: 0, // TODO: Calcular baseado em tickets resolvidos
        customer_satisfaction: 0 // TODO: Implementar sistema de avaliação
      };

      // Contar por status
      tickets.forEach((ticket: any) => {
        const status = ticket.status as TicketStatus;
        const priority = ticket.priority as TicketPriority;
        const marketplace = ticket.marketplace as Marketplace;
        
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;
        stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
        if (marketplace) {
          stats.by_marketplace[marketplace] = (stats.by_marketplace[marketplace] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Erro ao buscar estatísticas: ${JSON.stringify(error)}`);
    }
  }

  // ==================== CONFIGURAÇÕES ====================

  async getMarketplaceConfigs(companyId: string): Promise<MarketplaceConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from('marketplace_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar configurações de marketplace:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Erro ao buscar configurações de marketplace: ${JSON.stringify(error)}`);
    }
  }

  async getTicketTemplates(companyId: string, type?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('ticket_templates')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (type) {
        query = query.eq('ticket_type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      throw new Error(`Erro ao buscar templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ==================== SLA E ESCALAÇÃO ====================

  async getSLAConfig(
    companyId: string, 
    priority: TicketPriority
  ): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('ticket_sla_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('priority', priority)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar configuração SLA:', error);
      return null;
    }
  }

  private calculateSLADueDate(slaConfig: any | null): string | null {
    if (!slaConfig) return null;

    const now = new Date();
    const dueDate = new Date(now.getTime() + slaConfig.response_time_hours * 60 * 60 * 1000);
    return dueDate.toISOString();
  }

  async escalateTicket(
    ticketId: string,
    escalatedBy: string,
    escalatedTo: string,
    reason: string
  ): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('ticket_escalations')
        .insert({
          ticket_id: ticketId,
          escalated_by: escalatedBy,
          escalated_to: escalatedTo,
          reason,
          escalated_at: new Date().toISOString()
        })
        .select(`
          *,
          escalated_by:profiles!ticket_escalations_escalated_by_fkey(id, full_name),
          escalated_to:profiles!ticket_escalations_escalated_to_fkey(id, full_name)
        `)
        .single();

      if (error) throw error;

      // Atualizar o ticket
      await this.updateTicket(ticketId, {
        assigned_to: escalatedTo,
        priority: 'high' as TicketPriority // Aumentar prioridade na escalação
      }, escalatedBy);

      return data;
    } catch (error) {
      console.error('Erro ao escalar ticket:', error);
      throw error;
    }
  }

  // ==================== UTILITÁRIOS ====================

  private async generateTicketNumber(companyId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('tickets')
        .select('ticket_number')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = parseInt(data[0].ticket_number.split('-').pop() || '0');
        nextNumber = lastNumber + 1;
      }

      const year = new Date().getFullYear();
      return `TKT-${year}-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar número do ticket:', error);
      return `TKT-${new Date().getFullYear()}-${Date.now()}`;
    }
  }

  async getTeamMembers(companyId: string): Promise<Array<{
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  }>> {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select(`
          user_id,
          role,
          profiles!team_members_user_id_fkey(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;

      return data?.map((member: any) => ({
        id: member.profiles?.id,
        full_name: member.profiles?.full_name,
        email: member.profiles?.email,
        avatar_url: member.profiles?.avatar_url,
        role: member.role
      })) || [];
    } catch (error) {
      console.error('Erro ao buscar membros da equipe:', error);
      return [];
    }
  }

  async getMarketplaces(companyId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('tickets')
        .select('marketplace')
        .eq('company_id', companyId)
        .not('marketplace', 'is', null);

      if (error) throw error;

      const marketplaces = [...new Set(data?.map(t => t.marketplace).filter(Boolean))];
      return marketplaces;
    } catch (error) {
      console.error('Erro ao buscar marketplaces:', error);
      return [];
    }
  }

  // ==================== AUTOMAÇÃO ====================

  async processAutomaticActions(ticketId: string): Promise<void> {
    try {
      const ticket = await this.getTicketById(ticketId);
      if (!ticket) return;

      // Verificar SLA
      if ((ticket as any).sla_due_date && new Date((ticket as any).sla_due_date) < new Date()) {
        await this.addComment(ticketId, {
          message: '⚠️ SLA violado! Este ticket precisa de atenção imediata.',
          user_id: 'system',
          is_internal: true
        });
      }

      // Auto-escalação baseada em regras
      const escalationRules = await this.getEscalationRules(ticket.company_id);
      for (const rule of escalationRules) {
        if (this.shouldEscalate(ticket, rule)) {
          await this.escalateTicket(
            ticketId,
            'system',
            rule.escalate_to,
            `Auto-escalação: ${rule.condition}`
          );
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao processar ações automáticas:', error);
    }
  }

  private async getEscalationRules(companyId: string): Promise<any[]> {
    // TODO: Implementar busca de regras de escalação
    return [];
  }

  private shouldEscalate(ticket: Ticket, rule: any): boolean {
    // TODO: Implementar lógica de verificação de regras
    return false;
  }
}