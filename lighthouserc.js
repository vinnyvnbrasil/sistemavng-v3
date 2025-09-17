module.exports = {
  ci: {
    collect: {
      // URLs para testar
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/produtos',
        'http://localhost:3000/vendas'
      ],
      
      // Configurações de coleta
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      
      // Configurações do Chrome
      chromePath: undefined,
      chromeFlags: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--headless'
      ],
      
      // Número de execuções por URL
      numberOfRuns: 3,
      
      // Configurações de rede
      settings: {
        // Simular conexão 3G
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        },
        
        // Configurações de dispositivo
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        
        // Configurações de auditoria
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
          'pwa'
        ],
        
        // Configurações específicas
        skipAudits: [
          'uses-http2',
          'canonical'
        ]
      }
    },
    
    assert: {
      // Assertions para Performance
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Outras métricas importantes
        'interactive': ['warn', { maxNumericValue: 3000 }],
        'max-potential-fid': ['warn', { maxNumericValue: 130 }],
        
        // Acessibilidade
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'valid-lang': 'error',
        
        // SEO
        'meta-description': 'warn',
        'document-title': 'error',
        'hreflang': 'warn',
        
        // Melhores práticas
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        
        // PWA
        'service-worker': 'warn',
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn'
      }
    },
    
    upload: {
      // Configurações de upload (desabilitado por padrão)
      target: 'temporary-public-storage',
      
      // Para usar LHCI server próprio:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-build-token'
    },
    
    server: {
      // Configurações do servidor LHCI (se usando)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    },
    
    wizard: {
      // Configurações do wizard de setup
      // Usado apenas durante configuração inicial
    }
  }
};