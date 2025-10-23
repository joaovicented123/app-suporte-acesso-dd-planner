'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, executeSupabaseOperation, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      console.log('⚠️ [AUTH] Supabase não configurado, modo offline')
      setLoading(false)
      return
    }

    // Verificar sessão atual com tratamento de erro robusto
    const checkSession = async () => {
      try {
        const session = await executeSupabaseOperation(
          async () => {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) throw error
            return session
          },
          () => null,
          'Verificar sessão atual'
        )
        
        setUser(session?.user ?? null)
      } catch (error) {
        console.log('🌐 [AUTH] Erro ao verificar sessão, continuando sem autenticação:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Escutar mudanças de autenticação com tratamento de erro robusto
    const setupAuthListener = async () => {
      try {
        // Verificar se o cliente Supabase está disponível antes de configurar listener
        if (!supabase?.auth) {
          console.log('⚠️ [AUTH] Cliente Supabase não disponível, pulando listener')
          setLoading(false)
          return () => {}
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            console.log(`🔐 [AUTH] Evento de autenticação: ${event}`)
            setUser(session?.user ?? null)
            setLoading(false)
            
            // Redirecionar após login bem-sucedido
            if (event === 'SIGNED_IN' && session?.user) {
              router.push('/dashboard')
            }
            
            // Redirecionar após logout
            if (event === 'SIGNED_OUT') {
              router.push('/')
            }
          } catch (error) {
            console.log('🌐 [AUTH] Erro ao processar evento de autenticação:', error)
          }
        })

        return () => {
          try {
            subscription?.unsubscribe()
          } catch (error) {
            console.log('🌐 [AUTH] Erro ao cancelar subscription:', error)
          }
        }
      } catch (error) {
        console.log('🌐 [AUTH] Erro ao configurar listener de autenticação:', error)
        setLoading(false)
        return () => {}
      }
    }

    const unsubscribePromise = setupAuthListener()
    return () => {
      unsubscribePromise.then(fn => {
        try {
          fn()
        } catch (error) {
          console.log('🌐 [AUTH] Erro ao executar cleanup:', error)
        }
      }).catch(error => {
        console.log('🌐 [AUTH] Erro no cleanup promise:', error)
      })
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado. Configure suas credenciais para fazer login.')
    }

    const result = await executeSupabaseOperation(
      async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        return true
      },
      () => { throw new Error('Erro de conectividade. Verifique sua conexão com a internet.') },
      'Login'
    )

    if (!result) {
      throw new Error('Não foi possível fazer login. Verifique sua conexão.')
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado. Configure suas credenciais para criar conta.')
    }

    const result = await executeSupabaseOperation(
      async () => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) throw error
        return true
      },
      () => { throw new Error('Erro de conectividade. Verifique sua conexão com a internet.') },
      'Cadastro'
    )

    if (!result) {
      throw new Error('Não foi possível criar conta. Verifique sua conexão.')
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      // Se Supabase não está configurado, apenas limpar estado local
      setUser(null)
      return
    }

    const result = await executeSupabaseOperation(
      async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return true
      },
      () => {
        // Fallback: limpar estado local mesmo se Supabase falhar
        setUser(null)
        return true
      },
      'Logout'
    )

    // Garantir que o usuário seja deslogado localmente
    if (!result) {
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}