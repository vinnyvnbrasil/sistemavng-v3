'use client'

// Página de Documentos - Gerenciamento de NF-e, Etiquetas e Arquivos
// Sistema completo para upload, visualização e organização de documentos

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  Tag,
  Folder,
  File,
  Image,
  Archive,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus,
  Share,
  Star,
  FolderOpen,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Package,
  Receipt,
  Truck,
  Building
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface DocumentFile {
  id: string
  name: string
  type: 'nfe' | 'label' | 'contract' | 'invoice' | 'receipt' | 'other'
  category: string
  size: number
  uploadDate: Date
  status: 'processing' | 'ready' | 'error'
  tags: string[]
  description?: string
  url?: string
  thumbnail?: string
  metadata?: {
    nfeNumber?: string
    issueDate?: Date
    value?: number
    supplier?: string
    customer?: string
  }
}

interface DocumentFolder {
  id: string
  name: string
  description?: string
  parentId?: string
  createdAt: Date
  documentsCount: number
  color?: string
}

interface DocumentFilters {
  search: string
  type: string
  category: string
  status: string
  dateRange: {
    from?: Date
    to?: Date
  }
  tags: string[]
}

export default function DocumentsPage() {
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all',
    dateRange: {},
    tags: []
  })
  
  // Estados para modais
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showDocumentDetails, setShowDocumentDetails] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null)
  const [newFolder, setNewFolder] = useState({ name: '', description: '', color: '#3b82f6' })

  useEffect(() => {
    loadDocuments()
    loadFolders()
  }, [currentFolder])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      
      // Simular carregamento de documentos
      const mockDocuments: DocumentFile[] = [
        {
          id: '1',
          name: 'NF-e 001234567.xml',
          type: 'nfe',
          category: 'Fiscal',
          size: 15420,
          uploadDate: new Date(),
          status: 'ready',
          tags: ['nfe', 'fiscal', 'entrada'],
          description: 'Nota fiscal de entrada - Fornecedor ABC',
          metadata: {
            nfeNumber: '001234567',
            issueDate: new Date(),
            value: 1250.50,
            supplier: 'Fornecedor ABC Ltda',
            customer: 'Minha Empresa'
          }
        },
        {
          id: '2',
          name: 'Etiqueta_Correios_BR123456789.pdf',
          type: 'label',
          category: 'Logística',
          size: 8950,
          uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'ready',
          tags: ['etiqueta', 'correios', 'envio'],
          description: 'Etiqueta de envio Correios'
        },
        {
          id: '3',
          name: 'Contrato_Fornecedor_XYZ.pdf',
          type: 'contract',
          category: 'Jurídico',
          size: 245600,
          uploadDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'ready',
          tags: ['contrato', 'fornecedor', 'juridico'],
          description: 'Contrato de fornecimento com empresa XYZ'
        },
        {
          id: '4',
          name: 'Recibo_Pagamento_Janeiro.pdf',
          type: 'receipt',
          category: 'Financeiro',
          size: 12340,
          uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: 'processing',
          tags: ['recibo', 'pagamento', 'janeiro'],
          description: 'Recibo de pagamento referente a janeiro'
        }
      ]
      
      setDocuments(mockDocuments)
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
      toast.error('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      // Simular carregamento de pastas
      const mockFolders: DocumentFolder[] = [
        {
          id: '1',
          name: 'Notas Fiscais',
          description: 'Documentos fiscais (NF-e, NFS-e)',
          createdAt: new Date(),
          documentsCount: 45,
          color: '#10b981'
        },
        {
          id: '2',
          name: 'Etiquetas de Envio',
          description: 'Etiquetas dos Correios e transportadoras',
          createdAt: new Date(),
          documentsCount: 128,
          color: '#f59e0b'
        },
        {
          id: '3',
          name: 'Contratos',
          description: 'Contratos e documentos jurídicos',
          createdAt: new Date(),
          documentsCount: 12,
          color: '#8b5cf6'
        },
        {
          id: '4',
          name: 'Comprovantes',
          description: 'Recibos e comprovantes de pagamento',
          createdAt: new Date(),
          documentsCount: 67,
          color: '#ef4444'
        }
      ]
      
      setFolders(mockFolders)
    } catch (error) {
      console.error('Erro ao carregar pastas:', error)
    }
  }

  const handleFileUpload = useCallback(async (files: FileList) => {
    try {
      setUploading(true)
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Simular upload
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const newDocument: DocumentFile = {
          id: Date.now().toString() + i,
          name: file.name,
          type: getDocumentType(file.name),
          category: getCategoryFromType(getDocumentType(file.name)),
          size: file.size,
          uploadDate: new Date(),
          status: 'processing',
          tags: [],
          description: ''
        }
        
        setDocuments(prev => [newDocument, ...prev])
        
        // Simular processamento
        setTimeout(() => {
          setDocuments(prev => 
            prev.map(doc => 
              doc.id === newDocument.id 
                ? { ...doc, status: 'ready' as const }
                : doc
            )
          )
        }, 2000)
      }
      
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`)
      setShowUploadDialog(false)
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar arquivos')
    } finally {
      setUploading(false)
    }
  }, [])

  const getDocumentType = (filename: string): DocumentFile['type'] => {
    const lower = filename.toLowerCase()
    if (lower.includes('nf-e') || lower.includes('nfe') || lower.endsWith('.xml')) return 'nfe'
    if (lower.includes('etiqueta') || lower.includes('label')) return 'label'
    if (lower.includes('contrato') || lower.includes('contract')) return 'contract'
    if (lower.includes('fatura') || lower.includes('invoice')) return 'invoice'
    if (lower.includes('recibo') || lower.includes('receipt')) return 'receipt'
    return 'other'
  }

  const getCategoryFromType = (type: DocumentFile['type']): string => {
    switch (type) {
      case 'nfe': return 'Fiscal'
      case 'label': return 'Logística'
      case 'contract': return 'Jurídico'
      case 'invoice': return 'Financeiro'
      case 'receipt': return 'Financeiro'
      default: return 'Geral'
    }
  }

  const getDocumentIcon = (type: DocumentFile['type'], name: string) => {
    const extension = name.split('.').pop()?.toLowerCase()
    
    switch (type) {
      case 'nfe':
        return <Receipt className="h-5 w-5 text-green-600" />
      case 'label':
        return <Package className="h-5 w-5 text-orange-600" />
      case 'contract':
        return <FileText className="h-5 w-5 text-purple-600" />
      case 'invoice':
        return <Building className="h-5 w-5 text-blue-600" />
      case 'receipt':
        return <Receipt className="h-5 w-5 text-red-600" />
      default:
        switch (extension) {
          case 'pdf':
            return <FileText className="h-5 w-5 text-red-500" />
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif':
            return <FileImage className="h-5 w-5 text-green-500" />
          case 'xlsx':
          case 'xls':
          case 'csv':
            return <FileSpreadsheet className="h-5 w-5 text-green-600" />
          case 'xml':
          case 'json':
            return <FileCode className="h-5 w-5 text-blue-500" />
          default:
            return <File className="h-5 w-5 text-gray-500" />
        }
    }
  }

  const getStatusBadge = (status: DocumentFile['status']) => {
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Processando
          </Badge>
        )
      case 'ready':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pronto
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        )
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesType = filters.type === 'all' || doc.type === filters.type
    const matchesCategory = filters.category === 'all' || doc.category === filters.category
    const matchesStatus = filters.status === 'all' || doc.status === filters.status
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus
  })

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) {
      toast.error('Nome da pasta é obrigatório')
      return
    }

    try {
      const folder: DocumentFolder = {
        id: Date.now().toString(),
        name: newFolder.name,
        description: newFolder.description,
        createdAt: new Date(),
        documentsCount: 0,
        color: newFolder.color
      }

      setFolders(prev => [...prev, folder])
      setNewFolder({ name: '', description: '', color: '#3b82f6' })
      setShowFolderDialog(false)
      toast.success('Pasta criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar pasta:', error)
      toast.error('Erro ao criar pasta')
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      toast.success('Documento excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      toast.error('Erro ao excluir documento')
    }
  }

  const handleBulkAction = async (action: 'delete' | 'move' | 'download') => {
    if (selectedDocuments.length === 0) {
      toast.error('Selecione pelo menos um documento')
      return
    }

    try {
      switch (action) {
        case 'delete':
          setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)))
          toast.success(`${selectedDocuments.length} documento(s) excluído(s)`)
          break
        case 'download':
          toast.success(`Iniciando download de ${selectedDocuments.length} documento(s)`)
          break
        case 'move':
          toast.success(`${selectedDocuments.length} documento(s) movido(s)`)
          break
      }
      setSelectedDocuments([])
    } catch (error) {
      console.error('Erro na ação em lote:', error)
      toast.error('Erro ao executar ação')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">
            Gerencie NF-e, etiquetas e outros documentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFolderDialog(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Nova Pasta
          </Button>
          
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Enviar Arquivos
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              {documents.filter(d => d.status === 'ready').length} processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NF-e</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'nfe').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Notas fiscais eletrônicas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Etiquetas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === 'label').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Etiquetas de envio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pastas</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folders.length}</div>
            <p className="text-xs text-muted-foreground">
              Organizadas por categoria
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="folders">Pastas</TabsTrigger>
          <TabsTrigger value="nfe">NF-e</TabsTrigger>
          <TabsTrigger value="labels">Etiquetas</TabsTrigger>
        </TabsList>

        {/* Aba Documentos */}
        <TabsContent value="documents" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar documentos..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="nfe">NF-e</SelectItem>
                    <SelectItem value="label">Etiquetas</SelectItem>
                    <SelectItem value="contract">Contratos</SelectItem>
                    <SelectItem value="invoice">Faturas</SelectItem>
                    <SelectItem value="receipt">Recibos</SelectItem>
                    <SelectItem value="other">Outros</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ready">Pronto</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    Grade
                  </Button>
                </div>
              </div>

              {/* Ações em lote */}
              {selectedDocuments.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">
                      {selectedDocuments.length} documento(s) selecionado(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('download')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('move')}
                      >
                        <Folder className="h-4 w-4 mr-1" />
                        Mover
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBulkAction('delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista/Grade de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                {filteredDocuments.length} de {documents.length} documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'list' ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedDocuments.length === filteredDocuments.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocuments(filteredDocuments.map(d => d.id))
                              } else {
                                setSelectedDocuments([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedDocuments.includes(document.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDocuments(prev => [...prev, document.id])
                                } else {
                                  setSelectedDocuments(prev => prev.filter(id => id !== document.id))
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getDocumentIcon(document.type, document.name)}
                              <div>
                                <div className="font-medium">{document.name}</div>
                                {document.description && (
                                  <div className="text-sm text-gray-500">
                                    {document.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {document.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{document.category}</TableCell>
                          <TableCell>{getStatusBadge(document.status)}</TableCell>
                          <TableCell>{formatFileSize(document.size)}</TableCell>
                          <TableCell>
                            {document.uploadDate.toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDocument(document)
                                    setShowDocumentDetails(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share className="h-4 w-4 mr-2" />
                                  Compartilhar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteDocument(document.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocuments.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getDocumentIcon(document.type, document.name)}
                            <Checkbox
                              checked={selectedDocuments.includes(document.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDocuments(prev => [...prev, document.id])
                                } else {
                                  setSelectedDocuments(prev => prev.filter(id => id !== document.id))
                                }
                              }}
                            />
                          </div>
                          {getStatusBadge(document.status)}
                        </div>
                        
                        <h4 className="font-medium text-sm mb-2 line-clamp-2">
                          {document.name}
                        </h4>
                        
                        {document.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{formatFileSize(document.size)}</span>
                          <span>{document.uploadDate.toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedDocument(document)
                              setShowDocumentDetails(true)
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Share className="h-4 w-4 mr-2" />
                                Compartilhar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteDocument(document.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredDocuments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum documento encontrado com os filtros aplicados.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Pastas */}
        <TabsContent value="folders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: folder.color + '20' }}
                    >
                      <Folder 
                        className="h-5 w-5" 
                        style={{ color: folder.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{folder.name}</h4>
                      <p className="text-sm text-gray-500">
                        {folder.documentsCount} documentos
                      </p>
                    </div>
                  </div>
                  
                  {folder.description && (
                    <p className="text-xs text-gray-500 mb-3">
                      {folder.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Criada em {folder.createdAt.toLocaleDateString('pt-BR')}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Abrir
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba NF-e */}
        <TabsContent value="nfe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais Eletrônicas</CardTitle>
              <CardDescription>
                Visualização especializada para documentos fiscais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(d => d.type === 'nfe').map((document) => (
                  <div key={document.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-green-600" />
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          {document.metadata && (
                            <div className="text-sm text-gray-600">
                              NF-e: {document.metadata.nfeNumber} • 
                              Valor: R$ {document.metadata.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • 
                              Fornecedor: {document.metadata.supplier}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(document.status)}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Etiquetas */}
        <TabsContent value="labels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Etiquetas de Envio</CardTitle>
              <CardDescription>
                Gerenciamento de etiquetas dos Correios e transportadoras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.filter(d => d.type === 'label').map((document) => (
                  <Card key={document.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Package className="h-6 w-6 text-orange-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{document.name}</h4>
                          <p className="text-xs text-gray-500">
                            {document.uploadDate.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {getStatusBadge(document.status)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Truck className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Upload */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Documentos</DialogTitle>
            <DialogDescription>
              Selecione os arquivos que deseja enviar. Formatos suportados: PDF, XML, JPG, PNG, XLSX.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Máximo 10MB por arquivo
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.xml,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span>Selecionar Arquivos</span>
                </Button>
              </label>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enviando arquivos...</span>
                  <span className="text-sm text-gray-500">75%</span>
                </div>
                <Progress value={75} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Nova Pasta */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>
              Crie uma nova pasta para organizar seus documentos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Nome da Pasta</Label>
              <Input
                id="folder-name"
                value={newFolder.name}
                onChange={(e) => setNewFolder(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da pasta"
              />
            </div>
            
            <div>
              <Label htmlFor="folder-description">Descrição (opcional)</Label>
              <Textarea
                id="folder-description"
                value={newFolder.description}
                onChange={(e) => setNewFolder(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o conteúdo da pasta"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="folder-color">Cor</Label>
              <div className="flex items-center gap-2 mt-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      newFolder.color === color ? 'border-gray-900' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolder(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Documento */}
      <Dialog open={showDocumentDetails} onOpenChange={setShowDocumentDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Documento</DialogTitle>
            <DialogDescription>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Informações Gerais</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nome:</span>
                      <span>{selectedDocument.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo:</span>
                      <Badge variant="outline">{selectedDocument.type.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Categoria:</span>
                      <span>{selectedDocument.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tamanho:</span>
                      <span>{formatFileSize(selectedDocument.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      {getStatusBadge(selectedDocument.status)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Upload:</span>
                      <span>{selectedDocument.uploadDate.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                
                {selectedDocument.metadata && (
                  <div>
                    <h4 className="font-medium mb-3">Metadados</h4>
                    <div className="space-y-2 text-sm">
                      {selectedDocument.metadata.nfeNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Número NF-e:</span>
                          <span>{selectedDocument.metadata.nfeNumber}</span>
                        </div>
                      )}
                      {selectedDocument.metadata.value && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valor:</span>
                          <span>R$ {selectedDocument.metadata.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {selectedDocument.metadata.supplier && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fornecedor:</span>
                          <span>{selectedDocument.metadata.supplier}</span>
                        </div>
                      )}
                      {selectedDocument.metadata.customer && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cliente:</span>
                          <span>{selectedDocument.metadata.customer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedDocument.description && (
                <div>
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-sm text-gray-600">{selectedDocument.description}</p>
                </div>
              )}
              
              {selectedDocument.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDetails(false)}>
              Fechar
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}