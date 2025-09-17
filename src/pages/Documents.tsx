import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import type { Document, DocumentFolder } from '../types/index.js';

// interface DocumentFormData {
//   name: string;
//   description: string;
//   folder_id: string;
// }

// const initialFormData: DocumentFormData = {
//   name: '',
//   description: '',
//   folder_id: '',
// };

interface FolderFormData {
  name: string;
  description: string;
  parent_id: string;
}

const initialFolderFormData: FolderFormData = {
  name: '',
  description: '',
  parent_id: '',
};

// Mock data para demonstração
const mockFolders: DocumentFolder[] = [
  {
    id: '1',
    name: 'Documentos Fiscais',
    description: 'Notas fiscais, recibos e comprovantes',
    parent_id: null,
    path: '/Documentos Fiscais',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Contratos',
    description: 'Contratos e acordos comerciais',
    parent_id: null,
    path: '/Contratos',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Notas Fiscais de Entrada',
    description: 'NFe de fornecedores',
    parent_id: '1',
    path: '/Documentos Fiscais/Notas Fiscais de Entrada',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '4',
    name: 'Notas Fiscais de Saída',
    description: 'NFe para clientes',
    parent_id: '1',
    path: '/Documentos Fiscais/Notas Fiscais de Saída',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'NFe_001_2024.pdf',
    original_name: 'Nota Fiscal 001-2024.pdf',
    description: 'Nota fiscal de venda para Cliente ABC',
    file_type: 'application/pdf',
    file_size: 245760,
    folder_id: '4',
    file_path: '/uploads/documents/nfe_001_2024.pdf',
    uploaded_by: 'user123',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'contrato_fornecedor_xyz.pdf',
    original_name: 'Contrato Fornecedor XYZ.pdf',
    description: 'Contrato de fornecimento de materiais',
    file_type: 'application/pdf',
    file_size: 512000,
    folder_id: '2',
    file_path: '/uploads/documents/contrato_fornecedor_xyz.pdf',
    uploaded_by: 'user123',
    created_at: '2024-01-18T09:15:00Z',
    updated_at: '2024-01-18T09:15:00Z',
  },
  {
    id: '3',
    name: 'recibo_compra_equipamentos.jpg',
    original_name: 'Recibo Compra Equipamentos.jpg',
    description: 'Recibo de compra de equipamentos de escritório',
    file_type: 'image/jpeg',
    file_size: 1024000,
    folder_id: '3',
    file_path: '/uploads/documents/recibo_compra_equipamentos.jpg',
    uploaded_by: 'user123',
    created_at: '2024-01-16T16:45:00Z',
    updated_at: '2024-01-16T16:45:00Z',
  },
];

export default function Documents() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<DocumentFolder[]>(mockFolders);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1']));
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  // const [documentFormData, setDocumentFormData] = useState<DocumentFormData>(initialFormData);
  const [folderFormData, setFolderFormData] = useState<FolderFormData>(initialFolderFormData);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Filtrar documentos por pasta selecionada e termo de busca
  const filteredDocuments = documents.filter(doc => {
    const matchesFolder = selectedFolder ? doc.folder_id === selectedFolder : true;
    const matchesSearch = searchTerm ? 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.original_name.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesFolder && matchesSearch;
  });

  // Obter pastas filhas de uma pasta pai
  const getChildFolders = (parentId: string | null) => {
    return folders.filter(folder => folder.parent_id === parentId);
  };

  // Alternar expansão de pasta
  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Renderizar árvore de pastas
  const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
    const childFolders = getChildFolders(parentId);
    
    return childFolders.map(folder => {
      const hasChildren = getChildFolders(folder.id).length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolder === folder.id;
      const documentsCount = documents.filter(doc => doc.folder_id === folder.id).length;
      
      return (
        <div key={folder.id}>
          <div
            className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 ${
              isSelected ? 'bg-primary-50 border-r-2 border-primary-500' : ''
            }`}
            style={{ paddingLeft: `${12 + level * 20}px` }}
            onClick={() => setSelectedFolder(folder.id)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolderExpansion(folder.id);
                }}
                className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            
            {isExpanded ? (
              <FolderOpenIcon className="h-5 w-5 text-primary-600 mr-2" />
            ) : (
              <FolderIcon className="h-5 w-5 text-primary-600 mr-2" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${
                isSelected ? 'font-medium text-primary-900' : 'text-gray-900'
              }`}>
                {folder.name}
              </p>
              {documentsCount > 0 && (
                <p className="text-xs text-gray-500">
                  {documentsCount} documento{documentsCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          {isExpanded && renderFolderTree(folder.id, level + 1)}
        </div>
      );
    });
  };

  // Obter ícone do arquivo baseado no tipo
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return PhotoIcon;
    if (fileType.startsWith('video/')) return FilmIcon;
    if (fileType.startsWith('audio/')) return MusicalNoteIcon;
    if (fileType === 'application/pdf') return DocumentTextIcon;
    if (fileType.includes('zip') || fileType.includes('rar')) return ArchiveBoxIcon;
    return DocumentIcon;
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Manipular upload de arquivos
  const handleFileUpload = async (files: FileList) => {
    if (!selectedFolder) {
      alert('Selecione uma pasta antes de fazer upload.');
      return;
    }

    try {
      // Simular upload de arquivos
      const newDocuments: Document[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newDoc: Document = {
          id: Date.now().toString() + i,
          name: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
          original_name: file.name,
          description: `Documento enviado em ${new Date().toLocaleDateString('pt-BR')}`,
          file_type: file.type,
          file_size: file.size,
          folder_id: selectedFolder,
          file_path: `/uploads/documents/${file.name}`,
          uploaded_by: user?.id || 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        newDocuments.push(newDoc);
      }
      
      setDocuments(prev => [...prev, ...newDocuments]);
      setIsUploadModalOpen(false);
      setSelectedFiles(null);
      alert(`${newDocuments.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload dos arquivos.');
    }
  };

  // Manipular drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Criar nova pasta
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const parentFolder = folderFormData.parent_id ? 
        folders.find(f => f.id === folderFormData.parent_id) : null;
      
      const newFolder: DocumentFolder = {
        id: Date.now().toString(),
        name: folderFormData.name,
        description: folderFormData.description,
        parent_id: folderFormData.parent_id || null,
        path: parentFolder ? `${parentFolder.path}/${folderFormData.name}` : `/${folderFormData.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setFolders(prev => [...prev, newFolder]);
      setIsFolderModalOpen(false);
      setFolderFormData(initialFolderFormData);
      alert('Pasta criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      alert('Erro ao criar pasta.');
    }
  };

  // Excluir documento
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      alert('Documento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir documento.');
    }
  };

  const selectedFolderData = selectedFolder ? folders.find(f => f.id === selectedFolder) : null;

  return (
    <Layout>
      <div className="flex h-full">
        {/* Sidebar de pastas */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Pastas</h2>
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Botão "Todos os documentos" */}
            <div
              className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded-md ${
                selectedFolder === null ? 'bg-primary-50 border border-primary-200' : ''
              }`}
              onClick={() => setSelectedFolder(null)}
            >
              <DocumentTextIcon className="h-5 w-5 text-gray-600 mr-2" />
              <span className={`text-sm ${
                selectedFolder === null ? 'font-medium text-primary-900' : 'text-gray-900'
              }`}>
                Todos os documentos
              </span>
              <span className="ml-auto text-xs text-gray-500">
                {documents.length}
              </span>
            </div>
          </div>
          
          {/* Árvore de pastas */}
          <div className="flex-1 overflow-y-auto">
            {renderFolderTree()}
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedFolderData ? selectedFolderData.name : 'Todos os Documentos'}
                </h1>
                {selectedFolderData && (
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedFolderData.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  disabled={!selectedFolder}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-4 w-4" />
                  Upload
                </button>
              </div>
            </div>
          </div>

          {/* Área de documentos */}
          <div 
            className={`flex-1 p-6 ${
              dragOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {selectedFolder ? 'Nenhum documento nesta pasta' : 'Nenhum documento encontrado'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedFolder 
                    ? 'Faça upload de documentos para esta pasta.' 
                    : searchTerm 
                      ? 'Tente ajustar os termos de busca.'
                      : 'Selecione uma pasta e faça upload de documentos.'
                  }
                </p>
                {selectedFolder && (
                  <div className="mt-6">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CloudArrowUpIcon className="-ml-1 mr-2 h-4 w-4" />
                      Fazer Upload
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((document) => {
                  const FileIcon = getFileIcon(document.file_type);
                  
                  return (
                    <div key={document.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <FileIcon className="h-8 w-8 text-primary-600 flex-shrink-0" />
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => alert('Visualizar documento: ' + document.name)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Visualizar"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => alert('Download: ' + document.name)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={document.original_name}>
                          {document.original_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {document.description}
                        </p>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>{new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Upload */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload de Documentos</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pasta de destino
                  </label>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedFolderData?.name || 'Nenhuma pasta selecionada'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar arquivos
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
                
                {selectedFiles && selectedFiles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Arquivos selecionados ({selectedFiles.length}):
                    </p>
                    <div className="max-h-32 overflow-y-auto">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index} className="text-xs text-gray-600 py-1">
                          {file.name} ({formatFileSize(file.size)})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setSelectedFiles(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => selectedFiles && handleFileUpload(selectedFiles)}
                  disabled={!selectedFiles || selectedFiles.length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Fazer Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Pasta */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Pasta</h3>
              
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label htmlFor="folder_name" className="block text-sm font-medium text-gray-700">
                    Nome da pasta *
                  </label>
                  <input
                    type="text"
                    id="folder_name"
                    value={folderFormData.name}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Nome da pasta"
                  />
                </div>
                
                <div>
                  <label htmlFor="folder_description" className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    id="folder_description"
                    value={folderFormData.description}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Descrição da pasta (opcional)"
                  />
                </div>
                
                <div>
                  <label htmlFor="parent_folder" className="block text-sm font-medium text-gray-700">
                    Pasta pai
                  </label>
                  <select
                    id="parent_folder"
                    value={folderFormData.parent_id}
                    onChange={(e) => setFolderFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Pasta raiz</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.path}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFolderModalOpen(false);
                      setFolderFormData(initialFolderFormData);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Criar Pasta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}