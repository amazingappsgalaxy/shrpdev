// Application configuration
export const config = {

  // App Configuration
  app: {
    name: 'Sharpii.ai',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
  },
  
  // Security Configuration
  security: {
    sessionSecret: process.env.NEXTAUTH_SECRET || 'your-session-secret-here',
    bcryptRounds: 12,
    sessionMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 10,
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'your-database-url-here',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key',
  },
  
  // AI Services Configuration
  ai: {
    replicate: {
      apiToken: process.env.REPLICATE_API_TOKEN || '',
      timeout: 300000, // 5 minutes
      retries: 3
    },
    runninghub: {
      apiToken: process.env.RUNNINGHUB_API_KEY || '',
      baseUrl: process.env.RUNNINGHUB_BASE_URL || 'https://www.runninghub.ai',
      timeout: 300000, // 5 minutes
      retries: 3,
    }
  }
}

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  config.security.sessionSecret = process.env.NEXTAUTH_SECRET || 'production-secret-required';
  config.app.url = process.env.NEXTAUTH_URL || 'https://your-domain.com';
  
  // In production, require proper environment variables
  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('⚠️ REPLICATE_API_TOKEN not set in production environment');
  }
  if (!process.env.RUNNINGHUB_API_KEY) {
    console.warn('⚠️ RUNNINGHUB_API_KEY not set in production environment');
  }
}

