'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Palette,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Sun,
  Moon,
  Monitor,
  Contrast,
  Type,
  Layout,
  Paintbrush,
  Save,
  Undo,
  Redo,
  RotateCcw,
  Star,
  Heart,
  Share,
  Copy,
  Check,
  X,
  Search,
  Filter,
  Grid,
  List,
  Sparkles,
  Zap,
  Layers,
  Droplets,
  Square,
  Circle,
  Triangle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Theme,
  ThemeConfig,
  ThemeType,
  ThemeCategory,
  ThemeListParams,
  ThemeCreateRequest,
  ThemeResponse,
  ThemeBuilder,
  ThemeBuilderAction,
  ThemeMarketplace,
  ColorScale,
  THEME_CONSTANTS
} from '@/types/theme'
import { ThemeService } from '@/lib/services/theme'

interface ThemePageState {
  themes: ThemeResponse[]
  currentTheme: Theme | null
  themeConfig: ThemeConfig | null
  themeBuilder: ThemeBuilder | null
  marketplace: ThemeMarketplace | null
  loading: boolean
  searchQuery: string
  selectedCategory: ThemeCategory | 'all'
  selectedType: ThemeType | 'all'
  viewMode: 'grid' | 'list'
  showPreview: boolean
  activeTab: string
}

export default function ThemesPage() {
  const [state, setState] = useState<ThemePageState>({
    themes: [],
    currentTheme: null,
    themeConfig: null,
    themeBuilder: null,
    marketplace: null,
    loading: true,
    searchQuery: '',
    selectedCategory: 'all',
    selectedType: 'all',
    viewMode: 'grid',
    showPreview: false,
    activeTab: 'my-themes'
  })

  const [themeService] = useState(() => new ThemeService())
  const [selectedTheme, setSelectedTheme] = useState<ThemeResponse | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBuilderDialog, setShowBuilderDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newTheme, setNewTheme] = useState<Partial<ThemeCreateRequest>>({
    name: '',
    description: '',
    type: ThemeType.LIGHT,
    category: ThemeCategory.PERSONAL
  })
  const [importFile, setImportFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const [themesResponse, config, marketplace] = await Promise.all([
        themeService.getThemes({
          search: state.searchQuery,
          category: state.selectedCategory !== 'all' ? state.selectedCategory : undefined,
          type: state.selectedType !== 'all' ? state.selectedType : undefined
        }),
        themeService.getThemeConfig('current-user'), // Replace with actual user ID
        themeService.getMarketplace()
      ])

      const currentTheme = themeService.getCurrentTheme()

      setState(prev => ({
        ...prev,
        themes: themesResponse.themes,
        currentTheme,
        themeConfig: config,
        marketplace,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading themes:', error)
      toast.error('Erro ao carregar temas')
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleActivateTheme = async (themeId: string) => {
    try {
      await themeService.activateTheme(themeId, 'current-user')
      await loadData()
      toast.success('Tema ativado com sucesso')
    } catch (error) {
      console.error('Error activating theme:', error)
      toast.error('Erro ao ativar tema')
    }
  }

  const handleCreateTheme = async () => {
    try {
      if (!newTheme.name || !newTheme.colors) {
        toast.error('Nome e cores são obrigatórios')
        return
      }

      await themeService.createTheme(newTheme as ThemeCreateRequest, 'current-user')
      await loadData()
      setShowCreateDialog(false)
      setNewTheme({
        name: '',
        description: '',
        type: ThemeType.LIGHT,
        category: ThemeCategory.PERSONAL
      })
      toast.success('Tema criado com sucesso')
    } catch (error) {
      console.error('Error creating theme:', error)
      toast.error('Erro ao criar tema')
    }
  }

  const handleDeleteTheme = async (themeId: string) => {
    try {
      await themeService.deleteTheme(themeId, 'current-user')
      await loadData()
      toast.success('Tema excluído com sucesso')
    } catch (error) {
      console.error('Error deleting theme:', error)
      toast.error('Erro ao excluir tema')
    }
  }

  const handleExportTheme = async (themeId: string) => {
    try {
      const exportData = await themeService.exportTheme(themeId)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `theme-${exportData.theme.name.toLowerCase().replace(/\s+/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Tema exportado com sucesso')
    } catch (error) {
      console.error('Error exporting theme:', error)
      toast.error('Erro ao exportar tema')
    }
  }

  const handleImportTheme = async () => {
    try {
      if (!importFile) {
        toast.error('Selecione um arquivo para importar')
        return
      }

      await themeService.importTheme(importFile, 'current-user')
      await loadData()
      setShowImportDialog(false)
      setImportFile(null)
      toast.success('Tema importado com sucesso')
    } catch (error) {
      console.error('Error importing theme:', error)
      toast.error('Erro ao importar tema')
    }
  }

  const handleUpdateThemeConfig = async (config: Partial<ThemeConfig>) => {
    try {
      await themeService.updateThemeConfig('current-user', config)
      await loadData()
      toast.success('Configurações atualizadas')
    } catch (error) {
      console.error('Error updating theme config:', error)
      toast.error('Erro ao atualizar configurações')
    }
  }

  const initializeThemeBuilder = () => {
    const builder = themeService.initializeThemeBuilder(ThemeType.LIGHT)
    setState(prev => ({ ...prev, themeBuilder: builder }))
    setShowBuilderDialog(true)
  }

  const updateThemeBuilder = (action: ThemeBuilderAction, data: any) => {
    if (!state.themeBuilder) return
    
    const updatedBuilder = themeService.updateThemeBuilder(action, data)
    setState(prev => ({ ...prev, themeBuilder: updatedBuilder }))
  }

  const previewTheme = async (theme: Partial<Theme>) => {
    try {
      await themeService.previewTheme(theme)
      setState(prev => ({ ...prev, showPreview: true }))
    } catch (error) {
      console.error('Error previewing theme:', error)
      toast.error('Erro ao visualizar tema')
    }
  }

  const stopPreview = async () => {
    try {
      await themeService.stopPreview()
      setState(prev => ({ ...prev, showPreview: false }))
    } catch (error) {
      console.error('Error stopping preview:', error)
    }
  }

  const filteredThemes = state.themes.filter(theme => {
    const matchesSearch = !state.searchQuery || 
      theme.theme.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      theme.theme.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
    
    const matchesCategory = state.selectedCategory === 'all' || 
      theme.theme.category === state.selectedCategory
    
    const matchesType = state.selectedType === 'all' || 
      theme.theme.type === state.selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  const renderThemeCard = (themeResponse: ThemeResponse) => {
    const { theme } = themeResponse
    
    return (
      <Card key={theme.id} className={`relative transition-all duration-200 hover:shadow-lg ${
        themeResponse.is_active ? 'ring-2 ring-primary' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {theme.name}
                {themeResponse.is_active && (
                  <Badge variant="default" className="text-xs">
                    Ativo
                  </Badge>
                )}
                {theme.is_system && (
                  <Badge variant="secondary" className="text-xs">
                    Sistema
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {theme.description || 'Sem descrição'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => previewTheme(theme)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExportTheme(theme.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {themeResponse.can_edit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTheme(themeResponse)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {themeResponse.can_delete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Tema</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o tema "{theme.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTheme(theme.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Theme Preview Colors */}
            <div className="flex gap-2">
              {theme.colors.primary && Object.values(theme.colors.primary).slice(4, 7).map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Theme Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {theme.type === ThemeType.LIGHT && <Sun className="h-4 w-4" />}
                {theme.type === ThemeType.DARK && <Moon className="h-4 w-4" />}
                {theme.type === ThemeType.AUTO && <Monitor className="h-4 w-4" />}
                {theme.type === ThemeType.HIGH_CONTRAST && <Contrast className="h-4 w-4" />}
                <span className="capitalize">{theme.type}</span>
              </div>
              <span>{format(new Date(theme.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            
            {/* Tags */}
            {theme.tags && theme.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {theme.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {theme.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{theme.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Action Button */}
            {!themeResponse.is_active && (
              <Button
                className="w-full"
                onClick={() => handleActivateTheme(theme.id)}
              >
                Ativar Tema
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderThemeBuilder = () => {
    if (!state.themeBuilder) return null

    return (
      <Dialog open={showBuilderDialog} onOpenChange={setShowBuilderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Construtor de Temas</DialogTitle>
            <DialogDescription>
              Crie seu tema personalizado usando o construtor visual
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Builder Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => themeService.undoThemeBuilder()}
                  disabled={state.themeBuilder.current_step < 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => themeService.redoThemeBuilder()}
                  disabled={state.themeBuilder.current_step >= state.themeBuilder.history.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateThemeBuilder(ThemeBuilderAction.RESET, {})}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => state.themeBuilder && previewTheme(state.themeBuilder.current_theme)}
                  disabled={!state.themeBuilder}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                {state.showPreview && (
                  <Button
                    variant="outline"
                    onClick={stopPreview}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Parar Visualização
                  </Button>
                )}
              </div>
            </div>
            
            {/* Builder Tabs */}
            <Tabs defaultValue="colors" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="typography">Tipografia</TabsTrigger>
                <TabsTrigger value="spacing">Espaçamento</TabsTrigger>
                <TabsTrigger value="components">Componentes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Primary Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cores Primárias</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {state.themeBuilder.current_theme.colors?.primary && 
                        Object.entries(state.themeBuilder.current_theme.colors.primary).map(([shade, color]) => (
                          <div key={shade} className="flex items-center gap-3">
                            <Label className="w-12 text-xs">{shade}</Label>
                            <Input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = {
                                  ...state.themeBuilder!.current_theme.colors,
                                  primary: {
                                    ...state.themeBuilder!.current_theme.colors!.primary,
                                    [shade]: e.target.value
                                  }
                                }
                                updateThemeBuilder(ThemeBuilderAction.UPDATE_COLORS, { colors: newColors })
                              }}
                              className="w-16 h-8 p-1 border rounded"
                            />
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))
                      }
                    </CardContent>
                  </Card>
                  
                  {/* Secondary Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cores Secundárias</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {state.themeBuilder.current_theme.colors?.secondary && 
                        Object.entries(state.themeBuilder.current_theme.colors.secondary).slice(0, 5).map(([shade, color]) => (
                          <div key={shade} className="flex items-center gap-3">
                            <Label className="w-12 text-xs">{shade}</Label>
                            <Input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = {
                                  ...state.themeBuilder!.current_theme.colors,
                                  secondary: {
                                    ...state.themeBuilder!.current_theme.colors!.secondary,
                                    [shade]: e.target.value
                                  }
                                }
                                updateThemeBuilder(ThemeBuilderAction.UPDATE_COLORS, { colors: newColors })
                              }}
                              className="w-16 h-8 p-1 border rounded"
                            />
                            <div
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))
                      }
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="typography" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Famílias de Fonte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Sans Serif</Label>
                      <Input
                        value={state.themeBuilder.current_theme.typography?.font_families.sans.join(', ') || ''}
                        onChange={(e) => {
                          const fonts = e.target.value.split(',').map(f => f.trim())
                          const newTypography = {
                            ...state.themeBuilder!.current_theme.typography,
                            font_families: {
                              ...state.themeBuilder!.current_theme.typography!.font_families,
                              sans: fonts
                            }
                          }
                          updateThemeBuilder(ThemeBuilderAction.UPDATE_TYPOGRAPHY, { typography: newTypography })
                        }}
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Monospace</Label>
                      <Input
                        value={state.themeBuilder.current_theme.typography?.font_families.mono.join(', ') || ''}
                        onChange={(e) => {
                          const fonts = e.target.value.split(',').map(f => f.trim())
                          const newTypography = {
                            ...state.themeBuilder!.current_theme.typography,
                            font_families: {
                              ...state.themeBuilder!.current_theme.typography!.font_families,
                              mono: fonts
                            }
                          }
                          updateThemeBuilder(ThemeBuilderAction.UPDATE_TYPOGRAPHY, { typography: newTypography })
                        }}
                        placeholder="Fira Code, monospace"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="spacing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sistema de Espaçamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      O sistema de espaçamento usa valores padrão baseados em rem.
                      Personalizações avançadas estarão disponíveis em breve.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="components" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Estilos de Componentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Personalização de componentes estará disponível em breve.
                      Por enquanto, os componentes usam as cores definidas na aba "Cores".
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            {/* Save Theme */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-2">
                <Label>Nome do Tema</Label>
                <Input
                  value={state.themeBuilder.current_theme.name || ''}
                  onChange={(e) => {
                    setState(prev => ({
                      ...prev,
                      themeBuilder: {
                        ...prev.themeBuilder!,
                        current_theme: {
                          ...prev.themeBuilder!.current_theme,
                          name: e.target.value
                        }
                      }
                    }))
                  }}
                  placeholder="Meu Tema Personalizado"
                  className="w-64"
                />
              </div>
              
              <Button
                onClick={async () => {
                  if (!state.themeBuilder?.current_theme.name) {
                    toast.error('Digite um nome para o tema')
                    return
                  }
                  
                  try {
                    await themeService.createTheme({
                      ...state.themeBuilder.current_theme,
                      name: state.themeBuilder.current_theme.name,
                      type: state.themeBuilder.base_theme,
                      category: ThemeCategory.PERSONAL
                    } as ThemeCreateRequest, 'current-user')
                    
                    await loadData()
                    setShowBuilderDialog(false)
                    toast.success('Tema criado com sucesso')
                  } catch (error) {
                    console.error('Error saving theme:', error)
                    toast.error('Erro ao salvar tema')
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Tema
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando temas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Temas Personalizáveis</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e personalize a aparência do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {state.showPreview && (
            <Button variant="outline" onClick={stopPreview}>
              <EyeOff className="h-4 w-4 mr-2" />
              Parar Visualização
            </Button>
          )}
          
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Tema</DialogTitle>
                <DialogDescription>
                  Selecione um arquivo de tema (.json) para importar
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Arquivo do Tema</Label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleImportTheme} disabled={!importFile}>
                    Importar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={initializeThemeBuilder}>
            <Paintbrush className="h-4 w-4 mr-2" />
            Construtor
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tema
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Tema</DialogTitle>
                <DialogDescription>
                  Crie um tema personalizado do zero
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={newTheme.name || ''}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Meu Tema Personalizado"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={newTheme.description || ''}
                    onChange={(e) => setNewTheme(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do tema..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newTheme.type}
                      onValueChange={(value) => setNewTheme(prev => ({ ...prev, type: value as ThemeType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ThemeType.LIGHT}>Claro</SelectItem>
                        <SelectItem value={ThemeType.DARK}>Escuro</SelectItem>
                        <SelectItem value={ThemeType.AUTO}>Automático</SelectItem>
                        <SelectItem value={ThemeType.HIGH_CONTRAST}>Alto Contraste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={newTheme.category}
                      onValueChange={(value) => setNewTheme(prev => ({ ...prev, category: value as ThemeCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ThemeCategory.PERSONAL}>Pessoal</SelectItem>
                        <SelectItem value={ThemeCategory.COMMUNITY}>Comunidade</SelectItem>
                        <SelectItem value={ThemeCategory.BRAND}>Marca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateTheme}>
                    Criar Tema
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Theme Configuration */}
      {state.themeConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Tema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Troca Automática</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={state.themeConfig.auto_switch}
                    onCheckedChange={(checked) => handleUpdateThemeConfig({ auto_switch: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Alternar entre claro/escuro automaticamente
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Alto Contraste</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={state.themeConfig.high_contrast}
                    onCheckedChange={(checked) => handleUpdateThemeConfig({ high_contrast: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Melhor acessibilidade visual
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Reduzir Movimento</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={state.themeConfig.reduce_motion}
                    onCheckedChange={(checked) => handleUpdateThemeConfig({ reduce_motion: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    Reduzir animações e transições
                  </span>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label>Escala da Fonte: {state.themeConfig.font_scale}x</Label>
              <Slider
                value={[state.themeConfig.font_scale]}
                onValueChange={([value]) => handleUpdateThemeConfig({ font_scale: value })}
                min={THEME_CONSTANTS.FONT_SCALE_MIN}
                max={THEME_CONSTANTS.FONT_SCALE_MAX}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Menor</span>
                <span>Normal</span>
                <span>Maior</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar temas..."
                  value={state.searchQuery}
                  onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={state.selectedCategory}
              onValueChange={(value) => setState(prev => ({ ...prev, selectedCategory: value as ThemeCategory | 'all' }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value={ThemeCategory.OFFICIAL}>Oficial</SelectItem>
                <SelectItem value={ThemeCategory.COMMUNITY}>Comunidade</SelectItem>
                <SelectItem value={ThemeCategory.PERSONAL}>Pessoal</SelectItem>
                <SelectItem value={ThemeCategory.BRAND}>Marca</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={state.selectedType}
              onValueChange={(value) => setState(prev => ({ ...prev, selectedType: value as ThemeType | 'all' }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value={ThemeType.LIGHT}>Claro</SelectItem>
                <SelectItem value={ThemeType.DARK}>Escuro</SelectItem>
                <SelectItem value={ThemeType.AUTO}>Automático</SelectItem>
                <SelectItem value={ThemeType.HIGH_CONTRAST}>Alto Contraste</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={state.viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={state.viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Themes Grid */}
      <div className={`grid gap-6 ${
        state.viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {filteredThemes.map(renderThemeCard)}
      </div>

      {filteredThemes.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Palette className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Nenhum tema encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou criar um novo tema
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Builder Dialog */}
      {renderThemeBuilder()}
    </div>
  )
}