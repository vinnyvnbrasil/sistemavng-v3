import { supabase } from '@/lib/supabase';
import { BlingConfig, BlingOrder, BlingProduct, BlingCustomer } from '@/types/bling';

export interface BlingSyncLog {
  id: string;
  company_id: string;
  sync_type: 'orders' | 'products' | 'customers' | 'all';
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  started_by?: string;
  options: Record<string, any>;
  result?: BlingSyncResult;
  total_processed: number;
  total_success: number;
  total_errors: number;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BlingSyncResult {
  orders?: {
    processed: number;
    success: number;
    errors: number;
    items: Array<{
      id: string;
      status: 'success' | 'error';
      error?: string;
      data?: BlingOrder;
    }>;
  };
  products?: {
    processed: number;
    success: number;
    errors: number;
    items: Array<{
      id: string;
      status: 'success' | 'error';
      error?: string;
      data?: BlingProduct;
    }>;
  };
  customers?: {
    processed: number;
    success: number;
    errors: number;
    items: Array<{
      id: string;
      status: 'success' | 'error';
      error?: string;
      data?: BlingCustomer;
    }>;
  };
}

export interface BlingSyncOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
  forceUpdate?: boolean;
}

export interface BlingSyncStats {
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  in_progress_syncs: number;
  avg_duration_minutes: number;
  last_sync_at: string;
  sync_types: Record<string, {
    count: number;
    success_rate: number;
  }>;
}

export class BlingSyncLogsService {
  /**
   * Cria um novo log de sincronização
   */
  static async createSyncLog(data: {
    company_id: string;
    sync_type: BlingSyncLog['sync_type'];
    started_by?: string;
    options?: BlingSyncOptions;
    metadata?: Record<string, any>;
  }): Promise<BlingSyncLog> {
    const { data: syncLog, error } = await supabase
      .from('bling_sync_logs')
      .insert({
        company_id: data.company_id,
        sync_type: data.sync_type,
        started_by: data.started_by,
        options: data.options || {},
        metadata: data.metadata || {},
        status: 'in_progress',
        total_processed: 0,
        total_success: 0,
        total_errors: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar log de sincronização: ${error.message}`);
    }

    return syncLog;
  }

  /**
   * Atualiza um log de sincronização
   */
  static async updateSyncLog(
    id: string,
    updates: Partial<Pick<BlingSyncLog, 
      'status' | 'completed_at' | 'result' | 'total_processed' | 
      'total_success' | 'total_errors' | 'error_message' | 'metadata'
    >>
  ): Promise<BlingSyncLog> {
    const updateData: any = { ...updates };
    
    // Se o status está sendo alterado para completed ou failed, definir completed_at
    if (updates.status && ['completed', 'failed', 'cancelled'].includes(updates.status)) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: syncLog, error } = await supabase
      .from('bling_sync_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar log de sincronização: ${error.message}`);
    }

    return syncLog;
  }

  /**
   * Busca um log de sincronização por ID
   */
  static async getSyncLog(id: string, company_id: string): Promise<BlingSyncLog | null> {
    const { data: syncLog, error } = await supabase
      .from('bling_sync_logs')
      .select('*')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      throw new Error(`Erro ao buscar log de sincronização: ${error.message}`);
    }

    return syncLog;
  }

  /**
   * Lista logs de sincronização com paginação e filtros
   */
  static async listSyncLogs(params: {
    company_id: string;
    sync_type?: BlingSyncLog['sync_type'];
    status?: BlingSyncLog['status'];
    started_by?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: BlingSyncLog[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bling_sync_logs')
      .select('*', { count: 'exact' })
      .eq('company_id', params.company_id)
      .order('started_at', { ascending: false });

    // Aplicar filtros
    if (params.sync_type) {
      query = query.eq('sync_type', params.sync_type);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.started_by) {
      query = query.eq('started_by', params.started_by);
    }

    if (params.start_date) {
      query = query.gte('started_at', params.start_date);
    }

    if (params.end_date) {
      query = query.lte('started_at', params.end_date);
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao listar logs de sincronização: ${error.message}`);
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    return {
      data: data || [],
      total,
      page,
      limit,
      total_pages,
    };
  }

  /**
   * Busca logs de sincronização em andamento para uma empresa
   */
  static async getActiveSyncLogs(company_id: string): Promise<BlingSyncLog[]> {
    const { data, error } = await supabase
      .from('bling_sync_logs')
      .select('*')
      .eq('company_id', company_id)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar logs ativos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cancela uma sincronização em andamento
   */
  static async cancelSyncLog(id: string, company_id: string): Promise<BlingSyncLog> {
    return this.updateSyncLog(id, {
      status: 'cancelled',
      error_message: 'Sincronização cancelada pelo usuário',
    });
  }

  /**
   * Obtém estatísticas de sincronização para uma empresa
   */
  static async getSyncStats(company_id: string, days_back: number = 30): Promise<BlingSyncStats> {
    const { data, error } = await supabase
      .rpc('get_bling_sync_stats', {
        company_uuid: company_id,
        days_back,
      });

    if (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }

    return data?.[0] || {
      total_syncs: 0,
      successful_syncs: 0,
      failed_syncs: 0,
      in_progress_syncs: 0,
      avg_duration_minutes: 0,
      last_sync_at: '',
      sync_types: {},
    };
  }

  /**
   * Remove logs antigos (mais de 90 dias)
   */
  static async cleanupOldLogs(): Promise<number> {
    const { data, error } = await supabase
      .rpc('cleanup_old_bling_sync_logs');

    if (error) {
      throw new Error(`Erro ao limpar logs antigos: ${error.message}`);
    }

    return data || 0;
  }

  /**
   * Obtém o último log de sincronização bem-sucedido por tipo
   */
  static async getLastSuccessfulSync(
    company_id: string,
    sync_type: BlingSyncLog['sync_type']
  ): Promise<BlingSyncLog | null> {
    const { data, error } = await supabase
      .from('bling_sync_logs')
      .select('*')
      .eq('company_id', company_id)
      .eq('sync_type', sync_type)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      throw new Error(`Erro ao buscar última sincronização: ${error.message}`);
    }

    return data;
  }

  /**
   * Verifica se há sincronização em andamento para um tipo específico
   */
  static async hasActiveSyncForType(
    company_id: string,
    sync_type: BlingSyncLog['sync_type']
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('bling_sync_logs')
      .select('id')
      .eq('company_id', company_id)
      .eq('sync_type', sync_type)
      .eq('status', 'in_progress')
      .limit(1);

    if (error) {
      throw new Error(`Erro ao verificar sincronização ativa: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Atualiza o progresso de uma sincronização
   */
  static async updateSyncProgress(
    id: string,
    progress: {
      total_processed: number;
      total_success: number;
      total_errors: number;
      result?: BlingSyncResult;
      metadata?: Record<string, any>;
    }
  ): Promise<BlingSyncLog> {
    return this.updateSyncLog(id, progress);
  }
}