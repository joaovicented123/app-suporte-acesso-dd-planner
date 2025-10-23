import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database-service'

export async function GET() {
  try {
    console.log('🧪 Iniciando teste de conectividade...')
    
    // Testar conectividade tentando buscar um usuário (operação segura)
    await DatabaseService.getUserByEmail('test@connectivity.check')
    
    return NextResponse.json({
      success: true,
      message: 'Conectividade testada com sucesso!',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Simulando webhook da HotMart...')
    
    // Dados de teste simulando uma compra da HotMart
    const testWebhookData = {
      event: 'PURCHASE_APPROVED',
      version: '2.0.0',
      data: {
        product: {
          id: 123456,
          name: 'DDPlanner - Teste'
        },
        buyer: {
          email: 'teste@exemplo.com',
          name: 'Usuário Teste'
        },
        purchase: {
          transaction: `TEST_${Date.now()}`,
          status: 'approved',
          approved_date: Date.now(),
          price: {
            value: 97.00,
            currency_code: 'BRL'
          },
          offer: {
            code: 'fshe1odk' // Código para plano mensal
          },
          subscription: {
            subscriber_code: `SUB_${Date.now()}`,
            plan: {
              name: 'Plano Mensal',
              id: 1
            },
            status: 'active',
            charge_type: 'RECURRENCE'
          }
        }
      }
    }

    // Fazer requisição para o webhook real
    const webhookUrl = `${request.nextUrl.origin}/api/webhook`
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookData)
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      webhookResponse: result,
      testData: testWebhookData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no teste do webhook:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}