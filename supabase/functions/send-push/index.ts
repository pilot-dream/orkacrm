import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Tratar requisição OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse do Body
    const { user_email, title, body, url } = await req.json()

    if (!user_email) {
      return new Response(JSON.stringify({ error: 'user_email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Chaves VAPID configuradas nas variáveis de ambiente do Supabase Secrets
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const contactEmail = Deno.env.get('VAPID_SUBJECT') || 'mailto:suporte@orkacrm.com.br'

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração VAPID pendente. VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY devem estar nos Secrets do Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    webpush.setVapidDetails(contactEmail, vapidPublicKey, vapidPrivateKey)

    // 1. Buscar todas as subscrições ativas do usuário
    const { data: subscriptions, error: fetchError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_email', user_email)

    if (fetchError) throw fetchError

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum dispositivo cadastrado para este usuário.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload = JSON.stringify({
      title: title || 'Alerta ORKA CRM',
      body: body || 'Nova mensagem de sistema.',
      url: url || '/'
    })

    const results = []
    const expiredEndpoints: string[] = []

    // 2. Enviar notificação para cada dispositivo
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        await webpush.sendNotification(pushSubscription, payload)
        results.push({ endpoint: sub.endpoint, status: 'success' })
      } catch (err: any) {
        console.error(`Erro ao enviar notificação para ${sub.endpoint}:`, err)
        results.push({ endpoint: sub.endpoint, status: 'failed', error: err.message })

        // Se o endpoint expirou ou é inválido (Status 410 ou 404), marcar para exclusão
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredEndpoints.push(sub.endpoint)
        }
      }
    }

    // 3. Limpar endpoints expirados do banco de dados (Best Practice)
    if (expiredEndpoints.length > 0) {
      const { error: deleteError } = await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
      
      if (deleteError) {
        console.error('Erro ao excluir subscrições expiradas:', deleteError)
      } else {
        console.log(`Excluídas ${expiredEndpoints.length} subscrições expiradas/inválidas.`);
      }
    }

    return new Response(JSON.stringify({ results, cleaned: expiredEndpoints.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
