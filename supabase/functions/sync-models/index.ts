import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 从 OpenRouter 获取模型列表
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const modelsData = await response.json()
    const models = modelsData.data || []

    if (!models.length) {
      return new Response(
        JSON.stringify({ synced: 0, message: 'No models found' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 批量 upsert 模型数据
    const modelRecords = models.map((model: any) => ({
      id: model.id,
      canonical_slug: model.canonical_slug || null,
      hugging_face_id: model.hugging_face_id || null,
      name: model.name,
      created: model.created || null,
      description: model.description || null,
      context_length: model.context_length || null,
      architecture: model.architecture || null,
      pricing: model.pricing || null,
      top_provider: model.top_provider || null,
      per_request_limits: model.per_request_limits || null,
      supported_parameters: model.supported_parameters || [],
      last_synced_at: new Date().toISOString()
    }))

    // 使用 upsert 来插入或更新数据
    const { error } = await supabase
      .from('models')
      .upsert(modelRecords, {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        synced: models.length,
        message: `Successfully synced ${models.length} models`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Sync models error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})