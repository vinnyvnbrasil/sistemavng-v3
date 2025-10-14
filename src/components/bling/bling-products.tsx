"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlingProduct {
  id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  preco?: number;
  precoCusto?: number;
  unidade?: string;
  peso?: number;
  categoria?: string;
  situacao?: 'Ativo' | 'Inativo';
  estoque?: {
    saldoVirtualTotal?: number;
    saldoFisicoTotal?: number;
  };
  imagem?: {
    link?: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface BlingProductsProps {
  companyId: string;
}

const situacaoColors = {
  'Ativo': 'bg-green-100 text-green-800',
  'Inativo': 'bg-red-100 text-red-800'
};

export function BlingProducts({ companyId }: BlingProductsProps) {
  const [products, setProducts] = useState<BlingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<BlingProduct | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Form data
  const [formData, setFormData] = useState<Partial<BlingProduct>>({
    nome: '',
    descricao: '',
    preco: 0,
    precoCusto: 0,
    unidade: 'UN',
    peso: 0,
    categoria: '',
    situacao: 'Ativo'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        company_id: companyId,
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (situacaoFilter !== 'all') {
        params.append('situacao', situacaoFilter);
      }
      if (categoriaFilter !== 'all') {
        params.append('categoria', categoriaFilter);
      }

      const response = await fetch(`/api/bling/products?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      setTotalItems(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar produtos do Bling');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    try {
      const response = await fetch('/api/bling/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          product: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar produto');
      }

      toast.success('Produto criado com sucesso');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar produto');
    }
  };

  const updateProduct = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/bling/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          product: formData
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar produto');
      }

      toast.success('Produto atualizado com sucesso');
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar produto');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/bling/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir produto');
      }

      toast.success('Produto excluído com sucesso');
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir produto');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: 0,
      precoCusto: 0,
      unidade: 'UN',
      peso: 0,
      categoria: '',
      situacao: 'Ativo'
    });
  };

  const openEditDialog = (product: BlingProduct) => {
    setSelectedProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || '',
      preco: product.preco || 0,
      precoCusto: product.precoCusto || 0,
      unidade: product.unidade || 'UN',
      peso: product.peso || 0,
      categoria: product.categoria || '',
      situacao: product.situacao || 'Ativo'
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (product: BlingProduct) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  useEffect(() => {
    fetchProducts();
  }, [companyId, currentPage, searchTerm, situacaoFilter, categoriaFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading && products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos do Bling</CardTitle>
          <CardDescription>Gerencie seus produtos sincronizados com o Bling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos do Bling
            </CardTitle>
            <CardDescription>
              Gerencie seus produtos sincronizados com o Bling ({totalItems} produtos)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProducts}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Produto</DialogTitle>
                  <DialogDescription>
                    Adicione um novo produto ao Bling
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      placeholder="Categoria do produto"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descrição do produto"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preco">Preço de Venda</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="precoCusto">Preço de Custo</Label>
                    <Input
                      id="precoCusto"
                      type="number"
                      step="0.01"
                      value={formData.precoCusto}
                      onChange={(e) => setFormData({ ...formData, precoCusto: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade</Label>
                    <Select value={formData.unidade} onValueChange={(value) => setFormData({ ...formData, unidade: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UN">Unidade</SelectItem>
                        <SelectItem value="KG">Quilograma</SelectItem>
                        <SelectItem value="G">Grama</SelectItem>
                        <SelectItem value="L">Litro</SelectItem>
                        <SelectItem value="ML">Mililitro</SelectItem>
                        <SelectItem value="M">Metro</SelectItem>
                        <SelectItem value="CM">Centímetro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.001"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: parseFloat(e.target.value) || 0 })}
                      placeholder="0.000"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="situacao">Situação</Label>
                    <Select value={formData.situacao} onValueChange={(value: any) => setFormData({ ...formData, situacao: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={createProduct} disabled={!formData.nome}>
                    Criar Produto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {/* Aqui você pode adicionar categorias dinâmicas */}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {product.imagem?.link ? (
                            <img 
                              src={product.imagem.link} 
                              alt={product.nome}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.nome}</div>
                          {product.descricao && (
                            <div className="text-sm text-muted-foreground truncate max-w-48">
                              {product.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {product.codigo || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {product.categoria || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {product.preco ? formatCurrency(product.preco) : '-'}
                        </div>
                        {product.precoCusto && (
                          <div className="text-xs text-muted-foreground">
                            Custo: {formatCurrency(product.precoCusto)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.estoque ? (
                        <div className="space-y-1">
                          <div className="text-sm">
                            Virtual: {formatNumber(product.estoque.saldoVirtualTotal || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Físico: {formatNumber(product.estoque.saldoFisicoTotal || 0)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={situacaoColors[product.situacao || 'Inativo']}>
                        {product.situacao || 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(product)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} produtos
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-3 text-sm">
                Página {currentPage} de {totalPages}
              </span>
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
        )}

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
              <DialogDescription>
                Atualize as informações do produto
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome *</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoria</Label>
                <Input
                  id="edit-categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Categoria do produto"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-preco">Preço de Venda</Label>
                <Input
                  id="edit-preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-precoCusto">Preço de Custo</Label>
                <Input
                  id="edit-precoCusto"
                  type="number"
                  step="0.01"
                  value={formData.precoCusto}
                  onChange={(e) => setFormData({ ...formData, precoCusto: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unidade">Unidade</Label>
                <Select value={formData.unidade} onValueChange={(value) => setFormData({ ...formData, unidade: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">Unidade</SelectItem>
                    <SelectItem value="KG">Quilograma</SelectItem>
                    <SelectItem value="G">Grama</SelectItem>
                    <SelectItem value="L">Litro</SelectItem>
                    <SelectItem value="ML">Mililitro</SelectItem>
                    <SelectItem value="M">Metro</SelectItem>
                    <SelectItem value="CM">Centímetro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-peso">Peso (kg)</Label>
                <Input
                  id="edit-peso"
                  type="number"
                  step="0.001"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: parseFloat(e.target.value) || 0 })}
                  placeholder="0.000"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-situacao">Situação</Label>
                <Select value={formData.situacao} onValueChange={(value: any) => setFormData({ ...formData, situacao: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedProduct(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={updateProduct} disabled={!formData.nome}>
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Visualização */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Produto</DialogTitle>
              <DialogDescription>
                Informações completas do produto
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    {selectedProduct.imagem?.link ? (
                      <img 
                        src={selectedProduct.imagem.link} 
                        alt={selectedProduct.nome}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedProduct.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      Código: {selectedProduct.codigo || 'N/A'}
                    </p>
                    <Badge className={situacaoColors[selectedProduct.situacao || 'Inativo']}>
                      {selectedProduct.situacao || 'Inativo'}
                    </Badge>
                  </div>
                </div>

                {selectedProduct.descricao && (
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedProduct.descricao}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Preço de Venda</Label>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedProduct.preco ? formatCurrency(selectedProduct.preco) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Preço de Custo</Label>
                    <p className="mt-1 text-lg font-semibold">
                      {selectedProduct.precoCusto ? formatCurrency(selectedProduct.precoCusto) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Categoria</Label>
                    <p className="mt-1 text-sm">
                      {selectedProduct.categoria || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Unidade</Label>
                    <p className="mt-1 text-sm">
                      {selectedProduct.unidade || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Peso</Label>
                    <p className="mt-1 text-sm">
                      {selectedProduct.peso ? `${selectedProduct.peso} kg` : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedProduct.estoque && (
                  <div>
                    <Label className="text-sm font-medium">Estoque</Label>
                    <div className="mt-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Virtual</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(selectedProduct.estoque.saldoVirtualTotal || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Saldo Físico</p>
                        <p className="text-lg font-semibold">
                          {formatNumber(selectedProduct.estoque.saldoFisicoTotal || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedProduct.created_at || selectedProduct.updated_at) && (
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    {selectedProduct.created_at && (
                      <div>
                        <p>Criado em:</p>
                        <p>{format(new Date(selectedProduct.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                    )}
                    {selectedProduct.updated_at && (
                      <div>
                        <p>Atualizado em:</p>
                        <p>{format(new Date(selectedProduct.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}