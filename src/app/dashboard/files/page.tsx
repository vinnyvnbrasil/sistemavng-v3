'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileService } from '@/lib/services/files'
import {
  FileUpload,
  FileFolder,
  StorageStats,
  FileFilter,
  FileViewMode,
  SortBy,
  SortOrder,
  UploadProgress,
  CreateFileData,
  CreateFolderData,
  FILE_TYPE_ICONS,
  formatFileSize,
  getFileCategory
} from '@/types/file'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Upload,
  FolderPlus,
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Share2,
  Trash2,
  Edit,
  Copy,
  Move,
  Eye,
  MoreHorizontal,
  File,
  Folder,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Code,
  Calendar,
  User,
  HardDrive,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FileManagerState {
  files: FileUpload[]
  folders: FileFolder[]
  storageStats: StorageStats | null
  currentFolder: string | null
  viewMode: FileViewMode
  sortBy: SortBy
  sortOrder: SortOrder
  filter: FileFilter
  selectedFiles: string[]
  uploadProgress: UploadProgress[]
  loading: boolean
  searchQuery: string
}

export default function FilesPage() {
  const [state, setState] = useState<FileManagerState>({
    files: [],
    folders: [],
    storageStats: null,
    currentFolder: null,
    viewMode: 'grid',
    sortBy: 'uploaded_at',
    sortOrder: 'desc',
    filter: {},
    selectedFiles: [],
    uploadProgress: [],
    loading: true,
    searchQuery: ''
  })

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [folderData, setFolderData] = useState<CreateFolderData>({
    name: '',
    description: '',
    is_public: false
  })

  const loadData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const [files, folders, stats] = await Promise.all([
        FileService.getFiles(
          { ...state.filter, folder_id: state.currentFolder || undefined },
          state.sortBy,
          state.sortOrder
        ),
        FileService.getFolders(state.currentFolder || undefined),
        FileService.getStorageStats()
      ])

      setState(prev => ({
        ...prev,
        files,
        folders,
        storageStats: stats,
        loading: false
      }))
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error(`Erro ao carregar arquivos: ${error instanceof Error ? error.message : String(error)}`)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [state.filter, state.currentFolder, state.sortBy, state.sortOrder])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      filter: { ...prev.filter, search: query || undefined }
    }))
  }, [])

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return

    try {
      const uploadPromises = uploadFiles.map(file => {
        const fileData: CreateFileData = {
          file,
          name: file.name.split('.').slice(0, -1).join('.') || file.name,
          folder_id: state.currentFolder || undefined,
          is_public: false
        }

        return FileService.uploadFile(fileData, (progress) => {
          setState(prev => ({
            ...prev,
            uploadProgress: prev.uploadProgress.map(p => 
              p.file_name === progress.file_name ? progress : p
            ).concat(
              prev.uploadProgress.find(p => p.file_name === progress.file_name) ? [] : [progress]
            )
          }))
        })
      })

      await Promise.all(uploadPromises)
      
      toast.success(`${uploadFiles.length} arquivo(s) enviado(s) com sucesso`)
      setShowUploadDialog(false)
      setUploadFiles([])
      setState(prev => ({ ...prev, uploadProgress: [] }))
      loadData()
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error(`Erro no upload: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleCreateFolder = async () => {
    try {
      await FileService.createFolder({
        ...folderData,
        parent_id: state.currentFolder || undefined
      })
      
      toast.success('Pasta criada com sucesso')
      setShowFolderDialog(false)
      setFolderData({ name: '', description: '', is_public: false })
      loadData()
    } catch (error) {
      console.error('Erro ao criar pasta:', error)
      toast.error(`Erro ao criar pasta: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await FileService.deleteFile(fileId)
      toast.success('Arquivo excluído com sucesso')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error)
      toast.error(`Erro ao excluir arquivo: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDownload = async (fileId: string) => {
    try {
      const url = await FileService.downloadFile(fileId)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error)
      toast.error('Erro ao baixar arquivo')
    }
  }

  const getFileIcon = (file: FileUpload) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    
    // Map file extensions to Lucide React icons
    const iconMap: Record<string, any> = {
      // Images
      jpg: Image, jpeg: Image, png: Image, gif: Image, bmp: Image, svg: Image, webp: Image, ico: Image,
      // Documents
      pdf: FileText, doc: FileText, docx: FileText, txt: FileText, rtf: FileText, odt: FileText,
      // Videos
      mp4: Video, avi: Video, mov: Video, wmv: Video, flv: Video, webm: Video, mkv: Video,
      // Audio
      mp3: Music, wav: Music, flac: Music, aac: Music, ogg: Music, wma: Music,
      // Archives
      zip: Archive, rar: Archive, '7z': Archive, tar: Archive, gz: Archive, bz2: Archive,
      // Code
      js: Code, ts: Code, jsx: Code, tsx: Code, html: Code, css: Code, scss: Code,
      json: Code, xml: Code, py: Code, java: Code, cpp: Code, c: Code, php: Code,
      rb: Code, go: Code, rs: Code
    }
    
    const IconComponent = iconMap[extension] || File
    return <IconComponent className="h-4 w-4" />
  }

  const renderFileGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {state.folders.map(folder => (
        <Card 
          key={folder.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setState(prev => ({ ...prev, currentFolder: folder.id }))}
        >
          <CardContent className="p-4 text-center">
            <Folder className="h-12 w-12 mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-medium truncate">{folder.name}</p>
            <p className="text-xs text-muted-foreground">
              {folder.file_count} arquivos
            </p>
          </CardContent>
        </Card>
      ))}
      
      {state.files.map(file => (
        <Card key={file.id} className="group relative">
          <CardContent className="p-4 text-center">
            <div className="relative">
              {file.type === 'image' && file.url ? (
                <img 
                  src={file.url} 
                  alt={file.name}
                  className="h-12 w-12 mx-auto mb-2 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 mx-auto mb-2 flex items-center justify-center bg-muted rounded">
                  {getFileIcon(file)}
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
            <Badge variant="secondary" className="text-xs mt-1">
              {file.type}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderFileList = () => (
    <div className="space-y-2">
      {state.folders.map(folder => (
        <Card 
          key={folder.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setState(prev => ({ ...prev, currentFolder: folder.id }))}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Folder className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {folder.file_count} arquivos • {folder.folder_count} pastas
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(folder.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {state.files.map(file => (
        <Card key={file.id} className="group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      {file.type}
                    </Badge>
                    <span>•</span>
                    <span>{file.uploaded_by}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-sm text-muted-foreground">
                  {format(new Date(file.uploaded_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  if (state.loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando arquivos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Arquivos</h1>
          <p className="text-muted-foreground">
            Gerencie seus arquivos e documentos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Pasta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Pasta</DialogTitle>
                <DialogDescription>
                  Crie uma nova pasta para organizar seus arquivos
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Nome da Pasta</Label>
                  <Input
                    id="folder-name"
                    value={folderData.name}
                    onChange={(e) => setFolderData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome da pasta"
                  />
                </div>
                
                <div>
                  <Label htmlFor="folder-description">Descrição (opcional)</Label>
                  <Textarea
                    id="folder-description"
                    value={folderData.description}
                    onChange={(e) => setFolderData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o conteúdo da pasta"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="folder-public"
                    checked={folderData.is_public}
                    onCheckedChange={(checked) => setFolderData(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label htmlFor="folder-public">Pasta pública</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateFolder} disabled={!folderData.name}>
                  Criar Pasta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload de Arquivos</DialogTitle>
                <DialogDescription>
                  Selecione os arquivos que deseja enviar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                    className="cursor-pointer"
                  />
                </div>
                
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Arquivos Selecionados:</h4>
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-2">
                          {getFileIcon({ type: getFileCategory(file.name.split('.').pop() || '') } as FileUpload)}
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {state.uploadProgress.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Progresso do Upload:</h4>
                    {state.uploadProgress.map((progress, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{progress.file_name}</span>
                          <span>{Math.round(progress.progress)}%</span>
                        </div>
                        <Progress value={progress.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpload} disabled={uploadFiles.length === 0}>
                  Enviar Arquivos
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Storage Stats */}
      {state.storageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Armazenamento</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(state.storageStats.used_storage)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    de {formatFileSize(state.storageStats.storage_limit)}
                  </p>
                </div>
              </div>
              <Progress 
                value={(state.storageStats.used_storage / state.storageStats.storage_limit) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <File className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total de Arquivos</p>
                  <p className="text-2xl font-bold">{state.storageStats.total_files}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Uploads Recentes</p>
                  <p className="text-2xl font-bold">{state.storageStats.recent_uploads.length}</p>
                  <p className="text-xs text-muted-foreground">últimos 7 dias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Mais Baixados</p>
                  <p className="text-2xl font-bold">{state.storageStats.popular_files.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={state.sortBy}
            onValueChange={(value: SortBy) => setState(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="uploaded_at">Data de Upload</SelectItem>
              <SelectItem value="size">Tamanho</SelectItem>
              <SelectItem value="download_count">Downloads</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState(prev => ({ 
              ...prev, 
              sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
            }))}
          >
            {state.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant={state.viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          
          <Button
            variant={state.viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {state.currentFolder && (
        <div className="flex items-center space-x-2 text-sm">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setState(prev => ({ ...prev, currentFolder: null }))}
          >
            Início
          </Button>
          <span>/</span>
          <span className="font-medium">Pasta Atual</span>
        </div>
      )}

      {/* Files and Folders */}
      <div className="min-h-96">
        {state.files.length === 0 && state.folders.length === 0 ? (
          <div className="text-center py-12">
            <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum arquivo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {state.searchQuery ? 'Tente ajustar sua busca' : 'Comece enviando alguns arquivos'}
            </p>
            {!state.searchQuery && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Primeiro Arquivo
              </Button>
            )}
          </div>
        ) : (
          <div>
            {state.viewMode === 'grid' ? renderFileGrid() : renderFileList()}
          </div>
        )}
      </div>
    </div>
  )
}