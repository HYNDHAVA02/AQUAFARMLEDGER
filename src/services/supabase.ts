import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Tables = Database['public']['Tables']
type Pond = Tables['ponds']['Row']
type PondInsert = Tables['ponds']['Insert']
type PondUpdate = Tables['ponds']['Update']
type Expense = Tables['expenses']['Row']
type ExpenseInsert = Tables['expenses']['Insert']
type ExpenseUpdate = Tables['expenses']['Update']
type ExpenseCategory = Tables['expense_categories']['Row']
type Profile = Tables['profiles']['Row']

// Pond Services
export const pondService = {
  async getAll(): Promise<Pond[]> {
    const { data, error } = await supabase
      .from('ponds')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching ponds: ${error.message}`);
    return data || []
  },

  async create(pond: Omit<PondInsert, 'user_id'>): Promise<Pond> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session?.user) {
      throw new Error('No active session. Please log in again.')
    }

    const pondData = { 
      ...pond, 
      user_id: session.user.id
    };

    const { data, error } = await supabase
      .from('ponds')
      .insert(pondData)
      .select()
      .single()

    if (error) {
      if (error.code === '23503') {
        throw new Error('Failed to create pond. Please ensure all related data (like your profile) is correct.');
      } else if (error.code === '42501') {
        throw new Error('Permission denied. RLS policy issue.');
      } else if (error.code === '23502') {
        throw new Error('Required field missing or null.');
      } else {
        throw new Error(`Error creating pond: ${error.message}`);
      }
    }
    
    return data
  },

  async update(id: string, updates: PondUpdate): Promise<Pond> {
    const { data, error } = await supabase
      .from('ponds')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating pond ${id}: ${error.message}`);
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ponds')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting pond ${id}: ${error.message}`);
  }
}

// Expense Services
export const expenseService = {
  async getAll(): Promise<(Expense & { pond_name: string; category_name: string })[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        ponds(name),
        expense_categories(name)
      `)
      .order('date', { ascending: false })

    if (error) throw new Error(`Error fetching expenses: ${error.message}`);
    
    return (data || []).map(expense => ({
      ...expense,
      pond_name: (expense as { ponds?: { name: string } }).ponds?.name || '',
      category_name: (expense as { expense_categories?: { name: string } }).expense_categories?.name || ''
    }))
  },

  async getByPond(pondId: string): Promise<(Expense & { category_name: string })[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_categories(name)
      `)
      .eq('pond_id', pondId)
      .order('date', { ascending: false })

    if (error) throw new Error(`Error fetching expenses for pond ${pondId}: ${error.message}`);
    
    return (data || []).map(expense => ({
      ...expense,
      category_name: (expense as { expense_categories?: { name: string } }).expense_categories?.name || ''
    }))
  },

  async create(expense: Omit<ExpenseInsert, 'user_id'>): Promise<Expense> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session?.user) {
      throw new Error('No active session. Please log in again.')
    }

    const expenseData = { ...expense, user_id: session.user.id };

    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single()

    if (error) {
      if (error.code === '23503') {
        throw new Error('Failed to create expense. Please ensure the selected pond and category exist.');
      } else if (error.code === '42501') {
        throw new Error('Permission denied. RLS policy issue.');
      } else {
        throw new Error(`Error creating expense: ${error.message}`);
      }
    }

    return data
  },

  async update(id: string, updates: ExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating expense ${id}: ${error.message}`);
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting expense ${id}: ${error.message}`);
  },

  // Analytics functions
  async getMonthlyTotals(year: number): Promise<{ month: string; amount: number }[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount, date')
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)

    if (error) throw new Error(`Error fetching monthly totals: ${error.message}`);

    // Group by month
    const monthlyTotals = (data || []).reduce((acc, expense) => {
      const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short' })
      acc[month] = (acc[month] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyTotals).map(([month, amount]) => ({
      month,
      amount
    }))
  },

  async getCategoryBreakdown(): Promise<{ name: string; value: number; color: string }[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        amount,
        expense_categories(name)
      `)

    if (error) throw new Error(`Error fetching category breakdown: ${error.message}`);

    const colors = ['#2196F3', '#009688', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#795548']
    
    const categoryTotals = (data || []).reduce((acc, expense) => {
      const categoryName = (expense as any).expense_categories?.name || 'Other';
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))
  }
}

// Expense Category Services
export const expenseCategoryService = {
  async getAll(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name')

    if (error) throw new Error(`Error fetching expense categories: ${error.message}`);
    return data || []
  }
}

// Profile Services
export const profileService = {
  async getCurrent(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No profile found, not an error
      throw new Error(`Error fetching profile: ${error.message}`);
    }
    return data
  }
}

export type {
  Pond,
  PondInsert,
  PondUpdate,
  Expense,
  ExpenseInsert,
  ExpenseUpdate,
  ExpenseCategory,
  Profile
}