'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, AlertCircle, Play, Database, Mail, Webhook } from 'lucide-react'

interface TestResult {
  success: boolean
  message?: string
  error?: string
  webhookResponse?: any
  testData?: any
  timestamp: string
}

export default function AdminPage() {
  const [connectivityResult, setConnectivityResult] = useState<TestResult | null>(null)
  const [webhookResult, setWebhookResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)

  const testConnectivity = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'GET'
      })
      const result = await response.json()
      setConnectivityResult(result)
    } catch (error) {
      setConnectivityResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const testWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-webhook', {
        method: 'POST'
      })
      const result = await response.json()
      setWebhookResult(result)
    } catch (error) {
      setWebhookResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const ResultCard = ({ title, result, icon }: { title: string, result: TestResult | null, icon: React.ReactNode }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          {result ? `Testado em ${new Date(result.timestamp).toLocaleString('pt-BR')}` : 'Não testado ainda'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? 'Sucesso' : 'Falha'}
              </Badge>
            </div>
            
            {result.message && (
              <p className="text-sm text-green-600">{result.message}</p>
            )}
            
            {result.error && (
              <p className="text-sm text-red-600">{result.error}</p>
            )}
            
            {result.webhookResponse && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Resposta do Webhook:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.webhookResponse, null, 2)}
                </pre>
              </div>
            )}
            
            {result.testData && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Dados de Teste Enviados:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.testData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <span>Clique no botão de teste para verificar</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel de Administração - HotMart Integration</h1>
        <p className="text-gray-600">
          Teste e monitore a integração com o webhook da HotMart
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Informações da Integração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">URL do Webhook:</h3>
              <code className="bg-gray-100 px-3 py-1 rounded text-sm">
                https://ddplanner.lasy.pro/api/webhook
              </code>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Eventos Suportados:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">PURCHASE_APPROVED</Badge>
                <Badge variant="outline">PURCHASE_COMPLETE</Badge>
                <Badge variant="outline">PURCHASE_CANCELLED</Badge>
                <Badge variant="outline">PURCHASE_REFUNDED</Badge>
                <Badge variant="outline">SUBSCRIPTION_CANCELLATION</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Funcionalidades:</h3>
              <ul className="text-sm space-y-1">
                <li>✅ Criação automática de usuários</li>
                <li>✅ Geração de senhas aleatórias</li>
                <li>✅ Envio de emails com credenciais</li>
                <li>✅ Gerenciamento de assinaturas</li>
                <li>✅ Log completo de webhooks</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 mb-8">
        <div className="flex gap-4">
          <Button 
            onClick={testConnectivity} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            {loading ? 'Testando...' : 'Testar Conectividade'}
          </Button>
          
          <Button 
            onClick={testWebhook} 
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Testando...' : 'Simular Webhook'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <ResultCard 
          title="Teste de Conectividade" 
          result={connectivityResult}
          icon={<Database className="w-5 h-5" />}
        />
        
        <ResultCard 
          title="Teste de Webhook" 
          result={webhookResult}
          icon={<Mail className="w-5 h-5" />}
        />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Como usar:
        </h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li><strong>Teste de Conectividade:</strong> Verifica se o banco de dados está funcionando</li>
          <li><strong>Simular Webhook:</strong> Simula uma compra da HotMart para testar todo o fluxo</li>
          <li>Verifique os logs no console do navegador para mais detalhes</li>
          <li>Se tudo funcionar, configure o webhook na HotMart com a URL acima</li>
        </ol>
      </div>
    </div>
  )
}