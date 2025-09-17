export interface FileUpload {
  id: string
  name: string
  original_name: string
  size: number
  type: string
  mime_type: string
  extension: string
  path: string
  url: string
  thumbnail_url?: string
  uploaded_by: string
  uploaded_at: string
  updated_at: string
  entity_type?: EntityType
  entity_id?: string
  folder_id?: string
  is_public: boolean
  download_count: number
  metadata?: FileMetadata
  tags?: string[]
  description?: string
  version: number
  checksum: string
  status: FileStatus
}

export interface FileMetadata {
  width?: number
  height?: number
  duration?: number
  pages?: number
  author?: string
  title?: string
  subject?: string
  keywords?: string[]
  created_date?: string
  modified_date?: string
  application?: string
  producer?: string
  [key: string]: any
}

export interface FileFolder {
  id: string
  name: string
  path: string
  parent_id?: string
  created_by: string
  created_at: string
  updated_at: string
  is_public: boolean
  description?: string
  color?: string
  icon?: string
  file_count: number
  folder_count: number
  total_size: number
}

export interface FileShare {
  id: string
  file_id: string
  shared_by: string
  shared_with?: string
  share_type: ShareType
  permissions: FilePermission[]
  expires_at?: string
  created_at: string
  access_count: number
  last_accessed?: string
  token?: string
  password?: string
  is_active: boolean
}

export interface FileVersion {
  id: string
  file_id: string
  version: number
  name: string
  size: number
  path: string
  url: string
  uploaded_by: string
  uploaded_at: string
  checksum: string
  changes_description?: string
  is_current: boolean
}

export interface FileComment {
  id: string
  file_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  content: string
  created_at: string
  updated_at: string
  parent_id?: string
  replies?: FileComment[]
}

export interface FileActivity {
  id: string
  file_id: string
  user_id: string
  user_name: string
  user_avatar?: string
  action: FileAction
  description: string
  created_at: string
  metadata?: any
}

export interface StorageStats {
  total_files: number
  total_size: number
  used_storage: number
  available_storage: number
  storage_limit: number
  files_by_type: FileTypeStats[]
  recent_uploads: FileUpload[]
  popular_files: FileUpload[]
  storage_usage_by_month: StorageUsageByMonth[]
}

export interface FileTypeStats {
  type: string
  count: number
  total_size: number
  percentage: number
}

export interface StorageUsageByMonth {
  month: string
  uploads: number
  size: number
}

export interface FileFilter {
  search?: string
  type?: string
  mime_type?: string
  extension?: string
  folder_id?: string
  uploaded_by?: string
  entity_type?: EntityType
  entity_id?: string
  date_from?: string
  date_to?: string
  size_min?: number
  size_max?: number
  tags?: string[]
  is_public?: boolean
  status?: FileStatus
}

export interface UploadProgress {
  file_id: string
  file_name: string
  progress: number
  status: UploadStatus
  error?: string
  uploaded_size: number
  total_size: number
  speed?: number
  eta?: number
}

export interface CreateFileData {
  name: string
  file: File
  folder_id?: string
  entity_type?: EntityType
  entity_id?: string
  description?: string
  tags?: string[]
  is_public?: boolean
}

export interface UpdateFileData {
  name?: string
  description?: string
  tags?: string[]
  is_public?: boolean
  folder_id?: string
}

export interface CreateFolderData {
  name: string
  parent_id?: string
  description?: string
  color?: string
  icon?: string
  is_public?: boolean
}

export interface UpdateFolderData {
  name?: string
  description?: string
  color?: string
  icon?: string
  is_public?: boolean
  parent_id?: string
}

export interface CreateShareData {
  file_id: string
  share_type: ShareType
  shared_with?: string
  permissions: FilePermission[]
  expires_at?: string
  password?: string
}

export interface UpdateShareData {
  permissions?: FilePermission[]
  expires_at?: string
  password?: string
  is_active?: boolean
}

// Enums
export type FileStatus = 'uploading' | 'processing' | 'ready' | 'error' | 'deleted'

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled'

export type ShareType = 'public' | 'private' | 'password' | 'expiring'

export type FilePermission = 'view' | 'download' | 'comment' | 'edit' | 'delete' | 'share'

export type FileAction = 
  | 'upload'
  | 'download'
  | 'view'
  | 'edit'
  | 'delete'
  | 'share'
  | 'comment'
  | 'move'
  | 'copy'
  | 'rename'
  | 'version_create'
  | 'version_restore'

export type EntityType = 'project' | 'task' | 'user' | 'team' | 'comment'

export type FileViewMode = 'grid' | 'list' | 'table'

export type SortBy = 'name' | 'size' | 'type' | 'uploaded_at' | 'download_count'

export type SortOrder = 'asc' | 'desc'

// File type categories
export const FILE_CATEGORIES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
  document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'],
  spreadsheet: ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
  presentation: ['ppt', 'pptx', 'odp', 'key'],
  video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  code: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs'],
  other: []
} as const

// File type icons
export const FILE_TYPE_ICONS = {
  // Images
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', bmp: '🖼️', svg: '🖼️', webp: '🖼️', ico: '🖼️',
  // Documents
  pdf: '📄', doc: '📝', docx: '📝', txt: '📄', rtf: '📄', odt: '📝', pages: '📝',
  // Spreadsheets
  xls: '📊', xlsx: '📊', csv: '📊', ods: '📊', numbers: '📊',
  // Presentations
  ppt: '📽️', pptx: '📽️', odp: '📽️', key: '📽️',
  // Videos
  mp4: '🎥', avi: '🎥', mov: '🎥', wmv: '🎥', flv: '🎥', webm: '🎥', mkv: '🎥',
  // Audio
  mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵', ogg: '🎵', wma: '🎵',
  // Archives
  zip: '🗜️', rar: '🗜️', '7z': '🗜️', tar: '🗜️', gz: '🗜️', bz2: '🗜️',
  // Code
  js: '💻', ts: '💻', jsx: '💻', tsx: '💻', html: '💻', css: '💻', scss: '💻',
  json: '💻', xml: '💻', py: '💻', java: '💻', cpp: '💻', c: '💻', php: '💻',
  rb: '💻', go: '💻', rs: '💻',
  // Default
  default: '📄'
} as const

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  audio: 100 * 1024 * 1024, // 100MB
  archive: 200 * 1024 * 1024, // 200MB
  other: 100 * 1024 * 1024 // 100MB
} as const

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text',
  // Spreadsheets
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/vnd.oasis.opendocument.spreadsheet',
  // Presentations
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.presentation',
  // Videos
  'video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/x-ms-wma',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/x-tar', 'application/gzip', 'application/x-bzip2',
  // Code
  'text/javascript', 'text/typescript', 'text/html', 'text/css', 'application/json', 'text/xml',
  'text/x-python', 'text/x-java-source', 'text/x-c', 'text/x-php'
] as const

// Helper functions
export const getFileCategory = (extension: string): keyof typeof FILE_CATEGORIES => {
  const ext = extension.toLowerCase().replace('.', '')
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) {
      return category as keyof typeof FILE_CATEGORIES
    }
  }
  return 'other'
}

export const getFileIcon = (extension: string): string => {
  const ext = extension.toLowerCase().replace('.', '')
  return FILE_TYPE_ICONS[ext as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.default
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/')
}

export const isVideoFile = (mimeType: string): boolean => {
  return mimeType.startsWith('video/')
}

export const isAudioFile = (mimeType: string): boolean => {
  return mimeType.startsWith('audio/')
}

export const isDocumentFile = (mimeType: string): boolean => {
  return mimeType.includes('pdf') || 
         mimeType.includes('document') || 
         mimeType.includes('text') ||
         mimeType.includes('spreadsheet') ||
         mimeType.includes('presentation')
}

export const getFileSizeLimit = (mimeType: string): number => {
  if (isImageFile(mimeType)) return FILE_SIZE_LIMITS.image
  if (isVideoFile(mimeType)) return FILE_SIZE_LIMITS.video
  if (isAudioFile(mimeType)) return FILE_SIZE_LIMITS.audio
  if (isDocumentFile(mimeType)) return FILE_SIZE_LIMITS.document
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
    return FILE_SIZE_LIMITS.archive
  }
  return FILE_SIZE_LIMITS.other
}

export const validateFileType = (mimeType: string): boolean => {
  return ALLOWED_FILE_TYPES.includes(mimeType as any)
}

export const validateFileSize = (size: number, mimeType: string): boolean => {
  const limit = getFileSizeLimit(mimeType)
  return size <= limit
}