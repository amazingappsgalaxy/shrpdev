import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const isBrowser = typeof window !== 'undefined'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function makeThrowingClient<T>(msg: string): T {
  const handler: ProxyHandler<object> = {
    get() {
      throw new Error(msg)
    },
    apply() {
      throw new Error(msg)
    },
  }
  return new Proxy({}, handler) as unknown as T
}

const supabaseMissingMsg =
  'Supabase client not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'

// Utility JSON type compatible with Supabase typed definitions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

// Database types for Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string
          subscription_status: string
          api_usage: number
          monthly_api_limit: number
          created_at: string
          updated_at: string
          avatar_url: string
          is_email_verified: boolean
          last_login_at: string
          is_admin: boolean
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash: string
          subscription_status?: string
          api_usage?: number
          monthly_api_limit?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
          is_email_verified?: boolean
          last_login_at?: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password_hash?: string
          subscription_status?: string
          api_usage?: number
          monthly_api_limit?: number
          created_at?: string
          updated_at?: string
          avatar_url?: string
          is_email_verified?: boolean
          last_login_at?: string
          is_admin?: boolean
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          created_at: string
          user_agent: string
          ip_address: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          created_at?: string
          user_agent: string
          ip_address: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          created_at?: string
          user_agent?: string
          ip_address?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          id: string
          user_id: string
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      enhancement_tasks: {
        Row: {
          id: string
          user_id: string
          image_id: string
          original_image_url: string
          enhanced_image_url: string | null
          status: string
          progress: number
          prompt: string | null
          settings: Json | null
          model_id: string
          model_name: string | null
          provider: string
          job_id: string | null
          prediction_id: string | null
          error_message: string | null
          processing_time: number | null
          estimated_time: number | null
          credits_consumed: number | null
          task_tags: string | null
          original_width: number | null
          original_height: number | null
          original_file_size: number | null
          original_file_format: string | null
          output_width: number | null
          output_height: number | null
          output_file_size: number | null
          output_file_format: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          failed_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          image_id: string
          original_image_url: string
          enhanced_image_url?: string | null
          status?: string
          progress?: number
          prompt?: string | null
          settings?: Json | null
          model_id: string
          model_name?: string | null
          provider: string
          job_id?: string | null
          prediction_id?: string | null
          error_message?: string | null
          processing_time?: number | null
          estimated_time?: number | null
          credits_consumed?: number | null
          task_tags?: string | null
          original_width?: number | null
          original_height?: number | null
          original_file_size?: number | null
          original_file_format?: string | null
          output_width?: number | null
          output_height?: number | null
          output_file_size?: number | null
          output_file_format?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          failed_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          image_id?: string
          original_image_url?: string
          enhanced_image_url?: string | null
          status?: string
          progress?: number
          prompt?: string | null
          settings?: Json | null
          model_id?: string
          model_name?: string | null
          provider?: string
          job_id?: string | null
          prediction_id?: string | null
          error_message?: string | null
          processing_time?: number | null
          estimated_time?: number | null
          credits_consumed?: number | null
          task_tags?: string | null
          original_width?: number | null
          original_height?: number | null
          original_file_size?: number | null
          original_file_format?: string | null
          output_width?: number | null
          output_height?: number | null
          output_file_size?: number | null
          output_file_format?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          failed_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      images: {
        Row: {
          id: string
          user_id: string
          original_url: string
          enhanced_url: string | null
          filename: string
          file_size: number
          width: number
          height: number
          status: string
          enhancement_type: string
          processing_time: number
          created_at: string
          updated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          original_url: string
          enhanced_url?: string | null
          filename: string
          file_size: number
          width: number
          height: number
          status: string
          enhancement_type: string
          processing_time: number
          created_at?: string
          updated_at?: string
          metadata: Json
        }
        Update: {
          id?: string
          user_id?: string
          original_url?: string
          enhanced_url?: string | null
          filename?: string
          file_size?: number
          width?: number
          height?: number
          status?: string
          enhancement_type?: string
          processing_time?: number
          created_at?: string
          updated_at?: string
          metadata?: Json
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          image_ids: string
          status: string
          created_at: string
          updated_at: string
          settings: Json
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          image_ids: string
          status: string
          created_at?: string
          updated_at?: string
          settings: Json
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          image_ids?: string
          status?: string
          created_at?: string
          updated_at?: string
          settings?: Json
        }
        Relationships: []
      }
      credits: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          source: string
          subscription_id: string | null
          transaction_id: string | null
          expires_at: string
          is_active: boolean
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          source: string
          subscription_id?: string | null
          transaction_id?: string | null
          expires_at: string
          is_active?: boolean
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          source?: string
          subscription_id?: string | null
          transaction_id?: string | null
          expires_at?: string
          is_active?: boolean
          created_at?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      // Added payments table
      , payments: {
        Row: {
          id: string
          userId: string
          subscriptionId: string | null
          dodoPaymentId: string | null
          dodoCustomerId: string | null
          amount: number
          currency: string
          status: string
          paymentMethod: string | null
          plan: string | null
          billingPeriod: string | null
          creditsGranted: number
          paidAt: string | null
          failedAt: string | null
          createdAt: string
          updatedAt: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          userId: string
          subscriptionId?: string | null
          dodoPaymentId?: string | null
          dodoCustomerId?: string | null
          amount: number
          currency: string
          status: string
          paymentMethod?: string | null
          plan?: string | null
          billingPeriod?: string | null
          creditsGranted?: number
          paidAt?: string | null
          failedAt?: string | null
          createdAt?: string
          updatedAt?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          userId?: string
          subscriptionId?: string | null
          dodoPaymentId?: string | null
          dodoCustomerId?: string | null
          amount?: number
          currency?: string
          status?: string
          paymentMethod?: string | null
          plan?: string | null
          billingPeriod?: string | null
          creditsGranted?: number
          paidAt?: string | null
          failedAt?: string | null
          createdAt?: string
          updatedAt?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      // Added subscriptions table
      , subscriptions: {
        Row: {
          id: string
          userId: string
          plan: string
          status: string
          billingPeriod: string
          dodoSubscriptionId: string | null
          dodoCustomerId: string | null
          nextBillingDate: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          plan: string
          status?: string
          billingPeriod: string
          dodoSubscriptionId?: string | null
          dodoCustomerId?: string | null
          nextBillingDate?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          plan?: string
          status?: string
          billingPeriod?: string
          dodoSubscriptionId?: string | null
          dodoCustomerId?: string | null
          nextBillingDate?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type User = Tables<'users'>
export type Session = Tables<'sessions'>
export type EnhancementTask = Tables<'enhancement_tasks'>
export type Image = Tables<'images'>
export type Project = Tables<'projects'>
export type Credit = Tables<'credits'>

// Client for browser/client-side operations
export const supabase: SupabaseClient<Database> =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : makeThrowingClient<SupabaseClient<Database>>(supabaseMissingMsg)

// Admin client for server-side operations (use with caution). Never create on the browser.
export const supabaseAdmin: SupabaseClient<Database> | undefined = !isBrowser && supabaseUrl && supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : undefined