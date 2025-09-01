import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 查询需要刷新的凭证（1小时内过期）
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    
    const { data: credentials, error } = await supabase
      .from('provider_credentials')
      .select('*, providers!inner(type, config)')
      .eq('credential_type', 'oauth_account')
      .not('oauth_data->>refresh_token', 'is', null)
      .lt('oauth_data->>expires_at', oneHourLater)

    if (error) throw error
    if (!credentials?.length) {
      return new Response(JSON.stringify({ refreshed: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let refreshed = 0
    
    for (const credential of credentials) {
      try {
        const providerType = credential.providers.type
        const providerConfig = credential.providers.config as any
        const oauthConfig = providerConfig?.oauth
        
        if (!oauthConfig) continue

        const oauthData = credential.oauth_data as any
        const body: any = {
          grant_type: 'refresh_token',
          client_id: oauthConfig.client_id,
          refresh_token: oauthData.refresh_token
        }
        
        // 添加 client_secret（如果有）
        if (oauthConfig.client_secret) {
          body.client_secret = oauthConfig.client_secret
        }
        
        // OpenAI 需要额外的 scope
        if (providerType === 'openai') {
          body.scope = 'openid profile email'
        }

        // 发送刷新请求
        const isJsonFormat = providerType === 'claude'
        const response = await fetch(oauthConfig.token_url, {
          method: 'POST',
          headers: {
            'Content-Type': isJsonFormat 
              ? 'application/json' 
              : 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: isJsonFormat 
            ? JSON.stringify(body)
            : new URLSearchParams(body).toString()
        })

        if (!response.ok) continue

        const tokens = await response.json()
        
        // 更新凭证
        await supabase
          .from('provider_credentials')
          .update({
            oauth_data: {
              ...oauthData,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || oauthData.refresh_token,
              expires_at: tokens.expires_in 
                ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                : null
            }
          })
          .eq('id', credential.id)

        refreshed++
      } catch (err) {
        console.error(`Failed to refresh ${credential.id}:`, err)
      }
    }

    return new Response(
      JSON.stringify({ refreshed, total: credentials.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})