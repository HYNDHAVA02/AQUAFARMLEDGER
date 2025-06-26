import { useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  farm_name: string | null
  location: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingProfile, setFetchingProfile] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous profile fetches
    if (fetchingProfile) return
    
    setFetchingProfile(true)
    
    try {
      // Simple profile fetch with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const { data, error } = await Promise.race([profilePromise, timeoutPromise])

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile(null) // No profile found
        }
        // Keep existing profile on other errors
      } else {
        setProfile(data)
      }
    } catch (error) {
      // Keep existing profile on timeout/error
    } finally {
      setFetchingProfile(false)
      setLoading(false)
    }
  }, [fetchingProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('Session check failed:', err)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error: error as Error }
    }
  }

  const needsProfile = !!session && (!profile || !profile.full_name || !profile.farm_name)

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
    isAuthenticated: !!session,
    needsProfile
  }
}