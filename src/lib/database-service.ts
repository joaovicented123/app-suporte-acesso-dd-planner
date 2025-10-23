import { createClient } from '@supabase/supabase-js'
import { User, Subscription, WebhookLog } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Verificar se as variáveis estão configuradas
const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseServiceKey && supabaseUrl !== '' && supabaseServiceKey !== '')
}

// Cliente com service role para operações administrativas
let supabaseAdmin: any = null

// Inicializar cliente apenas se configurado e não estiver em build time
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
  if (isSupabaseConfigured()) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    } catch (error) {
      console.error('Erro ao inicializar cliente Supabase:', error)
      supabaseAdmin = null
    }
  } else {
    console.log('⚠️ Supabase não configurado - operações de banco serão simuladas')
  }
}

// Helper para executar operações com fallback
const executeWithFallback = async <T>(
  operation: () => Promise<T>,
  fallback: () => T,
  operationName: string
): Promise<T> => {
  if (!supabaseAdmin) {
    console.log(`⚠️ [DATABASE] ${operationName}: Supabase não configurado, usando fallback`)
    return fallback()
  }

  try {
    return await operation()
  } catch (error) {
    console.error(`❌ [DATABASE] ${operationName}:`, error)
    return fallback()
  }
}

export class DatabaseService {
  // Usuários
  static async createUser(email: string, passwordHash: string, name: string): Promise<User | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('users')
          .insert({
            email,
            password_hash: passwordHash,
            name
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar usuário:', error)
          return null
        }

        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Usuário criado (simulado): ${email}`)
        return {
          id: `user_${Date.now()}`,
          email,
          name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as User
      },
      'createUser'
    )
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error) return null
        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Busca de usuário (simulado): ${email}`)
        return null
      },
      'getUserByEmail'
    )
  }

  static async getUserById(id: string): Promise<User | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        if (error) return null
        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Busca de usuário por ID (simulado): ${id}`)
        return null
      },
      'getUserById'
    )
  }

  static async getUserWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*, password_hash')
          .eq('email', email)
          .single()

        if (error) return null
        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Busca de usuário com senha (simulado): ${email}`)
        return null
      },
      'getUserWithPassword'
    )
  }

  // Assinaturas
  static async createSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar assinatura:', error)
          return null
        }

        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Assinatura criada (simulado):`, subscriptionData.hotmart_transaction_id)
        return {
          id: `sub_${Date.now()}`,
          ...subscriptionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Subscription
      },
      'createSubscription'
    )
  }

  static async getActiveSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) return null
        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Busca de assinatura ativa (simulado): ${userId}`)
        return null
      },
      'getActiveSubscriptionByUserId'
    )
  }

  static async getSubscriptionByTransactionId(transactionId: string): Promise<Subscription | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('hotmart_transaction_id', transactionId)
          .single()

        if (error) return null
        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Busca de assinatura por transação (simulado): ${transactionId}`)
        return null
      },
      'getSubscriptionByTransactionId'
    )
  }

  static async updateSubscriptionStatus(
    transactionId: string, 
    status: Subscription['status'],
    endDate?: string
  ): Promise<boolean> {
    return executeWithFallback(
      async () => {
        const updateData: any = { status }
        if (endDate) updateData.end_date = endDate

        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update(updateData)
          .eq('hotmart_transaction_id', transactionId)

        return !error
      },
      () => {
        console.log(`📝 [FALLBACK] Atualização de status (simulado): ${transactionId} -> ${status}`)
        return true
      },
      'updateSubscriptionStatus'
    )
  }

  static async getExpiredSubscriptions(): Promise<Subscription[]> {
    return executeWithFallback(
      async () => {
        const now = new Date().toISOString()
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('status', 'active')
          .lt('end_date', now)

        if (error) return []
        return data || []
      },
      () => {
        console.log(`📝 [FALLBACK] Busca de assinaturas expiradas (simulado)`)
        return []
      },
      'getExpiredSubscriptions'
    )
  }

  // Webhook Logs
  static async createWebhookLog(logData: Partial<WebhookLog>): Promise<WebhookLog | null> {
    return executeWithFallback(
      async () => {
        const { data, error } = await supabaseAdmin
          .from('webhook_logs')
          .insert(logData)
          .select()
          .single()

        if (error) {
          console.error('Erro ao criar log de webhook:', error)
          return null
        }

        return data
      },
      () => {
        console.log(`📝 [FALLBACK] Log de webhook criado (simulado):`, logData.event_type)
        return {
          id: `log_${Date.now()}`,
          ...logData,
          created_at: new Date().toISOString()
        } as WebhookLog
      },
      'createWebhookLog'
    )
  }

  static async markWebhookLogAsProcessed(id: string, errorMessage?: string): Promise<boolean> {
    return executeWithFallback(
      async () => {
        const updateData: any = { processed: true }
        if (errorMessage) updateData.error_message = errorMessage

        const { error } = await supabaseAdmin
          .from('webhook_logs')
          .update(updateData)
          .eq('id', id)

        return !error
      },
      () => {
        console.log(`📝 [FALLBACK] Log marcado como processado (simulado): ${id}`)
        return true
      },
      'markWebhookLogAsProcessed'
    )
  }

  // Limpeza e manutenção
  static async expireOldSubscriptions(): Promise<number> {
    return executeWithFallback(
      async () => {
        const expiredSubscriptions = await this.getExpiredSubscriptions()
        
        for (const subscription of expiredSubscriptions) {
          await this.updateSubscriptionStatus(
            subscription.hotmart_transaction_id!,
            'expired'
          )
        }

        return expiredSubscriptions.length
      },
      () => {
        console.log(`📝 [FALLBACK] Expiração de assinaturas antigas (simulado)`)
        return 0
      },
      'expireOldSubscriptions'
    )
  }
}