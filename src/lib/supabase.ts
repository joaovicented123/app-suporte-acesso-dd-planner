import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Função helper para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '')
}

// Criar cliente apenas se as variáveis estiverem configuradas
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-client-info': 'ddplanner-web'
        }
      }
    })
  : null

// Função helper para executar operações do Supabase com tratamento de erro robusto
export const executeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: () => T,
  operationName = 'Operação Supabase'
): Promise<T | null> => {
  if (!isSupabaseConfigured() || !supabase) {
    console.log(`⚠️ [SUPABASE] ${operationName}: Supabase não configurado, usando fallback`)
    return fallback ? fallback() : null
  }

  try {
    const result = await operation()
    return result
  } catch (error: any) {
    // Verificar se é erro de rede específico (mais abrangente)
    const isNetworkError = 
      error?.message?.includes('Failed to fetch') || 
      error?.message?.includes('Network Error') ||
      error?.message?.includes('fetch is not defined') ||
      error?.message?.includes('TypeError: Failed to fetch') ||
      error?.code === 'NETWORK_ERROR' ||
      error?.name === 'TypeError' ||
      (typeof navigator !== 'undefined' && !navigator?.onLine)

    if (isNetworkError) {
      console.log(`🌐 [SUPABASE] ${operationName}: Erro de conectividade detectado, usando fallback`)
      return fallback ? fallback() : null
    }

    // Para outros erros, logar mas não quebrar a aplicação
    console.log(`⚠️ [SUPABASE] ${operationName}: Erro não relacionado à rede, usando fallback:`, {
      message: error?.message || 'Erro desconhecido',
      code: error?.code || 'N/A',
      name: error?.name || 'N/A'
    })
    return fallback ? fallback() : null
  }
}