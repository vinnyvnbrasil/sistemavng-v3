// Theme Types and Interfaces

// Base theme structure
export interface Theme {
  id: string
  name: string
  description?: string
  type: ThemeType
  colors: ThemeColors
  typography: ThemeTypography
  spacing: ThemeSpacing
  shadows: ThemeShadows
  borders: ThemeBorders
  animations: ThemeAnimations
  components: ThemeComponents
  custom_properties?: Record<string, string>
  is_default: boolean
  is_system: boolean
  created_by?: string
  created_at: string
  updated_at: string
  version: string
  preview_image?: string
  tags?: string[]
  category?: ThemeCategory
}

// Theme types
export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  HIGH_CONTRAST = 'high_contrast',
  CUSTOM = 'custom'
}

// Theme categories
export enum ThemeCategory {
  OFFICIAL = 'official',
  COMMUNITY = 'community',
  PERSONAL = 'personal',
  SEASONAL = 'seasonal',
  BRAND = 'brand'
}

// Color palette
export interface ThemeColors {
  // Primary colors
  primary: ColorScale
  secondary: ColorScale
  accent: ColorScale
  
  // Semantic colors
  success: ColorScale
  warning: ColorScale
  error: ColorScale
  info: ColorScale
  
  // Neutral colors
  gray: ColorScale
  
  // Background colors
  background: {
    primary: string
    secondary: string
    tertiary: string
    overlay: string
    modal: string
    card: string
    hover: string
    active: string
  }
  
  // Text colors
  text: {
    primary: string
    secondary: string
    tertiary: string
    disabled: string
    inverse: string
    link: string
    link_hover: string
  }
  
  // Border colors
  border: {
    primary: string
    secondary: string
    focus: string
    error: string
    success: string
    warning: string
  }
  
  // Special colors
  brand: {
    primary: string
    secondary: string
    gradient: string
  }
}

// Color scale (50-950)
export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string // Base color
  600: string
  700: string
  800: string
  900: string
  950: string
}

// Typography settings
export interface ThemeTypography {
  font_families: {
    sans: string[]
    serif: string[]
    mono: string[]
    display: string[]
  }
  
  font_sizes: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
    '6xl': string
    '7xl': string
    '8xl': string
    '9xl': string
  }
  
  font_weights: {
    thin: number
    extralight: number
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
    extrabold: number
    black: number
  }
  
  line_heights: {
    none: number
    tight: number
    snug: number
    normal: number
    relaxed: number
    loose: number
  }
  
  letter_spacing: {
    tighter: string
    tight: string
    normal: string
    wide: string
    wider: string
    widest: string
  }
}

// Spacing system
export interface ThemeSpacing {
  0: string
  px: string
  0.5: string
  1: string
  1.5: string
  2: string
  2.5: string
  3: string
  3.5: string
  4: string
  5: string
  6: string
  7: string
  8: string
  9: string
  10: string
  11: string
  12: string
  14: string
  16: string
  20: string
  24: string
  28: string
  32: string
  36: string
  40: string
  44: string
  48: string
  52: string
  56: string
  60: string
  64: string
  72: string
  80: string
  96: string
}

// Shadow system
export interface ThemeShadows {
  sm: string
  base: string
  md: string
  lg: string
  xl: string
  '2xl': string
  inner: string
  none: string
  
  // Colored shadows
  colored: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
  }
}

// Border system
export interface ThemeBorders {
  width: {
    0: string
    1: string
    2: string
    4: string
    8: string
  }
  
  radius: {
    none: string
    sm: string
    base: string
    md: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    full: string
  }
  
  style: {
    solid: string
    dashed: string
    dotted: string
    double: string
    none: string
  }
}

// Animation system
export interface ThemeAnimations {
  duration: {
    75: string
    100: string
    150: string
    200: string
    300: string
    500: string
    700: string
    1000: string
  }
  
  timing: {
    linear: string
    ease: string
    ease_in: string
    ease_out: string
    ease_in_out: string
    bounce: string
  }
  
  keyframes: {
    spin: string
    ping: string
    pulse: string
    bounce: string
    fade_in: string
    fade_out: string
    slide_in: string
    slide_out: string
    scale_in: string
    scale_out: string
  }
}

// Component-specific theming
export interface ThemeComponents {
  button: {
    variants: {
      primary: ComponentVariant
      secondary: ComponentVariant
      outline: ComponentVariant
      ghost: ComponentVariant
      link: ComponentVariant
      destructive: ComponentVariant
    }
    sizes: {
      sm: ComponentSize
      md: ComponentSize
      lg: ComponentSize
      xl: ComponentSize
    }
  }
  
  input: {
    variants: {
      default: ComponentVariant
      filled: ComponentVariant
      outline: ComponentVariant
      underline: ComponentVariant
    }
    sizes: {
      sm: ComponentSize
      md: ComponentSize
      lg: ComponentSize
    }
  }
  
  card: {
    variants: {
      default: ComponentVariant
      elevated: ComponentVariant
      outlined: ComponentVariant
      filled: ComponentVariant
    }
  }
  
  modal: {
    backdrop: string
    container: ComponentVariant
    header: ComponentVariant
    body: ComponentVariant
    footer: ComponentVariant
  }
  
  navigation: {
    sidebar: ComponentVariant
    topbar: ComponentVariant
    breadcrumb: ComponentVariant
    pagination: ComponentVariant
  }
  
  table: {
    header: ComponentVariant
    row: ComponentVariant
    cell: ComponentVariant
    striped: ComponentVariant
  }
  
  form: {
    label: ComponentVariant
    help_text: ComponentVariant
    error_text: ComponentVariant
    fieldset: ComponentVariant
  }
}

export interface ComponentVariant {
  background: string
  color: string
  border: string
  shadow?: string
  hover?: {
    background: string
    color: string
    border: string
    shadow?: string
  }
  focus?: {
    background: string
    color: string
    border: string
    shadow?: string
    outline: string
  }
  active?: {
    background: string
    color: string
    border: string
    shadow?: string
  }
  disabled?: {
    background: string
    color: string
    border: string
    opacity: number
  }
}

export interface ComponentSize {
  padding: string
  font_size: string
  line_height: string
  border_radius: string
  min_height?: string
  icon_size?: string
}

// Theme configuration
export interface ThemeConfig {
  id: string
  user_id: string
  active_theme_id: string
  auto_switch: boolean
  auto_switch_times?: {
    light_start: string // HH:MM
    dark_start: string // HH:MM
  }
  high_contrast: boolean
  reduce_motion: boolean
  custom_css?: string
  font_scale: number // 0.8 - 1.5
  created_at: string
  updated_at: string
}

// Theme preset
export interface ThemePreset {
  id: string
  name: string
  description: string
  base_theme: ThemeType
  modifications: Partial<Theme>
  preview_colors: string[]
  is_popular: boolean
  download_count: number
  rating: number
  created_by: string
  created_at: string
}

// Theme export/import
export interface ThemeExport {
  version: string
  theme: Theme
  metadata: {
    exported_at: string
    exported_by: string
    app_version: string
  }
}

export interface ThemeImport {
  file: File
  preview?: Theme
  conflicts?: string[]
  warnings?: string[]
}

// Theme validation
export interface ThemeValidation {
  is_valid: boolean
  errors: ThemeValidationError[]
  warnings: ThemeValidationWarning[]
  accessibility_score: number
  contrast_ratios: ContrastRatio[]
}

export interface ThemeValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ThemeValidationWarning {
  field: string
  message: string
  suggestion?: string
}

export interface ContrastRatio {
  foreground: string
  background: string
  ratio: number
  level: 'AA' | 'AAA' | 'fail'
  context: string
}

// Theme builder
export interface ThemeBuilder {
  base_theme: ThemeType
  current_theme: Partial<Theme>
  history: ThemeBuilderStep[]
  current_step: number
  preview_mode: boolean
}

export interface ThemeBuilderStep {
  id: string
  action: ThemeBuilderAction
  data: any
  timestamp: string
}

export enum ThemeBuilderAction {
  SET_BASE_THEME = 'set_base_theme',
  UPDATE_COLORS = 'update_colors',
  UPDATE_TYPOGRAPHY = 'update_typography',
  UPDATE_SPACING = 'update_spacing',
  UPDATE_COMPONENT = 'update_component',
  IMPORT_PRESET = 'import_preset',
  RESET = 'reset',
  UNDO = 'undo',
  REDO = 'redo'
}

// Theme marketplace
export interface ThemeMarketplace {
  featured: ThemePreset[]
  popular: ThemePreset[]
  recent: ThemePreset[]
  categories: ThemeMarketplaceCategory[]
  user_themes: ThemePreset[]
}

export interface ThemeMarketplaceCategory {
  id: string
  name: string
  description: string
  theme_count: number
  icon: string
}

// Theme analytics
export interface ThemeAnalytics {
  theme_id: string
  usage_stats: {
    total_time: number
    sessions: number
    last_used: string
    favorite: boolean
  }
  performance_metrics: {
    load_time: number
    render_time: number
    memory_usage: number
  }
  user_feedback: {
    rating: number
    comments: string[]
  }
}

// API types
export interface ThemeListParams {
  type?: ThemeType
  category?: ThemeCategory
  search?: string
  tags?: string[]
  created_by?: string
  is_system?: boolean
  page?: number
  limit?: number
  sort?: 'name' | 'created_at' | 'updated_at' | 'popularity'
  order?: 'asc' | 'desc'
}

export interface ThemeCreateRequest {
  name: string
  description?: string
  type: ThemeType
  base_theme_id?: string
  colors: ThemeColors
  typography?: Partial<ThemeTypography>
  spacing?: Partial<ThemeSpacing>
  shadows?: Partial<ThemeShadows>
  borders?: Partial<ThemeBorders>
  animations?: Partial<ThemeAnimations>
  components?: Partial<ThemeComponents>
  custom_properties?: Record<string, string>
  tags?: string[]
  category?: ThemeCategory
  is_public?: boolean
}

export interface ThemeUpdateRequest extends Partial<ThemeCreateRequest> {
  version?: string
}

export interface ThemeResponse {
  theme: Theme
  is_active: boolean
  can_edit: boolean
  can_delete: boolean
  usage_count?: number
}

export interface ThemeListResponse {
  themes: ThemeResponse[]
  total: number
  page: number
  limit: number
  has_next: boolean
  has_prev: boolean
}

// Constants
export const THEME_CONSTANTS = {
  DEFAULT_THEME_ID: 'default-light',
  SYSTEM_THEMES: ['default-light', 'default-dark', 'high-contrast'],
  MAX_CUSTOM_THEMES: 50,
  MAX_THEME_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_FORMATS: ['json', 'css', 'scss'],
  MIN_CONTRAST_RATIO: 4.5,
  PREFERRED_CONTRAST_RATIO: 7,
  FONT_SCALE_MIN: 0.8,
  FONT_SCALE_MAX: 1.5,
  ANIMATION_DURATION_MIN: 0,
  ANIMATION_DURATION_MAX: 2000,
  COLOR_PALETTE_SIZE: 11, // 50-950
  THEME_VERSION: '1.0.0'
} as const

// Default themes
export const DEFAULT_LIGHT_THEME: Partial<Theme> = {
  id: 'default-light',
  name: 'Light',
  type: ThemeType.LIGHT,
  is_default: true,
  is_system: true
}

export const DEFAULT_DARK_THEME: Partial<Theme> = {
  id: 'default-dark',
  name: 'Dark',
  type: ThemeType.DARK,
  is_default: false,
  is_system: true
}

export const HIGH_CONTRAST_THEME: Partial<Theme> = {
  id: 'high-contrast',
  name: 'High Contrast',
  type: ThemeType.HIGH_CONTRAST,
  is_default: false,
  is_system: true
}

// Type guards
export function isTheme(obj: any): obj is Theme {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'string' &&
         typeof obj.name === 'string' &&
         Object.values(ThemeType).includes(obj.type) &&
         obj.colors && typeof obj.colors === 'object'
}

export function isThemeConfig(obj: any): obj is ThemeConfig {
  return obj && typeof obj === 'object' &&
         typeof obj.id === 'string' &&
         typeof obj.user_id === 'string' &&
         typeof obj.active_theme_id === 'string'
}

export function isValidColorScale(obj: any): obj is ColorScale {
  const requiredKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  return obj && typeof obj === 'object' &&
         requiredKeys.every(key => typeof obj[key] === 'string' && obj[key].match(/^#[0-9A-Fa-f]{6}$/))
}

// Utility functions
export function generateColorScale(baseColor: string): ColorScale {
  // This would typically use a color manipulation library
  // For now, returning a placeholder
  return {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: baseColor,
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  }
}

export function calculateContrastRatio(foreground: string, background: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color library
  return 4.5 // Placeholder
}

export function validateTheme(theme: Partial<Theme>): ThemeValidation {
  const errors: ThemeValidationError[] = []
  const warnings: ThemeValidationWarning[] = []
  
  // Basic validation
  if (!theme.name) {
    errors.push({ field: 'name', message: 'Theme name is required', severity: 'error' })
  }
  
  if (!theme.type || !Object.values(ThemeType).includes(theme.type)) {
    errors.push({ field: 'type', message: 'Valid theme type is required', severity: 'error' })
  }
  
  // Color validation
  if (!theme.colors) {
    errors.push({ field: 'colors', message: 'Theme colors are required', severity: 'error' })
  }
  
  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    accessibility_score: 85, // Placeholder
    contrast_ratios: [] // Placeholder
  }
}

export function mergeThemes(baseTheme: Theme, overrides: Partial<Theme>): Theme {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography
    },
    components: {
      ...baseTheme.components,
      ...overrides.components
    }
  }
}

export function exportTheme(theme: Theme): ThemeExport {
  return {
    version: THEME_CONSTANTS.THEME_VERSION,
    theme,
    metadata: {
      exported_at: new Date().toISOString(),
      exported_by: 'system',
      app_version: '1.0.0'
    }
  }
}

export function generateThemeCSS(theme: Theme): string {
  // Generate CSS custom properties from theme
  let css = ':root {\n'
  
  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    css += `  --color-primary-${key}: ${value};\n`
  })
  
  // Typography
  css += `  --font-family-sans: ${theme.typography.font_families.sans.join(', ')};\n`
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`
  })
  
  css += '}\n'
  
  return css
}

export function parseThemeFromCSS(css: string): Partial<Theme> {
  // Parse CSS custom properties back to theme object
  // This is a simplified implementation
  return {
    name: 'Imported Theme',
    type: ThemeType.CUSTOM
  }
}