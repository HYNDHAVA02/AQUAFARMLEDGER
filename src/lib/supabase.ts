import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          farm_name: string | null
          location: string | null
          avatar_url: string | null
          exists: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          farm_name?: string | null
          location?: string | null
          avatar_url?: string | null
          exists?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          farm_name?: string | null
          location?: string | null
          avatar_url?: string | null
          exists?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ponds: {
        Row: {
          id: string
          user_id: string
          name: string
          size: number
          location: string
          lease_amount: number
          monthly_expense_budget: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          size: number
          location: string
          lease_amount: number
          monthly_expense_budget: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          size?: number
          location?: string
          lease_amount?: number
          monthly_expense_budget?: number
          created_at?: string
          updated_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          is_recurring: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_recurring: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_recurring?: boolean
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          pond_id: string
          category_id: string
          amount: number
          date: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pond_id: string
          category_id: string
          amount: number
          date: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pond_id?: string
          category_id?: string
          amount?: number
          date?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}