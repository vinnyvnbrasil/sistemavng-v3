import { createClient } from '@supabase/supabase-js'
import {
  Theme,
  ThemeConfig,
  ThemePreset,
  ThemeType,
  ThemeCategory,
  ThemeListParams,
  ThemeCreateRequest,
  ThemeUpdateRequest,
  ThemeResponse,
  ThemeListResponse,
  ThemeValidation,
  ThemeBuilder,
  ThemeBuilderStep,
  ThemeBuilderAction,
  ThemeExport,
  ThemeImport,
  ThemeAnalytics,
  ThemeMarketplace,
  THEME_CONSTANTS,
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  HIGH_CONTRAST_THEME,
  validateTheme,
  mergeThemes,
  exportTheme,
  generateThemeCSS,
  parseThemeFromCSS,
  generateColorScale,
  calculateContrastRatio
} from '@/types/theme'
import { ActivityService } from './activities'

export class ThemeService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // ActivityService is now used as static methods
  private currentTheme: Theme | null = null
  private themeConfig: ThemeConfig | null = null
  private themeBuilder: ThemeBuilder | null = null
  private cssVariables: Map<string, string> = new Map()

  // Theme Management
  async getThemes(params: ThemeListParams = {}): Promise<ThemeListResponse> {
    try {
      let query = this.supabase
        .from('themes')
        .select('*', { count: 'exact' })

      // Apply filters
      if (params.type) {
        query = query.eq('type', params.type)
      }

      if (params.category) {
        query = query.eq('category', params.category)
      }

      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      if (params.tags && params.tags.length > 0) {
        query = query.contains('tags', params.tags)
      }

      if (params.created_by) {
        query = query.eq('created_by', params.created_by)
      }

      if (params.is_system !== undefined) {
        query = query.eq('is_system', params.is_system)
      }

      // Apply sorting
      const sortField = params.sort || 'created_at'
      const sortOrder = params.order || 'desc'
      query = query.order(sortField, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const page = params.page || 1
      const limit = Math.min(params.limit || 20, 100)
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const themes: ThemeResponse[] = data?.map(theme => ({
        theme,
        is_active: theme.id === this.themeConfig?.active_theme_id,
        can_edit: !theme.is_system,
        can_delete: !theme.is_system && !theme.is_default,
        usage_count: 0 // Would be calculated from analytics
      })) || []

      return {
        themes,
        total: count || 0,
        page,
        limit,
        has_next: (count || 0) > offset + limit,
        has_prev: page > 1
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
      throw new Error('Failed to fetch themes')
    }
  }

  async getTheme(id: string): Promise<ThemeResponse | null> {
    try {
      const { data, error } = await this.supabase
        .from('themes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) return null

      return {
        theme: data,
        is_active: data.id === this.themeConfig?.active_theme_id,
        can_edit: !data.is_system,
        can_delete: !data.is_system && !data.is_default
      }
    } catch (error) {
      console.error('Error fetching theme:', error)
      return null
    }
  }

  async createTheme(request: ThemeCreateRequest, userId: string): Promise<Theme> {
    try {
      // Validate theme
      const validation = validateTheme(request)
      if (!validation.is_valid) {
        throw new Error(`Theme validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      const theme: Omit<Theme, 'id' | 'created_at' | 'updated_at'> = {
        name: request.name,
        description: request.description,
        type: request.type,
        colors: request.colors,
        typography: request.typography || this.getDefaultTypography(),
        spacing: request.spacing || this.getDefaultSpacing(),
        shadows: request.shadows || this.getDefaultShadows(),
        borders: request.borders || this.getDefaultBorders(),
        animations: request.animations || this.getDefaultAnimations(),
        components: request.components || this.getDefaultComponents(),
        custom_properties: request.custom_properties || {},
        is_default: false,
        is_system: false,
        created_by: userId,
        version: THEME_CONSTANTS.THEME_VERSION,
        tags: request.tags || [],
        category: request.category || ThemeCategory.PERSONAL
      }

      const { data, error } = await this.supabase
        .from('themes')
        .insert(theme)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Tema criado',
        userId,
        'system',
        data.id,
        {
          description: `Tema criado: ${data.name}`,
          entityName: 'theme',
          details: {
            theme_name: data.name,
            theme_type: data.type
          }
        }
      )

      return data
    } catch (error) {
      console.error('Error creating theme:', error)
      throw new Error('Failed to create theme')
    }
  }

  async updateTheme(id: string, request: ThemeUpdateRequest, userId: string): Promise<Theme> {
    try {
      // Check if theme exists and user can edit
      const existingTheme = await this.getTheme(id)
      if (!existingTheme) {
        throw new Error('Theme not found')
      }

      if (!existingTheme.can_edit) {
        throw new Error('Cannot edit system theme')
      }

      // Validate updates
      const updatedTheme = { ...existingTheme.theme, ...request }
      const validation = validateTheme(updatedTheme)
      if (!validation.is_valid) {
        throw new Error(`Theme validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      const { data, error } = await this.supabase
        .from('themes')
        .update({
          ...request,
          updated_at: new Date().toISOString(),
          version: request.version || THEME_CONSTANTS.THEME_VERSION
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Tema atualizado',
        userId,
        'system',
        id,
        {
          description: `Tema atualizado: ${data.name}`,
          entityName: 'theme',
          details: {
            theme_name: data.name,
            changes: Object.keys(request)
          }
        }
      )

      // Update current theme if it's active
      if (this.currentTheme?.id === id) {
        this.currentTheme = data
        await this.applyTheme(data)
      }

      return data
    } catch (error) {
      console.error('Error updating theme:', error)
      throw new Error('Failed to update theme')
    }
  }

  async deleteTheme(id: string, userId: string): Promise<void> {
    try {
      // Check if theme exists and can be deleted
      const theme = await this.getTheme(id)
      if (!theme) {
        throw new Error('Theme not found')
      }

      if (!theme.can_delete) {
        throw new Error('Cannot delete system or default theme')
      }

      // Check if theme is currently active
      if (theme.is_active) {
        throw new Error('Cannot delete active theme. Switch to another theme first.')
      }

      const { error } = await this.supabase
        .from('themes')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Tema excluído',
        userId,
        'system',
        id,
        {
          description: `Tema excluído: ${theme.theme.name}`,
          entityName: 'theme',
          details: {
            theme_name: theme.theme.name
          }
        }
      )
    } catch (error) {
      console.error('Error deleting theme:', error)
      throw new Error('Failed to delete theme')
    }
  }

  // Theme Configuration
  async getThemeConfig(userId: string): Promise<ThemeConfig> {
    try {
      const { data, error } = await this.supabase
        .from('theme_configs')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        // Create default config
        return await this.createDefaultThemeConfig(userId)
      }

      this.themeConfig = data
      return data
    } catch (error) {
      console.error('Error fetching theme config:', error)
      throw new Error('Failed to fetch theme configuration')
    }
  }

  async updateThemeConfig(userId: string, config: Partial<ThemeConfig>): Promise<ThemeConfig> {
    try {
      const { data, error } = await this.supabase
        .from('theme_configs')
        .upsert({
          user_id: userId,
          ...config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      this.themeConfig = data

      // Apply theme if changed
      if (config.active_theme_id && config.active_theme_id !== this.currentTheme?.id) {
        await this.activateTheme(config.active_theme_id, userId)
      }

      return data
    } catch (error) {
      console.error('Error updating theme config:', error)
      throw new Error('Failed to update theme configuration')
    }
  }

  // Theme Activation
  async activateTheme(themeId: string, userId: string): Promise<void> {
    try {
      const theme = await this.getTheme(themeId)
      if (!theme) {
        throw new Error('Theme not found')
      }

      // Update config
      await this.updateThemeConfig(userId, {
        active_theme_id: themeId
      })

      // Apply theme
      await this.applyTheme(theme.theme)

      // Log activity
      await ActivityService.logActivity(
        'profile_updated',
        'Tema ativado',
        userId,
        'system',
        themeId,
        {
          description: `Tema ativado: ${theme.theme.name}`,
          entityName: 'theme',
          details: {
            theme_name: theme.theme.name,
            theme_type: theme.theme.type
          }
        }
      )
    } catch (error) {
      console.error('Error activating theme:', error)
      throw new Error('Failed to activate theme')
    }
  }

  async applyTheme(theme: Theme): Promise<void> {
    try {
      this.currentTheme = theme

      // Generate CSS variables
      const css = generateThemeCSS(theme)
      
      // Apply to document
      if (typeof document !== 'undefined') {
        let styleElement = document.getElementById('theme-variables')
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = 'theme-variables'
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = css

        // Update data attributes
        document.documentElement.setAttribute('data-theme', theme.id)
        document.documentElement.setAttribute('data-theme-type', theme.type)
      }

      // Store CSS variables in memory
      this.updateCSSVariables(theme)

      // Emit theme change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('themeChanged', {
          detail: { theme }
        }))
      }
    } catch (error) {
      console.error('Error applying theme:', error)
      throw new Error('Failed to apply theme')
    }
  }

  // Theme Builder
  initializeThemeBuilder(baseTheme: ThemeType = ThemeType.LIGHT): ThemeBuilder {
    const baseThemeData = this.getBaseTheme(baseTheme)
    
    this.themeBuilder = {
      base_theme: baseTheme,
      current_theme: { ...baseThemeData },
      history: [],
      current_step: -1,
      preview_mode: false
    }

    return this.themeBuilder
  }

  updateThemeBuilder(action: ThemeBuilderAction, data: any): ThemeBuilder {
    if (!this.themeBuilder) {
      throw new Error('Theme builder not initialized')
    }

    const step: ThemeBuilderStep = {
      id: crypto.randomUUID(),
      action,
      data,
      timestamp: new Date().toISOString()
    }

    // Remove future steps if we're not at the end
    if (this.themeBuilder.current_step < this.themeBuilder.history.length - 1) {
      this.themeBuilder.history = this.themeBuilder.history.slice(0, this.themeBuilder.current_step + 1)
    }

    // Add new step
    this.themeBuilder.history.push(step)
    this.themeBuilder.current_step++

    // Apply the change
    this.applyBuilderAction(action, data)

    return this.themeBuilder
  }

  undoThemeBuilder(): ThemeBuilder {
    if (!this.themeBuilder || this.themeBuilder.current_step < 0) {
      throw new Error('Nothing to undo')
    }

    this.themeBuilder.current_step--
    this.rebuildThemeFromHistory()

    return this.themeBuilder
  }

  redoThemeBuilder(): ThemeBuilder {
    if (!this.themeBuilder || this.themeBuilder.current_step >= this.themeBuilder.history.length - 1) {
      throw new Error('Nothing to redo')
    }

    this.themeBuilder.current_step++
    const step = this.themeBuilder.history[this.themeBuilder.current_step]
    this.applyBuilderAction(step.action, step.data)

    return this.themeBuilder
  }

  async previewTheme(theme: Partial<Theme>): Promise<void> {
    if (!this.themeBuilder) {
      throw new Error('Theme builder not initialized')
    }

    const previewTheme = mergeThemes(
      this.getBaseTheme(this.themeBuilder.base_theme),
      theme
    )

    this.themeBuilder.preview_mode = true
    await this.applyTheme(previewTheme)
  }

  async stopPreview(): Promise<void> {
    if (!this.themeBuilder) return

    this.themeBuilder.preview_mode = false
    
    if (this.currentTheme) {
      await this.applyTheme(this.currentTheme)
    }
  }

  // Theme Import/Export
  async exportTheme(themeId: string): Promise<ThemeExport> {
    try {
      const themeResponse = await this.getTheme(themeId)
      if (!themeResponse) {
        throw new Error('Theme not found')
      }

      return exportTheme(themeResponse.theme)
    } catch (error) {
      console.error('Error exporting theme:', error)
      throw new Error('Failed to export theme')
    }
  }

  async importTheme(file: File, userId: string): Promise<Theme> {
    try {
      const content = await file.text()
      let themeData: ThemeExport

      try {
        themeData = JSON.parse(content)
      } catch {
        throw new Error('Invalid theme file format')
      }

      // Validate imported theme
      const validation = validateTheme(themeData.theme)
      if (!validation.is_valid) {
        throw new Error(`Invalid theme: ${validation.errors.map(e => e.message).join(', ')}`)
      }

      // Create new theme with imported data
      const importedTheme = {
        ...themeData.theme,
        id: undefined, // Let database generate new ID
        name: `${themeData.theme.name} (Imported)`,
        created_by: userId,
        is_system: false,
        is_default: false,
        created_at: undefined,
        updated_at: undefined
      }

      return await this.createTheme(importedTheme, userId)
    } catch (error) {
      console.error('Error importing theme:', error)
      throw new Error('Failed to import theme')
    }
  }

  // Theme Marketplace
  async getMarketplace(): Promise<ThemeMarketplace> {
    try {
      const [featured, popular, recent] = await Promise.all([
        this.getThemes({ is_system: false, sort: 'popularity', limit: 10 }),
        this.getThemes({ is_system: false, sort: 'popularity', limit: 20 }),
        this.getThemes({ is_system: false, sort: 'created_at', limit: 20 })
      ])

      return {
        featured: featured.themes.map(t => this.themeToPreset(t.theme)),
        popular: popular.themes.map(t => this.themeToPreset(t.theme)),
        recent: recent.themes.map(t => this.themeToPreset(t.theme)),
        categories: [
          { id: 'official', name: 'Official', description: 'Official themes', theme_count: 0, icon: 'star' },
          { id: 'community', name: 'Community', description: 'Community themes', theme_count: 0, icon: 'users' },
          { id: 'personal', name: 'Personal', description: 'Personal themes', theme_count: 0, icon: 'user' }
        ],
        user_themes: []
      }
    } catch (error) {
      console.error('Error fetching marketplace:', error)
      throw new Error('Failed to fetch theme marketplace')
    }
  }

  // Analytics
  async getThemeAnalytics(themeId: string): Promise<ThemeAnalytics> {
    try {
      // This would typically fetch from analytics tables
      return {
        theme_id: themeId,
        usage_stats: {
          total_time: 0,
          sessions: 0,
          last_used: new Date().toISOString(),
          favorite: false
        },
        performance_metrics: {
          load_time: 0,
          render_time: 0,
          memory_usage: 0
        },
        user_feedback: {
          rating: 0,
          comments: []
        }
      }
    } catch (error) {
      console.error('Error fetching theme analytics:', error)
      throw new Error('Failed to fetch theme analytics')
    }
  }

  // Utility Methods
  getCurrentTheme(): Theme | null {
    return this.currentTheme
  }

  getThemeConfig(): ThemeConfig | null {
    return this.themeConfig
  }

  getCSSVariable(name: string): string | undefined {
    return this.cssVariables.get(name)
  }

  private async createDefaultThemeConfig(userId: string): Promise<ThemeConfig> {
    const config: Omit<ThemeConfig, 'id'> = {
      user_id: userId,
      active_theme_id: THEME_CONSTANTS.DEFAULT_THEME_ID,
      auto_switch: false,
      high_contrast: false,
      reduce_motion: false,
      font_scale: 1.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('theme_configs')
      .insert(config)
      .select()
      .single()

    if (error) throw error

    this.themeConfig = data
    return data
  }

  private getBaseTheme(type: ThemeType): Theme {
    switch (type) {
      case ThemeType.DARK:
        return { ...DEFAULT_DARK_THEME } as Theme
      case ThemeType.HIGH_CONTRAST:
        return { ...HIGH_CONTRAST_THEME } as Theme
      default:
        return { ...DEFAULT_LIGHT_THEME } as Theme
    }
  }

  private updateCSSVariables(theme: Theme): void {
    this.cssVariables.clear()
    
    // Store color variables
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      this.cssVariables.set(`--color-primary-${key}`, value)
    })
    
    // Store typography variables
    this.cssVariables.set('--font-family-sans', theme.typography.font_families.sans.join(', '))
    
    // Store spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      this.cssVariables.set(`--spacing-${key}`, value)
    })
  }

  private applyBuilderAction(action: ThemeBuilderAction, data: any): void {
    if (!this.themeBuilder) return

    switch (action) {
      case ThemeBuilderAction.SET_BASE_THEME:
        this.themeBuilder.base_theme = data.type
        this.themeBuilder.current_theme = { ...this.getBaseTheme(data.type) }
        break
      
      case ThemeBuilderAction.UPDATE_COLORS:
        this.themeBuilder.current_theme.colors = {
          ...this.themeBuilder.current_theme.colors,
          ...data.colors
        }
        break
      
      case ThemeBuilderAction.UPDATE_TYPOGRAPHY:
        this.themeBuilder.current_theme.typography = {
          ...this.themeBuilder.current_theme.typography,
          ...data.typography
        }
        break
      
      case ThemeBuilderAction.RESET:
        this.themeBuilder.current_theme = { ...this.getBaseTheme(this.themeBuilder.base_theme) }
        break
    }
  }

  private rebuildThemeFromHistory(): void {
    if (!this.themeBuilder) return

    // Start with base theme
    this.themeBuilder.current_theme = { ...this.getBaseTheme(this.themeBuilder.base_theme) }

    // Apply all steps up to current step
    for (let i = 0; i <= this.themeBuilder.current_step; i++) {
      const step = this.themeBuilder.history[i]
      this.applyBuilderAction(step.action, step.data)
    }
  }

  private themeToPreset(theme: Theme): ThemePreset {
    return {
      id: theme.id,
      name: theme.name,
      description: theme.description || '',
      base_theme: theme.type,
      modifications: {},
      preview_colors: [
        theme.colors.primary[500],
        theme.colors.secondary[500],
        theme.colors.accent[500]
      ],
      is_popular: false,
      download_count: 0,
      rating: 0,
      created_by: theme.created_by || 'system',
      created_at: theme.created_at
    }
  }

  private getDefaultTypography() {
    // Return default typography settings
    return {
      font_families: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      font_sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
        '7xl': '4.5rem',
        '8xl': '6rem',
        '9xl': '8rem'
      },
      font_weights: {
        thin: 100,
        extralight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900
      },
      line_heights: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2
      },
      letter_spacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em'
      }
    }
  }

  private getDefaultSpacing() {
    return {
      0: '0px',
      px: '1px',
      0.5: '0.125rem',
      1: '0.25rem',
      1.5: '0.375rem',
      2: '0.5rem',
      2.5: '0.625rem',
      3: '0.75rem',
      3.5: '0.875rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      7: '1.75rem',
      8: '2rem',
      9: '2.25rem',
      10: '2.5rem',
      11: '2.75rem',
      12: '3rem',
      14: '3.5rem',
      16: '4rem',
      20: '5rem',
      24: '6rem',
      28: '7rem',
      32: '8rem',
      36: '9rem',
      40: '10rem',
      44: '11rem',
      48: '12rem',
      52: '13rem',
      56: '14rem',
      60: '15rem',
      64: '16rem',
      72: '18rem',
      80: '20rem',
      96: '24rem'
    }
  }

  private getDefaultShadows() {
    return {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: '0 0 #0000',
      colored: {
        primary: '0 4px 14px 0 rgb(0 118 255 / 0.39)',
        secondary: '0 4px 14px 0 rgb(120 119 198 / 0.39)',
        success: '0 4px 14px 0 rgb(34 197 94 / 0.39)',
        warning: '0 4px 14px 0 rgb(251 191 36 / 0.39)',
        error: '0 4px 14px 0 rgb(239 68 68 / 0.39)'
      }
    }
  }

  private getDefaultBorders() {
    return {
      width: {
        0: '0px',
        1: '1px',
        2: '2px',
        4: '4px',
        8: '8px'
      },
      radius: {
        none: '0px',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
        double: 'double',
        none: 'none'
      }
    }
  }

  private getDefaultAnimations() {
    return {
      duration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms'
      },
      timing: {
        linear: 'linear',
        ease: 'ease',
        ease_in: 'ease-in',
        ease_out: 'ease-out',
        ease_in_out: 'ease-in-out',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      },
      keyframes: {
        spin: 'spin 1s linear infinite',
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        fade_in: 'fadeIn 0.3s ease-in-out',
        fade_out: 'fadeOut 0.3s ease-in-out',
        slide_in: 'slideIn 0.3s ease-in-out',
        slide_out: 'slideOut 0.3s ease-in-out',
        scale_in: 'scaleIn 0.3s ease-in-out',
        scale_out: 'scaleOut 0.3s ease-in-out'
      }
    }
  }

  private getDefaultComponents() {
    return {
      button: {
        variants: {
          primary: {
            background: 'var(--color-primary-500)',
            color: 'white',
            border: 'var(--color-primary-500)',
            hover: {
              background: 'var(--color-primary-600)',
              color: 'white',
              border: 'var(--color-primary-600)'
            }
          },
          secondary: {
            background: 'var(--color-secondary-500)',
            color: 'white',
            border: 'var(--color-secondary-500)'
          },
          outline: {
            background: 'transparent',
            color: 'var(--color-primary-500)',
            border: 'var(--color-primary-500)'
          },
          ghost: {
            background: 'transparent',
            color: 'var(--color-primary-500)',
            border: 'transparent'
          },
          link: {
            background: 'transparent',
            color: 'var(--color-primary-500)',
            border: 'transparent'
          },
          destructive: {
            background: 'var(--color-error-500)',
            color: 'white',
            border: 'var(--color-error-500)'
          }
        },
        sizes: {
          sm: {
            padding: 'var(--spacing-2) var(--spacing-3)',
            font_size: 'var(--font-size-sm)',
            line_height: 'var(--line-height-tight)',
            border_radius: 'var(--border-radius-sm)'
          },
          md: {
            padding: 'var(--spacing-2.5) var(--spacing-4)',
            font_size: 'var(--font-size-base)',
            line_height: 'var(--line-height-normal)',
            border_radius: 'var(--border-radius-base)'
          },
          lg: {
            padding: 'var(--spacing-3) var(--spacing-6)',
            font_size: 'var(--font-size-lg)',
            line_height: 'var(--line-height-normal)',
            border_radius: 'var(--border-radius-md)'
          },
          xl: {
            padding: 'var(--spacing-4) var(--spacing-8)',
            font_size: 'var(--font-size-xl)',
            line_height: 'var(--line-height-normal)',
            border_radius: 'var(--border-radius-lg)'
          }
        }
      },
      input: {
        variants: {
          default: {
            background: 'var(--background-primary)',
            color: 'var(--text-primary)',
            border: 'var(--border-primary)'
          },
          filled: {
            background: 'var(--background-secondary)',
            color: 'var(--text-primary)',
            border: 'transparent'
          },
          outline: {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: 'var(--border-primary)'
          },
          underline: {
            background: 'transparent',
            color: 'var(--text-primary)',
            border: 'transparent'
          }
        },
        sizes: {
          sm: {
            padding: 'var(--spacing-2)',
            font_size: 'var(--font-size-sm)',
            line_height: 'var(--line-height-tight)',
            border_radius: 'var(--border-radius-sm)'
          },
          md: {
            padding: 'var(--spacing-2.5)',
            font_size: 'var(--font-size-base)',
            line_height: 'var(--line-height-normal)',
            border_radius: 'var(--border-radius-base)'
          },
          lg: {
            padding: 'var(--spacing-3)',
            font_size: 'var(--font-size-lg)',
            line_height: 'var(--line-height-normal)',
            border_radius: 'var(--border-radius-md)'
          }
        }
      },
      card: {
        variants: {
          default: {
            background: 'var(--background-card)',
            color: 'var(--text-primary)',
            border: 'var(--border-primary)',
            shadow: 'var(--shadow-base)'
          },
          elevated: {
            background: 'var(--background-card)',
            color: 'var(--text-primary)',
            border: 'transparent',
            shadow: 'var(--shadow-lg)'
          },
          outlined: {
            background: 'var(--background-card)',
            color: 'var(--text-primary)',
            border: 'var(--border-primary)',
            shadow: 'none'
          },
          filled: {
            background: 'var(--background-secondary)',
            color: 'var(--text-primary)',
            border: 'transparent',
            shadow: 'none'
          }
        }
      },
      modal: {
        backdrop: 'rgba(0, 0, 0, 0.5)',
        container: {
          background: 'var(--background-modal)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)',
          shadow: 'var(--shadow-2xl)'
        },
        header: {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        },
        body: {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'transparent'
        },
        footer: {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: 'var(--border-primary)'
        }
      },
      navigation: {
        sidebar: {
          background: 'var(--background-secondary)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        },
        topbar: {
          background: 'var(--background-primary)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        },
        breadcrumb: {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: 'transparent'
        },
        pagination: {
          background: 'var(--background-primary)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        }
      },
      table: {
        header: {
          background: 'var(--background-secondary)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        },
        row: {
          background: 'var(--background-primary)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        },
        cell: {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        },
        striped: {
          background: 'var(--background-secondary)',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        }
      },
      form: {
        label: {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'transparent'
        },
        help_text: {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: 'transparent'
        },
        error_text: {
          background: 'transparent',
          color: 'var(--color-error-500)',
          border: 'transparent'
        },
        fieldset: {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'var(--border-primary)'
        }
      }
    }
  }
}