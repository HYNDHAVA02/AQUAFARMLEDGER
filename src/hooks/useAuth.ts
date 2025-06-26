import { useEffect, useState, useRef } from 'react'
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
  exists: boolean
  created_at: string
  updated_at: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const initializationCompleteRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const getUserPromise = supabase.auth.getUser()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 10000)
        )
        
        const { data: { user }, error } = await Promise.race([getUserPromise, timeoutPromise]) as any
        
        if (!isMounted) return
        
        if (error) {
          if (error.message === 'Auth check timeout' || error.name === 'NetworkError') {
            const { data: { session } } = await supabase.auth.getSession()
            
            if (session?.user) {
              setSession(session)
              setUser(session.user)
              await fetchProfile(session.user.id)
              return
            }
          }
          
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (user) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!isMounted) return
          
          setSession(session)
          setUser(user)
          await fetchProfile(user.id)
        } else {
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } catch (err) {
        if (!isMounted) return
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            setSession(session)
            setUser(session.user)
            await fetchProfile(session.user.id)
          } else {
            setSession(null)
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        } catch (fallbackError) {
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } finally {
        initializationCompleteRef.current = true
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setProfile(null)
        setFetchingProfile(false)
        setLoading(false)
        setSigningOut(false)
      } else if (session?.user) {
        if (event === 'SIGNED_IN' && initializationCompleteRef.current) {
          await fetchProfile(session.user.id)
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    if (fetchingProfile) return
    
    setFetchingProfile(true)
    
    const maxTimeout = setTimeout(() => {
      setFetchingProfile(false)
      setLoading(false)
    }, 10000)
    
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile(null)
        } else {
          if (!profile) {
            setProfile(null)
          }
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      if (!profile) {
        setProfile(null)
      }
    } finally {
      clearTimeout(maxTimeout)
      setFetchingProfile(false)
      setLoading(false)
    }
  }

  const signOut = async () => {
    setSigningOut(true)
    
    try {
      setProfile(null)
      setFetchingProfile(false)
      setLoading(false)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        if (error.message?.includes('Auth session missing') || 
            error.message?.includes('session_not_found') ||
            error.name === 'AuthSessionMissingError') {
          // Session already invalid, treat as successful logout
        } else {
          throw error
        }
      }
    } catch (error) {
      // Always clear local state regardless of API success/failure
    } finally {
      setSession(null)
      setUser(null)
      setProfile(null)
      setFetchingProfile(false)
      setLoading(false)
      setSigningOut(false)
      
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-bbvnrikrrlhvrxvbxyry-auth-token')
        sessionStorage.clear()
      } catch (storageError) {
        // Ignore storage clear errors
      }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { data: null, error: new Error('No user session') }
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.user || session.user.id !== user.id) {
      return { data: null, error: new Error('Invalid session') }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: new Error('Profile not found') }
        }
        throw error
      }

      setProfile(data)
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  const needsProfile = !!session && (!profile || !profile.exists) && !loading && !fetchingProfile && !signingOut
  const isFullyReady = !!session && !!profile && profile.exists

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
    isAuthenticated: !!session,
    needsProfile,
    isFullyReady
  }
}