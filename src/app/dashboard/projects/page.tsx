'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Plus, Filter, MoreHorizontal, FolderOpen, Clock, CheckCircle, 
  AlertCircle, Users, TrendingUp, RefreshCw, Eye, Edit, Trash2,
  Calendar, User, Settings, Archive, Star, GitBranch
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string;
  end_date?: string;
  budget?: number;
  progress: number;
  team_members: number;
  tasks_total: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
}

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  on_hold: number;
  cancelled: number;
  total_budget: number;
  avg_progress: number;
}

const PROJECT_STATUS_LABELS = {
  active: 'Ativo',
  completed: 'Concluído',
  on_hold: 'Em Espera',
  cancelled: 'Cancelado'
};

const PROJECT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'border-l-gray-300',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-500'
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createClient();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadProjects();
      loadStats();
    }
  }, [currentPage, statusFilter, priorityFilter, searchTerm, companyId]);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário está autenticado
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      // Buscar o perfil do usuário para obter o company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profile?.company_id) {
        toast.error('Erro ao obter informações da empresa');
        return;
      }

      setCompanyId(profile.company_id);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      
      // Simulando dados de projetos (substitua pela sua API real)
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Sistema de E-commerce',
          description: 'Desenvolvimento de plataforma de vendas online',
          status: 'active',
          priority: 'high',
          start_date: '2024-01-15',
          end_date: '2024-06-30',
          budget: 50000,
          progress: 65,
          team_members: 5,
          tasks_total: 24,
          tasks_completed: 16,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z'
        },
        {
          id: '2',
          name: 'App Mobile',
          description: 'Aplicativo mobile para iOS e Android',
          status: 'active',
          priority: 'medium',
          start_date: '2024-02-01',
          end_date: '2024-08-15',
          budget: 35000,
          progress: 30,
          team_members: 3,
          tasks_total: 18,
          tasks_completed: 5,
          created_at: '2024-02-01T09:00:00Z',
          updated_at: '2024-02-05T14:20:00Z'
        },
        {
          id: '3',
          name: 'Dashboard Analytics',
          description: 'Painel de controle com métricas e relatórios',
          status: 'completed',
          priority: 'medium',
          start_date: '2023-10-01',
          end_date: '2023-12-31',
          budget: 25000,
          progress: 100,
          team_members: 4,
          tasks_total: 15,
          tasks_completed: 15,
          created_at: '2023-10-01T08:00:00Z',
          updated_at: '2023-12-31T17:00:00Z'
        }
      ];

      // Aplicar filtros
      let filteredProjects = mockProjects;
      
      if (statusFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
      }
      
      if (priorityFilter !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.priority === priorityFilter);
      }
      
      if (searchTerm) {
        filteredProjects = filteredProjects.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setProjects(filteredProjects);
      setTotalPages(Math.ceil(filteredProjects.length / 10));
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!companyId) return;
    
    try {
      // Simulando estatísticas (substitua pela sua API real)
      const mockStats: ProjectStats = {
        total: 8,
        active: 3,
        completed: 4,
        on_hold: 1,
        cancelled: 0,
        total_budget: 180000,
        avg_progress: 67
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'active':
        return <FolderOpen className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando projetos...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="projects">Todos os Projetos</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="completed">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.active || 0} ativos
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.total_budget || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Investimento total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.avg_progress || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos os projetos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.completed || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Finalizados com sucesso
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de status dos projetos */}
          <Card>
            <CardHeader>
              <CardTitle>Projetos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(PROJECT_STATUS_LABELS).map(([status, label]) => {
                  const count = stats?.[status as keyof ProjectStats] as number || 0;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${((count) / (stats?.total || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(PROJECT_STATUS_LABELS).map(([status, label]) => (
                  <SelectItem key={status} value={status}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter || 'all'} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className={`border-l-4 ${PRIORITY_COLORS[project.priority]}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={PROJECT_STATUS_COLORS[project.status]}>
                        {getStatusIcon(project.status)}
                        <span className="ml-1">{PROJECT_STATUS_LABELS[project.status]}</span>
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProject(project)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Gerenciar Equipe
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurações
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Data de Início:</span>
                      <p className="font-medium">
                        {new Date(project.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Orçamento:</span>
                      <p className="font-medium text-green-600">
                        {project.budget ? formatCurrency(project.budget) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Equipe:</span>
                      <p className="font-medium">{project.team_members} membro(s)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tarefas:</span>
                      <p className="font-medium">
                        {project.tasks_completed}/{project.tasks_total}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Paginação */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {projects.filter(p => p.status === 'active').map((project) => (
              <Card key={project.id} className={`border-l-4 ${PRIORITY_COLORS[project.priority]}`}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Progresso: {project.progress}%
                      </p>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <Badge className={PROJECT_STATUS_COLORS[project.status]}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {projects.filter(p => p.status === 'completed').map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    {project.name}
                  </CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Concluído em: {project.end_date ? new Date(project.end_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                    <Badge className={PROJECT_STATUS_COLORS[project.status]}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes do projeto */}
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedProject.name}</DialogTitle>
              <DialogDescription>{selectedProject.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge className={PROJECT_STATUS_COLORS[selectedProject.status]}>
                    {PROJECT_STATUS_LABELS[selectedProject.status]}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">Progresso</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${selectedProject.progress}%` }}
                      />
                    </div>
                    <span className="text-sm">{selectedProject.progress}%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Data de Início</h4>
                  <p>{new Date(selectedProject.start_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <h4 className="font-medium">Orçamento</h4>
                  <p>{selectedProject.budget ? formatCurrency(selectedProject.budget) : 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Membros da Equipe</h4>
                  <p>{selectedProject.team_members} pessoa(s)</p>
                </div>
                <div>
                  <h4 className="font-medium">Tarefas</h4>
                  <p>{selectedProject.tasks_completed}/{selectedProject.tasks_total} concluídas</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}