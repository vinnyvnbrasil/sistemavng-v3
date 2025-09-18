import { supabase } from '@/lib/supabase'
import {
  FileUpload,
  FileFolder,
  FileShare,
  FileVersion,
  FileComment,
  FileActivity,
  StorageStats,
  FileFilter,
  UploadProgress,
  CreateFileData,
  UpdateFileData,
  CreateFolderData,
  UpdateFolderData,
  CreateShareData,
  UpdateShareData,
  FileStatus,
  UploadStatus,
  ShareType,
  FilePermission,
  FileAction,
  SortBy,
  SortOrder,
  validateFileType,
  validateFileSize,
  getFileCategory,
  formatFileSize
} from '@/types/file'
import { ActivityService } from './activities'

export class FileService {
  // File Management
  static async getFiles(filter?: FileFilter, sortBy: SortBy = 'uploaded_at', sortOrder: SortOrder = 'desc'): Promise<FileUpload[]> {
    try {
      let query = supabase
        .from('files')
        .select(`
          *,
          uploader:profiles(full_name, avatar_url),
          folder:folders(name, path)
        `)
        .eq('status', 'ready')
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (filter) {
        if (filter.search) {
          query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
        }
        if (filter.type) {
          query = query.eq('type', filter.type)
        }
        if (filter.mime_type) {
          query = query.eq('mime_type', filter.mime_type)
        }
        if (filter.extension) {
          query = query.eq('extension', filter.extension)
        }
        if (filter.folder_id) {
          query = query.eq('folder_id', filter.folder_id)
        }
        if (filter.uploaded_by) {
          query = query.eq('uploaded_by', filter.uploaded_by)
        }
        if (filter.entity_type) {
          query = query.eq('entity_type', filter.entity_type)
        }
        if (filter.entity_id) {
          query = query.eq('entity_id', filter.entity_id)
        }
        if (filter.date_from) {
          query = query.gte('uploaded_at', filter.date_from)
        }
        if (filter.date_to) {
          query = query.lte('uploaded_at', filter.date_to)
        }
        if (filter.size_min) {
          query = query.gte('size', filter.size_min)
        }
        if (filter.size_max) {
          query = query.lte('size', filter.size_max)
        }
        if (filter.is_public !== undefined) {
          query = query.eq('is_public', filter.is_public)
        }
        if (filter.tags && filter.tags.length > 0) {
          query = query.contains('tags', filter.tags)
        }
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      return data.map(file => ({
        ...file,
        uploader_name: file.uploader?.full_name || 'Usuário Desconhecido',
        uploader_avatar: file.uploader?.avatar_url,
        folder_name: file.folder?.name,
        folder_path: file.folder?.path
      }))
    } catch (error) {
      console.error('Erro ao buscar arquivos:', error)
      throw new Error('Falha ao carregar arquivos')
    }
  }

  static async getFileById(id: string): Promise<FileUpload> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select(`
          *,
          uploader:profiles(full_name, avatar_url),
          folder:folders(name, path),
          versions:file_versions(*),
          comments:file_comments(
            *,
            user:profiles(full_name, avatar_url)
          ),
          shares:file_shares(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Arquivo não encontrado')

      return {
        ...data,
        uploader_name: data.uploader?.full_name || 'Usuário Desconhecido',
        uploader_avatar: data.uploader?.avatar_url,
        folder_name: data.folder?.name,
        folder_path: data.folder?.path
      }
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error)
      throw new Error('Falha ao carregar arquivo')
    }
  }

  static async uploadFile(fileData: CreateFileData, onProgress?: (progress: UploadProgress) => void): Promise<FileUpload> {
    try {
      const { file, name, folder_id, entity_type, entity_id, description, tags, is_public } = fileData

      // Validate file
      if (!validateFileType(file.type)) {
        throw new Error('Tipo de arquivo não permitido')
      }

      if (!validateFileSize(file.size, file.type)) {
        throw new Error('Arquivo muito grande')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop()?.toLowerCase() || ''
      const fileName = `${timestamp}_${name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`
      const filePath = folder_id ? `folders/${folder_id}/${fileName}` : `files/${fileName}`

      // Create file record
      const { data: fileRecord, error: createError } = await supabase
        .from('files')
        .insert({
          name,
          original_name: file.name,
          size: file.size,
          type: getFileCategory(extension),
          mime_type: file.type,
          extension,
          path: filePath,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          folder_id,
          entity_type,
          entity_id,
          is_public: is_public || false,
          description,
          tags: tags || [],
          status: 'uploading' as FileStatus,
          version: 1,
          download_count: 0
        })
        .select()
        .single()

      if (createError) throw createError

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file)

      if (uploadError) {
        // Clean up file record on upload failure
        await supabase.from('files').delete().eq('id', fileRecord.id)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      // Generate checksum (simplified)
      const checksum = await this.generateChecksum(file)

      // Update file record with URL and status
      const { data: updatedFile, error: updateError } = await supabase
        .from('files')
        .update({
          url: urlData.publicUrl,
          checksum,
          status: 'ready' as FileStatus
        })
        .eq('id', fileRecord.id)
        .select(`
          *,
          uploader:profiles(full_name, avatar_url)
        `)
        .single()

      if (updateError) throw updateError

      // Log activity
      await ActivityService.logActivity(
        'file_uploaded',
        `Arquivo "${name}" foi enviado`,
        updatedFile.uploaded_by,
        'file',
        updatedFile.id,
        {
          description: `Arquivo de ${formatFileSize(file.size)} enviado`,
          entityName: name,
          metadata: {
            file_type: file.type,
            file_size: file.size
          }
        }
      )

      if (onProgress) {
        onProgress({
          file_id: fileRecord.id,
          file_name: name,
          progress: 100,
          status: 'completed' as UploadStatus,
          uploaded_size: file.size,
          total_size: file.size
        })
      }

      return {
        ...updatedFile,
        uploader_name: updatedFile.uploader?.full_name || 'Usuário Desconhecido',
        uploader_avatar: updatedFile.uploader?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      if (onProgress) {
        onProgress({
          file_id: '',
          file_name: fileData.name,
          progress: 0,
          status: 'error' as UploadStatus,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          uploaded_size: 0,
          total_size: fileData.file.size
        })
      }
      throw new Error('Falha no upload do arquivo')
    }
  }

  static async updateFile(id: string, updateData: UpdateFileData): Promise<FileUpload> {
    try {
      const { data, error } = await supabase
        .from('files')
        .update({
          name: updateData.name,
          description: updateData.description,
          tags: updateData.tags,
          is_public: updateData.is_public,
          folder_id: updateData.folder_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          uploader:profiles(full_name, avatar_url),
          folder:folders(name, path)
        `)
        .single()

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'file_updated',
        `Arquivo "${data.name}" foi atualizado`,
        (await supabase.auth.getUser()).data.user?.id || '',
        'file',
        id,
        {
          entityName: data.name
        }
      )

      return {
        ...data,
        uploader_name: data.uploader?.full_name || 'Usuário Desconhecido',
        uploader_avatar: data.uploader?.avatar_url,
        folder_name: data.folder?.name,
        folder_path: data.folder?.path
      }
    } catch (error) {
      console.error('Erro ao atualizar arquivo:', error)
      throw new Error('Falha ao atualizar arquivo')
    }
  }

  static async deleteFile(id: string): Promise<void> {
    try {
      // Get file info first
      const file = await this.getFileById(id)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([file.path])

      if (storageError) {
        console.warn('Erro ao deletar do storage:', storageError)
      }

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'file_deleted',
        `Arquivo "${file.name}" foi excluído`,
        (await supabase.auth.getUser()).data.user?.id || '',
        'file',
        id,
        {
          entityName: file.name
        }
      )
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error)
      throw new Error('Falha ao excluir arquivo')
    }
  }

  static async downloadFile(id: string): Promise<string> {
    try {
      const file = await this.getFileById(id)

      // Increment download count
      await supabase
        .from('files')
        .update({ download_count: file.download_count + 1 })
        .eq('id', id)

      // Log activity
      await ActivityService.logActivity(
        'file_downloaded',
        `Arquivo "${file.name}" foi baixado`,
        (await supabase.auth.getUser()).data.user?.id || '',
        'file',
        id,
        {
          entityName: file.name
        }
      )

      return file.url
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      throw new Error('Falha ao baixar arquivo')
    }
  }

  // Folder Management
  static async getFolders(parentId?: string): Promise<FileFolder[]> {
    try {
      let query = supabase
        .from('folders')
        .select(`
          *,
          creator:profiles(full_name, avatar_url),
          files:files(count),
          subfolders:folders(count)
        `)
        .order('name')

      if (parentId) {
        query = query.eq('parent_id', parentId)
      } else {
        query = query.is('parent_id', null)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(folder => ({
        ...folder,
        creator_name: folder.creator?.full_name || 'Usuário Desconhecido',
        creator_avatar: folder.creator?.avatar_url,
        file_count: folder.files?.length || 0,
        folder_count: folder.subfolders?.length || 0
      }))
    } catch (error) {
      console.error('Erro ao buscar pastas:', error)
      throw new Error('Falha ao carregar pastas')
    }
  }

  static async createFolder(folderData: CreateFolderData): Promise<FileFolder> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      // Generate path
      let path = folderData.name
      if (folderData.parent_id) {
        const parent = await this.getFolderById(folderData.parent_id)
        path = `${parent.path}/${folderData.name}`
      }

      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: folderData.name,
          path,
          parent_id: folderData.parent_id,
          created_by: userId,
          description: folderData.description,
          color: folderData.color,
          icon: folderData.icon,
          is_public: folderData.is_public || false,
          file_count: 0,
          folder_count: 0,
          total_size: 0
        })
        .select(`
          *,
          creator:profiles(full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'folder_created',
        `Pasta "${folderData.name}" foi criada`,
        userId,
        'file',
        data.id,
        {
          entityName: folderData.name
        }
      )

      return {
        ...data,
        creator_name: data.creator?.full_name || 'Usuário Desconhecido',
        creator_avatar: data.creator?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error)
      throw new Error('Falha ao criar pasta')
    }
  }

  static async getFolderById(id: string): Promise<FileFolder> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          creator:profiles(full_name, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Pasta não encontrada')

      return {
        ...data,
        creator_name: data.creator?.full_name || 'Usuário Desconhecido',
        creator_avatar: data.creator?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao buscar pasta:', error)
      throw new Error('Falha ao carregar pasta')
    }
  }

  // Storage Statistics
  static async getStorageStats(): Promise<StorageStats> {
    try {
      // Total files and size
      const { data: files } = await supabase
        .from('files')
        .select('size, type, uploaded_at')
        .eq('status', 'ready')

      const totalFiles = files?.length || 0
      const totalSize = files?.reduce((sum, file) => sum + file.size, 0) || 0

      // Files by type
      const typeMap = new Map()
      files?.forEach(file => {
        const current = typeMap.get(file.type) || { count: 0, size: 0 }
        current.count++
        current.size += file.size
        typeMap.set(file.type, current)
      })

      const filesByType = Array.from(typeMap.entries()).map(([type, stats]) => ({
        type,
        count: stats.count,
        total_size: stats.size,
        percentage: totalFiles > 0 ? (stats.count / totalFiles) * 100 : 0
      }))

      // Recent uploads (last 10)
      const recentUploads = await this.getFiles(
        { date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        'uploaded_at',
        'desc'
      )

      // Popular files (most downloaded)
      const popularFiles = await this.getFiles(undefined, 'download_count', 'desc')

      // Storage usage by month (last 12 months)
      const storageUsageByMonth = []
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

        const monthFiles = files?.filter(file => {
          const uploadDate = new Date(file.uploaded_at)
          return uploadDate >= monthStart && uploadDate <= monthEnd
        }) || []

        storageUsageByMonth.push({
          month: monthStart.toISOString().slice(0, 7),
          uploads: monthFiles.length,
          size: monthFiles.reduce((sum, file) => sum + file.size, 0)
        })
      }

      return {
        total_files: totalFiles,
        total_size: totalSize,
        used_storage: totalSize,
        available_storage: Math.max(0, 10 * 1024 * 1024 * 1024 - totalSize), // 10GB limit
        storage_limit: 10 * 1024 * 1024 * 1024, // 10GB
        files_by_type: filesByType,
        recent_uploads: recentUploads.slice(0, 10),
        popular_files: popularFiles.slice(0, 10),
        storage_usage_by_month: storageUsageByMonth
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de armazenamento:', error)
      throw new Error('Falha ao carregar estatísticas')
    }
  }

  // Helper methods
  private static async generateChecksum(file: File): Promise<string> {
    // Simplified checksum generation
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  static async moveFile(fileId: string, folderId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('files')
        .update({ folder_id: folderId })
        .eq('id', fileId)

      if (error) throw error

      // Log activity
      const file = await this.getFileById(fileId)
      await ActivityService.logActivity(
        'file_moved',
        `Arquivo "${file.name}" foi movido`,
        (await supabase.auth.getUser()).data.user?.id || '',
        'file',
        fileId,
        {
          entityName: file.name
        }
      )
    } catch (error) {
      console.error('Erro ao mover arquivo:', error)
      throw new Error('Falha ao mover arquivo')
    }
  }

  static async copyFile(fileId: string, folderId?: string): Promise<FileUpload> {
    try {
      const originalFile = await this.getFileById(fileId)
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      // Create copy in database
      const { data, error } = await supabase
        .from('files')
        .insert({
          name: `${originalFile.name} (cópia)`,
          original_name: originalFile.original_name,
          size: originalFile.size,
          type: originalFile.type,
          mime_type: originalFile.mime_type,
          extension: originalFile.extension,
          path: originalFile.path, // Same storage path for now
          url: originalFile.url,
          uploaded_by: userId,
          folder_id: folderId,
          is_public: originalFile.is_public,
          description: originalFile.description,
          tags: originalFile.tags,
          status: 'ready' as FileStatus,
          version: 1,
          download_count: 0,
          checksum: originalFile.checksum
        })
        .select(`
          *,
          uploader:profiles(full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'file_copied',
        `Arquivo "${originalFile.name}" foi copiado`,
        userId,
        'file',
        data.id,
        {
          entityName: data.name
        }
      )

      return {
        ...data,
        uploader_name: data.uploader?.full_name || 'Usuário Desconhecido',
        uploader_avatar: data.uploader?.avatar_url
      }
    } catch (error) {
      console.error('Erro ao copiar arquivo:', error)
      throw new Error('Falha ao copiar arquivo')
    }
  }
}