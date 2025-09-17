import { useState } from 'react';
import Layout from '../components/Layout';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import type { Company } from '../types/index.js';

interface CompanyFormData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

const initialFormData: CompanyFormData = {
  name: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
};

// Mock data - será substituído pela integração com Supabase
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Empresa Exemplo Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@exemplo.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Tech Solutions S.A.',
    cnpj: '98.765.432/0001-10',
    email: 'admin@techsolutions.com',
    phone: '(11) 88888-8888',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-100',
    active: true,
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
  },
];

export default function Companies() {
  // const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<CompanyFormData>>({});

  // Filtrar empresas baseado no termo de busca
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let weight = 5;
    
    // Primeiro dígito verificador
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    if (parseInt(cleanCNPJ[12]) !== digit1) return false;
    
    // Segundo dígito verificador
    sum = 0;
    weight = 6;
    
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(cleanCNPJ[13]) === digit2;
  };

  // Formatar CNPJ
  const formatCNPJ = (value: string): string => {
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<CompanyFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da empresa é obrigatório';
    }
    
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Abrir modal para nova empresa
  const handleNewCompany = () => {
    setEditingCompany(null);
    setFormData(initialFormData);
    setErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal para editar empresa
  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj,
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip_code: company.zip_code || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Salvar empresa
  const handleSaveCompany = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      
      if (editingCompany) {
        // Atualizar empresa existente
        const updatedCompany: Company = {
          ...editingCompany,
          ...formData,
          updated_at: now,
        };
        
        setCompanies(prev => 
          prev.map(company => 
            company.id === editingCompany.id ? updatedCompany : company
          )
        );
      } else {
        // Criar nova empresa
        const newCompany: Company = {
          id: Date.now().toString(),
          ...formData,
          active: true,
          created_at: now,
          updated_at: now,
        };
        
        setCompanies(prev => [...prev, newCompany]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  // Excluir empresa
  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      return;
    }
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCompanies(prev => prev.filter(c => c.id !== company.id));
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
            <p className="text-gray-600">Gerencie as empresas do sistema</p>
          </div>
          <button
            onClick={handleNewCompany}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nova Empresa
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lista de empresas */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Criada em {new Date(company.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {company.cnpj}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.email}</div>
                      <div className="text-sm text-gray-500">{company.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.city}, {company.state}</div>
                      <div className="text-sm text-gray-500">{company.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        company.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {company.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando uma nova empresa.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite o nome da empresa"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cnpj ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="00.000.000/0000-00"
                  />
                  {errors.cnpj && <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contato@empresa.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00000-000"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Rua, número, complemento"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="São Paulo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o estado</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="PR">Paraná</option>
                    <option value="SC">Santa Catarina</option>
                    {/* Adicionar outros estados conforme necessário */}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCompany}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}